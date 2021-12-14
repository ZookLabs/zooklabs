package zooklabs.endpoints

import cats.effect.IO
import fs2.io.file.{Path => FS2Path}
import org.http4s.MediaType.{Compressible, NotBinary}
import org.http4s._
import org.http4s.dsl.Http4sDsl
import org.http4s.headers.{Origin, `Content-Disposition`, `Content-Type`, `Set-Cookie`}
import org.typelevel.ci.CIStringSyntax
import org.typelevel.log4cats.Logger
import zooklabs.conf.PersistenceConfig
import zooklabs.repository.ZookRepository

class StaticEndpoints(
    zookRepository: ZookRepository,
    persistenceConfig: PersistenceConfig,
    corsHost: Origin.Host
)(implicit
    logger: Logger[IO]
) extends Http4sDsl[IO] {

  val imageEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / "zooks" / id / "image.png" =>
      StaticFile
        .fromPath[IO](FS2Path.fromNioPath(persistenceConfig.path).resolve(s"zooks/$id/image.png"))
        .getOrElseF(NotFound())
  }

  val zookEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case context @ GET -> Root / "zooks" / id / name =>
      StaticFile
        .fromPath[IO](FS2Path.fromNioPath(persistenceConfig.path).resolve(s"zooks/$id/$name"))
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
              Map(ci"name" -> name, ci"filename" -> name)
            )
          )
        )
        .semiflatMap(response => {

          val cookieId   = s"zd_$id"
          val viewCookie = context.cookies.find(_.name == cookieId)

          val viewedCookie = Header.ToRaw.foldablesToRaw(
            Option.when(viewCookie.isEmpty)(
              `Set-Cookie`(
                ResponseCookie(
                  cookieId,
                  "",
                  maxAge = Some(60 * 60 * 24),
                  domain = Some(corsHost.host.value),
                  sameSite = Some(SameSite.None),
                  secure = true,
                  httpOnly = true
                )
              )
            )
          )

          viewCookie
            .fold(zookRepository.incrementDownloads(id.toInt))(_ => IO.unit)
            .as(response.withHeaders(viewedCookie))
        })
        .getOrElseF(NotFound())
  }

  val endpoints: HttpRoutes[IO] = HttpRoutes.of[IO](imageEndpoint orElse zookEndpoint)
}
