package zooklabs.endpoints

import java.nio.file.Files

import cats.data.EitherT
import cats.effect.{ContextShift, IO}
import cats.implicits._
import com.typesafe.scalalogging.LazyLogging
import com.zooklabs.ZookCore
import com.zooklabs.core.{ExampleZookError, GeneralZookError, ImageMissingError, StreetRulesError}
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.Url
import io.circe.generic.AutoDerivation
import org.http4s._
import org.http4s.circe._
import org.http4s.client.Client
import org.http4s.client.dsl.io._
import org.http4s.dsl.Http4sDsl
import org.http4s.headers.`Content-Type`
import org.http4s.multipart.{Multipart, Part}
import zooklabs.conf.PersistenceConfig
import zooklabs.endpoints.discord.{DiscordError, DiscordWebhook, Field, Thumbnail}
import zooklabs.model.Zook
import zooklabs.model.Zook.encodeZook
import zooklabs.repository.ZookRepository

import scala.util.Try

case class ZookEndpoints(persistenceConfig: PersistenceConfig,
                         discordWebhook: String Refined Url,
                         zookRepository: ZookRepository,
                         httpClient: Client[IO])(implicit contextShift: ContextShift[IO])
    extends Http4sDsl[IO]
    with LazyLogging
    with AutoDerivation
    with CirceEntityDecoder
    with CirceEntityEncoder {

  val getZookEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / id =>
      (for {
        id <- EitherT.fromEither[IO](
               Try(id.toInt).toOption.toRight(BadRequest())
             )
        zook <- EitherT(zookRepository.getZook(id).map(_.toRight(NotFound())))
      } yield zook).value.flatMap {
        case Left(resp)  => resp
        case Right(zook) => Ok(zook)
      }
  }

  val listZooksEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root =>
      zookRepository.listZooks().flatMap(zooks => Ok(zooks))
  }

  val ZOOK    = "zook"
  val ZOOKEXT = s".$ZOOK"
  val ZOOKS   = s"${ZOOK}s"
  val IMAGE   = "image.png"

  import io.circe.syntax._

  val uploadZookEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case req @ POST -> Root / "upload" =>
      if (req.contentLength.exists(_ > 100000)) {
        BadRequest(APIError("File Too Big"))
      } else {
        req.decode[Multipart[IO]] { e =>
          (for {
            zookPart <- EitherT.fromEither[IO](
                         e.parts
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
            zook <- EitherT.fromEither[IO](
                     ZookCore
                       .parseZook(zookBytes)
                       .leftMap {
                         case ImageMissingError => APIError("Passport Photo Required!")
                         case StreetRulesError =>
                           APIError("Street Rules Zooks are not currently supported!")
                         case GeneralZookError(_) => APIError("Somethings wrong with that Zook!")
                         case ExampleZookError    => APIError("Cannot Upload Example Zooks!")
                       })
            id <- EitherT
                   .right[APIError](zookRepository.persistZook(Zook.fromCoreZook(zook)))

            zookPath = persistenceConfig.path.resolve(ZOOKS).resolve(id.toString)
            _        <- EitherT.right[APIError](IO(Files.createDirectories(zookPath)))
            _ <- EitherT(
                  IO(
                    Try(Files.write(zookPath.resolve(zook.name + ZOOKEXT), zookBytes)).toEither
                      .leftMap(exception => {
                        logger.error(s"Zook persistence error : ${exception.getLocalizedMessage}")
                        APIError("Problem writing Zook")
                      }))
                )
            _ <- EitherT(
                  IO(
                    Try(Files.write(zookPath.resolve(IMAGE), zook.image.imageBytes)).toEither
                      .leftMap(exception => {
                        logger.error(
                          s"Zook Image persistence error : ${exception.getLocalizedMessage}")
                        APIError("Problem writing Zook Image")
                      }))
                )

            multipart = Multipart[IO](
              Vector(
                Part.formData(
                  "payload_json",
                  DiscordWebhook(
                    embeds = List(
                      discord.Embed(
                        title = zook.name,
                        url = s"https://zooklabs.com/zooks/$id",
                        color = 16725286,
                        thumbnail = Thumbnail("attachment://image.png"),
                        fields = List(
                          Field(name = "Physical",
                                value = "Height\nLength\nWidth\nWeight\nComponents"),
                          Field(
                            name = "Measurement",
                            value = s"""${zook.passport.physical.height.data} cm
                               |${zook.passport.physical.length.data} cm
                               |${zook.passport.physical.width.data} cm
                               |${zook.passport.physical.weight.data} kg
                               |${zook.passport.physical.components.data}""".stripMargin
                          )
                        )
                      )
                    )
                  ).asJson.toString
                ),
                Part.fileData("file",
                              "image.png",
                              fs2.Stream.emits(zook.image.imageBytes),
                              `Content-Type`(MediaType.image.png))
              ))

            _ <- EitherT(
                  httpClient.fetch(
                    POST(
                      multipart,
                      Uri.unsafeFromString(discordWebhook.toString)
                    ).map(_.withHeaders(multipart.headers))) {
                    case Ok(_) => IO.pure(Unit.asRight[APIError])
                    case resp =>
                      resp
                        .decodeJson[DiscordError]
                        .map(error => {
                          logger.error(
                            s"Request $req failed with status ${resp.status.code} and DiscordError $error")
                          APIError("Problem posting to Discord").asLeft[Unit]
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

  case class UploadResponse(id: Int)

  val endpoints: HttpRoutes[IO] = {

    HttpRoutes.of[IO](
      getZookEndpoint orElse listZooksEndpoint orElse uploadZookEndpoint
    )
  }
}
