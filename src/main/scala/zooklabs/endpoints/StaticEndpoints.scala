package zooklabs.endpoints

import cats.effect.IO
import fs2.io.file.{Path => FS2Path}
import org.http4s.MediaType.{Compressible, NotBinary}
import org.http4s._
import org.http4s.dsl.Http4sDsl
import org.http4s.headers.{`Content-Disposition`, `Content-Type`}
import org.typelevel.ci.CIStringSyntax
import org.typelevel.log4cats.Logger
import zooklabs.conf.PersistenceConfig
import zooklabs.repository.ZookRepository

class StaticEndpoints(zookRepository: ZookRepository, persistenceConfig: PersistenceConfig)(implicit
    logger: Logger[IO]
) extends Http4sDsl[IO] {

  val imageEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / "zooks" / id / "image.png" =>
      StaticFile
        .fromPath[IO](FS2Path.fromNioPath(persistenceConfig.path).resolve(s"zooks/$id/image.png"))
        .getOrElseF(NotFound())
  }

  val zookEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / "zooks" / id / name =>
      StaticFile
        .fromPath[IO](FS2Path.fromNioPath(persistenceConfig.path).resolve(s"zooks/$id/$name.zook"))
        .map(
          _.withContentType(
            `Content-Type`(
              new MediaType(
                mainType = "application",
                subType = "bamzooki",
                compressible = Compressible,
                binary = NotBinary,
                fileExtensions = List("zook")
              )
            )
          )
        )
        .map(
          _.withHeaders(
            `Content-Disposition`(
              "form-data",
              Map(ci"name" -> name, ci"filename" -> s"$name.zook")
            )
          )
        )
        .semiflatTap(_ => zookRepository.incrementDownloads(id.toInt))
        .getOrElseF(NotFound())
  }

  val endpoints: HttpRoutes[IO] = HttpRoutes.of[IO](imageEndpoint orElse zookEndpoint)
}
