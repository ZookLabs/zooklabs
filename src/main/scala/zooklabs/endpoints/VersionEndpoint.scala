package zooklabs.endpoints

import cats.effect.IO
import cats.implicits._
import org.http4s.HttpRoutes
import org.http4s.dsl.Http4sDsl
import zooklabs.BuildInfo

object VersionEndpoint extends Http4sDsl[IO] {

  val endpoint: HttpRoutes[IO] = HttpRoutes
    .of[IO] { case GET -> Root =>
      Ok(s"${BuildInfo.version}")
    }

}
