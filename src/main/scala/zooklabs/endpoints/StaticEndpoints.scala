package zooklabs.endpoints

import java.net.URL

import cats.effect.IO
import cats.implicits.{toFoldableOps, _}
import org.typelevel.log4cats.Logger
import org.http4s._
import org.http4s.dsl.Http4sDsl

class StaticEndpoints()(implicit logger: Logger[IO]
) extends Http4sDsl[IO] {

  val imageEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / "image" / id =>
      StaticFile
        .fromURL[IO](new URL(s"http://static.zooklabs.com/zooks/$id/image.png"))
        .getOrElseF(NotFound())
  }

  val zookEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / "zooks" / id / name =>
      StaticFile
        .fromURL[IO](new URL(s"http://static.zooklabs.com/zooks/$id/$name.zook"))
        .getOrElseF(NotFound())
  }

  val endpoints: HttpRoutes[IO] = HttpRoutes.of[IO](imageEndpoint)
}
