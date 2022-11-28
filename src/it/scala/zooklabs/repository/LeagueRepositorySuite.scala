package zooklabs.repository

import java.util.concurrent.Executors

import cats.effect.IO
import doobie.Transactor
import doobie.scalatest.IOChecker
import org.flywaydb.core.Flyway
import org.scalatest.BeforeAndAfterAll
import org.scalatest.funsuite.AnyFunSuite
import zooklabs.`enum`.Trials

import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}

class LeagueRepositorySuite extends AnyFunSuite with IOChecker with BeforeAndAfterAll {

  val transactor: doobie.Transactor[IO] = Transactor.fromDriverManager[IO](
    "org.postgresql.Driver",
    "jdbc:postgresql://localhost:5432/zooklabs",
    "Bernard",
    "Nosey"
  )

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

  test("listLeagueQuery type checks") {
    check(LeagueRepository.listLeagueQuery(Trials.Lap))
  }

  test("getLeagueUpdatedAtQuery type checks") {
    check(LeagueRepository.getLeagueUpdatedAtQuery(Trials.Lap))
  }

  test("updateLeagueOrderQuery type checks") {
    check(LeagueRepository.updateLeagueOrderQuery(Trials.Lap))
  }

  test("updateDisqualifiedQuery type checks") {
    check(LeagueRepository.updateDisqualifiedQuery(Trials.Lap))
  }

  test("getLeaderQuery type checks") {
    check(LeagueRepository.getLeaderQuery(Trials.Lap))
  }

  test("getCountQuery type checks") {
    check(LeagueRepository.getCountQuery(Trials.Lap))
  }

  test("getRanksQuery type checks") {
    check(LeagueRepository.getRanksQuery)
  }

  test("insertOverallLeagueDataQuery type checks") {
    check(LeagueRepository.insertOverallLeagueDataQuery)
  }
}
