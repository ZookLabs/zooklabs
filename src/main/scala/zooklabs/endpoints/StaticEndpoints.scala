package zooklabs.endpoints

import cats.data.EitherT
import cats.effect.IO
import org.http4s._
import org.http4s.dsl.Http4sDsl
import org.typelevel.log4cats.Logger
import zooklabs.repository.ZookRepository

import java.net.URL

class StaticEndpoints(zookRepository: ZookRepository)(implicit logger: Logger[IO]
) extends Http4sDsl[IO] {

  val imageEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / "image" / id =>
      StaticFile
        .fromURL[IO](new URL(s"http://static.zooklabs.com/zooks/$id/image.png"))
        .getOrElseF(NotFound())
  }

  val zookEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / "zooks" / id / name => {
      (for {
        id <- EitherT.fromEither[IO](id.toIntOption.toRight(BadRequest()))
        _ <- EitherT.right(zookRepository.incrementDownloads(id))
      } yield ()).value.flatMap {
        case Left(resp) => resp
        case Right(_) => StaticFile
          .fromURL[IO](new URL(s"http://static.zooklabs.com/zooks/$id/$name.zook"))
          .getOrElseF(NotFound())
      }
    }
  }

  val endpoints: HttpRoutes[IO] = HttpRoutes.of[IO](imageEndpoint orElse zookEndpoint)
}
