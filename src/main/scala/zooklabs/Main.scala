package zooklabs

import cats.effect.{ExitCode, IO, IOApp, Resource}
import cats.implicits._
import doobie.util.ExecutionContexts
import fs2.Stream
import org.http4s.blaze.client._
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger
import zooklabs.conf.Config
import zooklabs.db.Database
import zooklabs.persistence.PersistenceImpl
import zooklabs.program.{KeepAliveProgram, ServerProgram, UpdateLeagueProgram}

object Main extends IOApp {

  def run(args: List[String]): IO[ExitCode] = {
    (for {
      implicit0(logger: Logger[IO]) <- Stream.eval(Slf4jLogger.create[IO])
      _ <- Stream.eval {
        logger.info(s"ZookLabs Starting...")
      }
      conf <- Stream.resource(Resource.eval(Config.load()))

      transactor <- Stream.resource(Database.makeTransactor[IO](conf.databaseConfig))
      _          <- Stream.eval(Database.initialize(transactor))

      leagueRepository     = repository.LeagueRepository(transactor)
      zookRepository       = repository.ZookRepository(transactor)
      usersRepository      = repository.UserRepository(transactor)
      tournamentRepository = repository.TournamentRepository(transactor)

      clientEc <- Stream.resource(ExecutionContexts.fixedThreadPool[IO](2))
      client   <- Stream.resource(BlazeClientBuilder[IO](clientEc).resource)

      persistence = new PersistenceImpl[IO](conf.persistenceConfig)

      executionContext <- Stream.eval(IO.executionContext)

      serverProgram =
        new ServerProgram(
          conf = conf,
          client = client,
          leagueRepository = leagueRepository,
          zookRepository = zookRepository,
          usersRepository = usersRepository,
          tournamentRepository = tournamentRepository,
          persistence = persistence,
          executionContext = executionContext
        )

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
