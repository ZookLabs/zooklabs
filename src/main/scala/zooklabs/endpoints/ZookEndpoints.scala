package zooklabs.endpoints

import cats.data.EitherT
import cats.effect.IO
import cats.implicits._
import com.zooklabs.ZookCore
import com.zooklabs.core.{ExampleZookError, GeneralZookError, ImageMissingError, StreetRulesError}
import com.zooklabs.zook.{Zook => CoreZook}
import eu.timepit.refined.types.all.{NonEmptyString, NonNegInt}
import io.circe.Encoder
import io.circe.generic.AutoDerivation
import io.circe.refined.refinedEncoder
import io.circe.syntax._
import org.http4s._
import org.http4s.circe._
import org.http4s.client.Client
import org.http4s.client.dsl.io._
import org.http4s.dsl.Http4sDsl
import org.http4s.headers.{`Content-Type`, `Set-Cookie`}
import org.http4s.multipart.{Multipart, Part}
import org.http4s.server.AuthMiddleware
import org.typelevel.log4cats.Logger
import zooklabs.conf.AppConfig
import zooklabs.endpoints.discord.{DiscordWebhook, DiscordWebhookError, Field, Thumbnail}
import zooklabs.endpoints.model.AuthUser
import zooklabs.model.ZookTrial
import zooklabs.persistence.Persistence
import zooklabs.repository.ZookRepository
import zooklabs.repository.model.{ZookContainer, ZookEntity}

import java.time.LocalDateTime

