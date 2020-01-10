package zooklabs.endpoints

import cats.data.EitherT
import cats.effect.IO
import cats.implicits._
import com.zooklabs.ZookCore
import io.circe.generic.auto._
import io.circe.syntax._
import org.http4s.circe._
import org.http4s.dsl.Http4sDsl
import org.http4s.multipart.Multipart
import org.http4s.{HttpRoutes, Request, Response}
import zooklabs.model.Zook
import zooklabs.repository.ZookRepository

import scala.util.Try

case class ZookEndpoints(zookRepository: ZookRepository) extends Http4sDsl[IO] {

  val getZookEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / id =>
      (for {
        id <- EitherT.fromEither[IO](
               Try(id.toInt).toOption.toRight(BadRequest())
             )
        zook <- EitherT(zookRepository.getZook(id).map(_.toRight(NotFound())))
      } yield zook).value.flatMap {
        case Left(resp)  => resp
        case Right(zook) => Ok(zook.asJson.dropNullValues)
      }
  }

  val listZooksEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root =>
      zookRepository.listZooks().flatMap(zooks => Ok(zooks.asJson.toString))
  }

  import cats.implicits._

  val uploadZookEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case req @ POST -> Root / "upload" =>
      if (req.contentLength.exists(_ > 100000)) {
        BadRequest("Request too big")
      } else {
        req.decode[Multipart[IO]] { e =>
          (for {
            zookPart <- EitherT.fromEither[IO](
                         e.parts
                           .find(_.name.contains("zook"))
                           .toRight(BadRequest("bruh.mp3"))
                       )
            _ <- EitherT.fromEither[IO](
                  zookPart.filename
                    .find(_.endsWith(".zook"))
                    .toRight[IO[Response[IO]]](BadRequest("Not a .zook file"))
                )
            contents <- EitherT
                         .right[IO[Response[IO]]](
                           zookPart.body.compile.toList.map(_.toArray)
                         )
            zook <- EitherT.fromEither[IO](
                     ZookCore
                       .parseZook(contents)
                       .bimap(
                         e => BadRequest("Error:" + e.toString),
                         Zook.fromCoreZook
                       )
                   )
            id <- EitherT
                   .right[IO[Response[IO]]](zookRepository.persistZook(zook))
            //TODO actually persist the zook & image
            //TODO discord callback
          } yield id).value.flatMap {
            case Left(resp) => resp
            case Right(id)  => Ok(UploadResponse(id).asJson.noSpaces)
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
