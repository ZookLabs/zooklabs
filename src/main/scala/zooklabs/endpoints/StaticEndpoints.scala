package zooklabs.endpoints

import java.nio.file
import java.nio.file.{Files, Path}

import cats.effect.{Blocker, ContextShift, IO}
import cats.implicits.{toFoldableOps, _}
import fs2.io.file.readRange
import io.chrisdavenport.log4cats.Logger
import org.http4s.StaticFile.DefaultBufferSize
import org.http4s._
import org.http4s.dsl.Http4sDsl
import org.http4s.headers.{ETag, `Content-Length`, `Content-Type`, `Last-Modified`}
import zooklabs.endpoints.StaticEndpoints.{calcETag, nameToContentType}
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
          val start = 0
          val end   = Files.size(pth)

          val lastModified = HttpDate.fromInstant(Files.getLastModifiedTime(pth).toInstant).toOption

          val body = readRange[IO](pth, blocker, DefaultBufferSize, start, end)

          val contentLength = end - start

          val contentType = nameToContentType(pth.getFileName.toString)

          val etagCalc = calcETag(pth)

          val hs =
            lastModified.map(lm => `Last-Modified`(lm)).toList :::
              `Content-Length`
                .fromLong(contentLength)
                .toList ::: contentType.toList ::: List(ETag(etagCalc))

          Response(
            headers = Headers(hs),
            body = body
          )
        }

      } else {
        NotFound()
      }
  }

  val endpoints: HttpRoutes[IO] = HttpRoutes.of[IO](imageEndpoint)
}

object StaticEndpoints {

  def calcETag(path: Path): String =
    if (Files.isRegularFile(path))
      s"${Files.getLastModifiedTime(path).toMillis.toHexString}-${Files.size(path).toHexString}"
    else ""

  //Lifted from org.http4s.StaticFile

  private def nameToContentType(name: String): Option[`Content-Type`] =
    name.lastIndexOf('.') match {
      case -1 => None
      case i  => MediaType.forExtension(name.substring(i + 1)).map(`Content-Type`(_))
    }

}
