package zooklabs.endpoints

import cats.effect.IO
import org.http4s.HttpRoutes
import org.http4s.dsl.Http4sDsl

object HealthEndpoint extends Http4sDsl[IO] {
  val endpoint: HttpRoutes[IO] = {
    HttpRoutes
      .of[IO] { case GET -> Root =>
        Ok("hello")
      }
  }
}