class ZookEndpoints(
    persistence: Persistence,
    discordWebhook: Uri,
    zookRepository: ZookRepository,
    httpClient: Client[IO],
    permissiveSecureMiddleware: AuthMiddleware[IO, AuthUser],
    config: AppConfig
)(implicit logger: Logger[IO])
    extends Http4sDsl[IO]
    with AutoDerivation
    with CirceEntityDecoder
    with CirceEntityEncoder {

  val getZookEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case context @ GET -> Root / id =>
      (for {
        id   <- EitherT.fromEither[IO](id.toIntOption.toRight(BadRequest()))
        zook <- EitherT(zookRepository.getZook(id).map(_.toRight(NotFound())))
        cookieId   = s"zv_$id"
        viewCookie = context.cookies.find(_.name == cookieId)
        _ <- EitherT.right[IO[Response[IO]]](
          viewCookie.fold(zookRepository.incrementViews(id))(_ => IO.unit)
        )
        viewedCookie = Header.ToRaw.foldablesToRaw(
          Option.when(viewCookie.isEmpty)(
            `Set-Cookie`(
              ResponseCookie(
                cookieId,
                "",
                maxAge = Some(60 * 60 * 24),
                domain = Some(config.corsHost.host.value),
                sameSite = Some(SameSite.None),
                secure = true,
                httpOnly = true
              )
            )
          )
        )
      } yield (zook, viewedCookie)).value.flatMap {
        case Left(resp)                  => resp
        case Right((zook, viewedCookie)) => Ok(zook, viewedCookie)
      }
  }

  val listZooksEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = { case GET -> Root =>
    zookRepository.listZooks().flatMap(zooks => Ok(zooks))
  }

  def makeZookEntity(coreZook: CoreZook, ownerId: Option[Int]) = {
    val physical  = coreZook.passport.physical
    val ownership = coreZook.passport.ownership
    ZookEntity(
      name =
        NonEmptyString.unsafeFrom(ownership.last.zookname), // FIXME pase zook with refined types
      height = physical.height.data,
      length = physical.length.data,
      width = physical.width.data,
      weight = physical.weight.data,
      components = physical.components.data,
      dateCreated = ownership.last.adoptionDate,
      dateUploaded = LocalDateTime.now(),
      owner = ownerId,
      downloads = 0,
      views = 0
    )
  }

  def makeZookContainer(coreZook: CoreZook, ownerId: Option[Int]) = {
    val zook = makeZookEntity(coreZook, ownerId)

    val trial = coreZook.passport.achievement.trial
    ZookContainer(
      zook,
      sprint = trial.sprint.map(ZookTrial.fromCoreZookTrial),
      blockPush = trial.blockPush.map(ZookTrial.fromCoreZookTrial),
      hurdles = trial.hurdles.map(ZookTrial.fromCoreZookTrial),
      highJump = trial.highJump.map(ZookTrial.fromCoreZookTrial),
      lap = trial.lap.map(ZookTrial.fromCoreZookTrial)
    )
  }

  val ZOOK    = "zook"
  val ZOOKEXT = s".$ZOOK"

  val uploadZookEndpoint: PartialFunction[AuthedRequest[IO, AuthUser], IO[Response[IO]]] = {
    case context @ POST -> Root / "upload" as user =>
      if (context.req.contentLength.exists(_ > 100000)) { // 100 kb
        BadRequest(APIError("File Too Big"))
      } else {
        context.req.decode[Multipart[IO]] { reqPart =>
          (for {
            zookPart <- EitherT.fromEither[IO](
              reqPart.parts
                .find(_.name.contains(ZOOK))
                .toRight(APIError("No zook form field"))
            )
            _ <- EitherT.fromEither[IO](
              zookPart.filename
                .find(_.endsWith(ZOOKEXT))
                .toRight[APIError](APIError("Not a .zook file"))
            )
            zookBytes <- EitherT
              .right[APIError](
                zookPart.body.compile.toList.map(_.toArray)
              )
            coreZook <-
              EitherT.fromEither[IO](
                ZookCore
                  .parseZook(zookBytes)
                  .leftMap {
                    case ImageMissingError => APIError("Passport Photo Required!")
                    case StreetRulesError =>
                      APIError("Street Rules Zooks are not currently supported!")
                    case GeneralZookError(_) => APIError("Somethings wrong with that Zook!")
                    case ExampleZookError    => APIError("Cannot Upload Example Zooks!")
                  }
              )

            zookContainer = makeZookContainer(coreZook, user.getId)

            id <- EitherT.right[APIError](zookRepository.persistZook(zookContainer))

            _ <-
              EitherT(persistence.writeZook(id.toString, coreZook.name, zookBytes).attempt)
                .leftSemiflatMap(exception => {
                  logger
                    .error(s"Zook persistence error : ${exception.getLocalizedMessage}") >>
                    APIError("Problem writing Zook").pure[IO]
                })

            _ <-
              EitherT(persistence.writeImage(id.toString, coreZook.image.imageBytes).attempt)
                .leftSemiflatMap(exception => {
                  logger
                    .error(s"Zook Image persistence error : ${exception.getLocalizedMessage}") >>
                    APIError("Problem writing Zook Image").pure[IO]
                })

            multipart = Multipart[IO](
              Vector(
                Part.formData(
                  "payload_json",
                  DiscordWebhook(
                    embeds = List(
                      discord.Embed(
                        title = coreZook.name,
                        url = s"https://zooklabs.com/zooks/$id",
                        color = 16725286,
                        description =
                          user.username.map(username => s"__Uploaded By__:\n**$username**"),
                        thumbnail = Thumbnail("attachment://image.png"),
                        fields = List(
                          Field(
                            name = "Physical",
                            value = "Height\nLength\nWidth\nWeight\nComponents"
                          ),
                          Field(
                            name = "Measurement",
                            value = s"""${coreZook.passport.physical.height.data} cm
                               |${coreZook.passport.physical.length.data} cm
                               |${coreZook.passport.physical.width.data} cm
                               |${coreZook.passport.physical.weight.data} kg
                               |${coreZook.passport.physical.components.data}""".stripMargin
                          )
                        )
                      )
                    )
                  ).asJson.toString
                ),
                Part.fileData(
                  "file",
                  "image.png",
                  fs2.Stream.emits(coreZook.image.imageBytes),
                  `Content-Type`(MediaType.image.png)
                )
              )
            )

            _ <-
              EitherT(
                httpClient
                  .run(
                    POST(
                      multipart,
                      discordWebhook
                    ).withHeaders(multipart.headers)
                  )
                  .use {
                    case Ok(_) => IO.pure(().asRight[APIError])
                    case resp =>
                      resp
                        .decodeJson[DiscordWebhookError]
                        .flatMap(error => {
                          logger.error(
                            s"Request failed with status ${resp.status.code} and DiscordError $error [${context.req}]"
                          ) >>
                            APIError("Problem posting to Discord").asLeft[Unit].pure[IO]
                        })
                  }
              )
          } yield id).value.flatMap {
            case Left(resp) => BadRequest(resp)
            case Right(id)  => Ok(UploadResponse(id))
          }
        }
      }
  }

  case class UploadResponse(id: NonNegInt)

  object UploadResponse {

    implicit val encodeUploadResponse: Encoder[UploadResponse] =
      Encoder.forProduct1(
        "id"
      )(_.id)
  }

  val endpoints: HttpRoutes[IO] = {
    HttpRoutes.of[IO](
      getZookEndpoint orElse listZooksEndpoint
    ) <+> permissiveSecureMiddleware(AuthedRoutes.of(uploadZookEndpoint))
  }
}
