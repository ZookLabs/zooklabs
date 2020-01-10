package zooklabs

import cats.effect.{ExitCode, IO, IOApp, Resource, _}
import cats.syntax.all._
import doobie.hikari._
import doobie.util.ExecutionContexts
import eu.timepit.refined.auto.autoUnwrap
import org.http4s.implicits._
import org.http4s.server.blaze.BlazeServerBuilder
import org.http4s.server.middleware._
import org.http4s.server.{Router, Server}
import zooklabs.conf.Config
import zooklabs.db.Database
import zooklabs.endpoints.{LeaguesEndpoints, ZookEndpoints}

import scala.concurrent.duration._

object Main extends IOApp {

  def createServer: Resource[IO, Server[IO]] = {
    for {
      conf   <- Resource.liftF(Config.load())
      connEc <- ExecutionContexts.fixedThreadPool[IO](20)
      txnEc  <- ExecutionContexts.cachedThreadPool[IO]

      xa <- HikariTransactor
             .newHikariTransactor[IO](
               "org.postgresql.Driver",
               conf.databaseConfig.host,
               conf.databaseConfig.user,
               conf.databaseConfig.password.value,
               connEc,
               Blocker.liftExecutionContext(txnEc)
             )
             .evalTap(Database.initialize)

      zookRepo  = repository.ZookRepository(xa)
      trialRepo = repository.TrialRepository(xa)

      httpApp = Router(
        "/api/zook"   -> ZookEndpoints(zookRepo).endpoints,
        "/api/league" -> LeaguesEndpoints(trialRepo).endpoints
      ).orNotFound

      httpAppMiddleWare = CORS(
        httpApp,
        CORSConfig(
          anyOrigin = true,
          anyMethod = false,
          allowedMethods = Some(Set("GET", "POST")),
          allowCredentials = true,
          maxAge = 1.day.toSeconds
        )
      )

      server <- BlazeServerBuilder[IO]
                 .bindHttp(port = conf.apiPort)
                 .withHttpApp(httpAppMiddleWare)
                 .resource
    } yield server
  }

  def run(args: List[String]): IO[ExitCode] =
    createServer.use(_ => IO.never).as(ExitCode.Success)
}
