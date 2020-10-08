package zooklabs.endpoints

import cats.effect.{Blocker, ContextShift, IO}
import cats.syntax.option._
import io.chrisdavenport.log4cats.Logger
import org.http4s.dsl.Http4sDsl
import org.http4s.{HttpRoutes, Request, Response, StaticFile}
import zooklabs.persistence.Persistence

class StaticEndpoints(persistence: Persistence[IO], blocker: Blocker)(implicit
    contextShift: ContextShift[IO],
    logger: Logger[IO]
) extends Http4sDsl[IO] {

  val imageEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case req @ GET -> Root / "image" / id =>
      StaticFile
        .fromFile(persistence.imagePath(id).toFile, blocker, req.some)
        .getOrElseF(NotFound())
  }

  val endpoints: HttpRoutes[IO] = HttpRoutes.of[IO](imageEndpoint)
}
