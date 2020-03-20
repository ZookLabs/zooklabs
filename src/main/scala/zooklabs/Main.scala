package zooklabs

import cats.effect.{ContextShift, ExitCode, IO, IOApp, Resource, _}
import cats.syntax.all._
import doobie.hikari._
import doobie.util.ExecutionContexts
import eu.timepit.refined.auto.autoUnwrap
import fs2.Stream
import org.http4s.Uri
import org.http4s.client.Client
import org.http4s.client.blaze.BlazeClientBuilder
import org.http4s.implicits._
import org.http4s.server.Router
import org.http4s.server.blaze.BlazeServerBuilder
import org.http4s.server.middleware._
import zooklabs.conf.Config
import zooklabs.db.Database
import zooklabs.endpoints.{HealthEndpoint, LeaguesEndpoints, ZookEndpoints}

import scala.concurrent.ExecutionContext.global
import scala.concurrent.duration._

object Main extends IOApp {
  implicit val cs: ContextShift[IO] =
    IO.contextShift(scala.concurrent.ExecutionContext.Implicits.global)

  def createServer(client: Client[IO]): Stream[IO, ExitCode] = {
    for {
      conf   <- Stream.resource(Resource.liftF(Config.load()))
      connEc <- Stream.resource(ExecutionContexts.fixedThreadPool[IO](20))
      txnEc  <- Stream.resource(ExecutionContexts.cachedThreadPool[IO])

      xa <- Stream.resource(
             HikariTransactor
               .newHikariTransactor[IO](
                 "org.postgresql.Driver",
                 conf.databaseConfig.host,
                 conf.databaseConfig.user,
                 conf.databaseConfig.password.value,
                 connEc,
                 Blocker.liftExecutionContext(txnEc)
               )
               .evalTap(Database.initialize))

      zookRepo  = repository.ZookRepository(xa)
      trialRepo = repository.TrialRepository(xa)

      httpApp = Router(
        "/health"      -> HealthEndpoint.endpoint,
        "/api/zooks"   -> ZookEndpoints(conf.persistenceConfig, conf.discordWebhook, zookRepo, client).endpoints,
        "/api/leagues" -> LeaguesEndpoints(trialRepo).endpoints
      ).orNotFound

      corsHttpApp = CORS(
        httpApp,
        CORS.DefaultCORSConfig
      )

      server <- BlazeServerBuilder[IO]
                 .bindHttp(conf.post, conf.host)
                 .withHttpApp(corsHttpApp)
                 .serve
    } yield server
  }

  def createKeepAlive(client: Client[IO]): Stream[IO, Unit] = {
    Stream
      .repeatEval(
        client.statusFromUri(Uri.unsafeFromString("http://api.zooklabs.com/health")).void
      )
      .metered(10.minutes)
  }

  def run(args: List[String]): IO[ExitCode] = {
    (for {
      client    <- Stream.resource(BlazeClientBuilder[IO](global).resource)
      server    = createServer(client)
      keepAlive = createKeepAlive(client)
      service   <- Stream(server, keepAlive).parJoinUnbounded
    } yield service).compile.drain.as(ExitCode.Success)
  }
}
