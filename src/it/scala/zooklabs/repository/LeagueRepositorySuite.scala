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

  val blockingEc: ExecutionContextExecutor =
    ExecutionContext.fromExecutor(Executors.newCachedThreadPool)

  val transactor: doobie.Transactor[IO] = Transactor.fromDriverManager[IO](
    "org.postgresql.Driver",
    "jdbc:postgresql://localhost:5432/zooklabs",
    "Bernard",
    "Nosey"
  )

  val leagueRepository: LeagueRepository = LeagueRepository(transactor)

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
    check(leagueRepository.listLeagueQuery(Trials.Lap))
  }

  test("getLeagueUpdatedAtQuery type checks") {
    check(leagueRepository.getLeagueUpdatedAtQuery(Trials.Lap))
  }

  test("updateLeagueOrderQuery type checks") {
    check(leagueRepository.updateLeagueOrderQuery(Trials.Lap))
  }

  test("updateDisqualifiedQuery type checks") {
    check(leagueRepository.updateDisqualifiedQuery(Trials.Lap))
  }

  test("getLeaderQuery type checks") {
    check(leagueRepository.getLeaderQuery(Trials.Lap))
  }

  test("getCountQuery type checks") {
    check(leagueRepository.getCountQuery(Trials.Lap))
  }

  test("getRanksQuery type checks") {
    check(leagueRepository.getRanksQuery)
  }

  test("insertOverallLeagueDataQuery type checks") {
    check(leagueRepository.insertOverallLeagueDataQuery)
  }
}
