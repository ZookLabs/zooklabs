package zooklabs.endpoints

import java.net.URL

import cats.effect.{Blocker, ContextShift, IO}
import cats.implicits.{toFoldableOps, _}
import io.chrisdavenport.log4cats.Logger
import org.http4s._
import org.http4s.dsl.Http4sDsl

class StaticEndpoints(blocker: Blocker)(implicit
    contextShift: ContextShift[IO],
    logger: Logger[IO]
) extends Http4sDsl[IO] {

  val imageEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / "image" / id =>
      StaticFile
        .fromURL[IO](new URL(s"http://static.zooklabs.com/zooks/$id/image.png"), blocker)
        .getOrElseF(NotFound())
  }

  val endpoints: HttpRoutes[IO] = HttpRoutes.of[IO](imageEndpoint)
}
