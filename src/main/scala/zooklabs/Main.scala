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
import zooklabs.`enum`.Trials
import zooklabs.conf.{AppConfig, Config}
import zooklabs.db.Database
import zooklabs.endpoints.{HealthEndpoint, LeaguesEndpoints, ZookEndpoints}
import zooklabs.repository.{LeagueRepository, ZookRepository}

import scala.concurrent.ExecutionContext.global
import scala.concurrent.duration._

object Main extends IOApp {
  implicit val cs: ContextShift[IO] =
    IO.contextShift(scala.concurrent.ExecutionContext.Implicits.global)

  def createServer(conf: AppConfig,
                   client: Client[IO],
                   leagueRepository: LeagueRepository,
                   zookRepository: ZookRepository): Stream[IO, ExitCode] = {

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

  def createKeepAlive(client: Client[IO]): Stream[IO, Unit] = {
    Stream
      .repeatEval(
        client.statusFromUri(Uri.unsafeFromString("http://api.zooklabs.com/health")).void
      )
      .metered(10.minutes)
  }

  def createUpdateLeague(leagueRepository: LeagueRepository): Stream[IO, Unit] = {
    Stream
      .emit(Trials.values)
      .metered[IO](1.hour)
      .flatMap(Stream.emits)
      .evalTap(leagueRepository.updateLeagueOrder)
      .repeat
      .void
  }

  def run(args: List[String]): IO[ExitCode] = {
    (for {

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

      leagueRepository = repository.LeagueRepository(xa)
      zookRepository   = repository.ZookRepository(xa)

      client       <- Stream.resource(BlazeClientBuilder[IO](global).resource)
      server       = createServer(conf, client, leagueRepository, zookRepository)
      keepAlive    = createKeepAlive(client)
      updateLeague = createUpdateLeague(leagueRepository)
      service      <- Stream(server, keepAlive, updateLeague).parJoinUnbounded
    } yield service).compile.drain.as(ExitCode.Success)
  }
}
