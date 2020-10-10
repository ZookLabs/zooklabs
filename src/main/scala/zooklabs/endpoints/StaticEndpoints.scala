package zooklabs.endpoints

import java.nio.file
import java.nio.file.Files

import cats.effect.{Blocker, ContextShift, IO}
import cats.implicits.{toFoldableOps, _}
import fs2.io.file.readAll
import io.chrisdavenport.log4cats.Logger
import org.http4s.StaticFile.DefaultBufferSize
import org.http4s._
import org.http4s.dsl.Http4sDsl
import org.http4s.headers.`Content-Type`
import zooklabs.endpoints.StaticEndpoints.nameToContentType
import zooklabs.persistence.Persistence

class StaticEndpoints(persistence: Persistence[IO], blocker: Blocker)(implicit
    contextShift: ContextShift[IO],
    logger: Logger[IO]
) extends Http4sDsl[IO] {

  val imageEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case req @ GET -> Root / "image" / id => //TODO use req to calculate if notModified
      val pth: file.Path = persistence.imagePath(id)
      if (Files.isRegularFile(pth)) {
        IO.delay {
          Response(
            headers = Headers(nameToContentType(pth.getFileName.toString).toList),
            body = readAll[IO](pth, blocker, DefaultBufferSize)
          )
        }
      } else {
        NotFound()
      }
  }

  val endpoints: HttpRoutes[IO] = HttpRoutes.of[IO](imageEndpoint)
}

object StaticEndpoints {

  //Lifted from org.http4s.StaticFile

  private def nameToContentType(name: String): Option[`Content-Type`] =
    name.lastIndexOf('.') match {
      case -1 => None
      case i  => MediaType.forExtension(name.substring(i + 1)).map(`Content-Type`(_))
    }

}
