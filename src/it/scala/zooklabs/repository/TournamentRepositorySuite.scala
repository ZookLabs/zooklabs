package zooklabs.repository

import cats.effect.IO
import cats.implicits.catsSyntaxOptionId
import doobie.Transactor
import doobie.scalatest.IOChecker
import org.flywaydb.core.Flyway
import org.scalatest.BeforeAndAfterAll
import org.scalatest.funsuite.AnyFunSuite

import java.time.{Clock, Instant, LocalDateTime, ZoneId}
import java.util.concurrent.Executors
import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}

class TournamentRepositorySuite extends AnyFunSuite with IOChecker with BeforeAndAfterAll {

  val now: Instant                    = Instant.ofEpochSecond(1601324567)
  val nowLocalDateTime: LocalDateTime = LocalDateTime.now(Clock.fixed(now, ZoneId.systemDefault()))

  val blockingEc: ExecutionContextExecutor =
    ExecutionContext.fromExecutor(Executors.newCachedThreadPool)

  val transactor: doobie.Transactor[IO] = Transactor.fromDriverManager[IO](
    "org.postgresql.Driver",
    "jdbc:postgresql://localhost:5432/zooklabs",
    "Bernard",
    "Nosey"
  )

  val tournamentRepository: TournamentRepository = TournamentRepository(transactor)

  override def beforeAll() {
    Flyway
      .configure()
      .dataSource(
        "jdbc:postgresql://localhost:5432/zooklabs",
        "Bernard",
        "Nosey"
      )
      .load()
      .migrate()
  }

  test("listTournamentsQuery type checks") {
    check(tournamentRepository.listTournamentsQuery())
  }

  test("getTournamentQuery type checks") {
    check(tournamentRepository.getTournamentQuery(1))
  }
}
