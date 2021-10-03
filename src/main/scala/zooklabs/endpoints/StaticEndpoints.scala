package zooklabs.endpoints

import cats.data.EitherT
import cats.effect.IO
import org.http4s.MediaType.{Binary, Compressible, NotBinary}
import org.http4s._
import org.http4s.dsl.Http4sDsl
import org.http4s.headers.{`Content-Disposition`, `Content-Type`}
import org.typelevel.ci.CIStringSyntax
import org.typelevel.log4cats.Logger
import zooklabs.repository.ZookRepository

import java.net.URL

class StaticEndpoints(zookRepository: ZookRepository)(implicit logger: Logger[IO])
    extends Http4sDsl[IO] {

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
