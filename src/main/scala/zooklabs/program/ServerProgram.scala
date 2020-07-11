package zooklabs.program

import cats.effect.{ContextShift, ExitCode, IO, _}
import cats.implicits._
import eu.timepit.refined.auto.autoUnwrap
import fs2.Stream
import io.chrisdavenport.log4cats.Logger
import org.http4s.client.Client
import org.http4s.implicits._
import org.http4s.server.Router
import org.http4s.server.blaze.BlazeServerBuilder
import org.http4s.server.middleware.CORS
import zooklabs.conf.AppConfig
import zooklabs.endpoints.{HealthEndpoint, LeaguesEndpoints, ZookEndpoints}
import zooklabs.repository.{LeagueRepository, ZookRepository}

final class ServerProgram(conf: AppConfig,
                          client: Client[IO],
                          leagueRepository: LeagueRepository,
                          zookRepository: ZookRepository)(implicit logger: Logger[IO],
                                                          contextShift: ContextShift[IO],
                                                          timer: Timer[IO]) {

  def run(): Stream[IO, ExitCode] = {

    val httpApp = Router(
      "/health" -> HealthEndpoint.endpoint,
      "/api/zooks" -> ZookEndpoints(conf.persistenceConfig,
                                    conf.discordWebhook,
                                    zookRepository,
                                    client).endpoints,
      "/api/leagues" -> LeaguesEndpoints(leagueRepository).endpoints
    ).orNotFound

    val corsHttpApp = CORS(
      httpApp,
      CORS.DefaultCORSConfig
    )
    BlazeServerBuilder[IO]
      .bindHttp(conf.post, conf.host)
      .withHttpApp(corsHttpApp)
      .serve
  }
}
