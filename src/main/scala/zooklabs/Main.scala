package zooklabs

import cats.effect.{ExitCode, IO, IOApp, Resource, _}
import cats.implicits._
import doobie.hikari._
import doobie.util.ExecutionContexts
import eu.timepit.refined.auto.autoUnwrap
import fs2.Stream
import io.chrisdavenport.log4cats.Logger
import io.chrisdavenport.log4cats.slf4j.Slf4jLogger
import org.http4s.client.blaze.BlazeClientBuilder
import zooklabs.conf.Config
import zooklabs.db.Database
import zooklabs.program.{KeepAliveProgram, ServerProgram, UpdateLeagueProgram}

import scala.concurrent.ExecutionContext.global

object Main extends IOApp {

  def run(args: List[String]): IO[ExitCode] = {
    (for {
      implicit0(logger: Logger[IO]) <- Stream.eval(Slf4jLogger.create[IO])
      _                             <- Stream.eval {
                                         logger.info(s"ZookLabs Starting...")
                                       }
      conf                          <- Stream.resource(Resource.liftF(Config.load()))
      connEc                        <- Stream.resource(ExecutionContexts.fixedThreadPool[IO](20))
      txnEc                         <- Stream.resource(ExecutionContexts.cachedThreadPool[IO])

      transactor <- Stream.resource(
                      HikariTransactor
                        .newHikariTransactor[IO](
                          "org.postgresql.Driver",
                          conf.databaseConfig.host,
                          conf.databaseConfig.user,
                          conf.databaseConfig.password.value,
                          connEc,
                          Blocker.liftExecutionContext(txnEc)
                        )
                        .evalTap(Database.initialize)
                    )

      _           = transactor.configure(c => IO(c.setMaximumPoolSize(20)))

      leagueRepository = repository.LeagueRepository(transactor)
      zookRepository   = repository.ZookRepository(transactor)
      usersRepository  = repository.UserRepository(transactor)

      client <- Stream.resource(BlazeClientBuilder[IO](global).resource)

      serverProgram       =
        new ServerProgram(conf, client, leagueRepository, zookRepository, usersRepository)
      keepAliveProgram    = new KeepAliveProgram(client)
      updateLeagueProgram = new UpdateLeagueProgram(leagueRepository)

      service <- Stream(
                   serverProgram.run(),
                   keepAliveProgram.run(),
                   updateLeagueProgram.run()
                 ).parJoinUnbounded
    } yield service).compile.drain.as(ExitCode.Error)
  }
}
