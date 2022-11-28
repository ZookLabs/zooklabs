package zooklabs.repository

import cats.effect.IO
import cats.implicits.catsSyntaxOptionId
import doobie.Transactor
import doobie.scalatest.IOChecker
import eu.timepit.refined.types.string.NonEmptyString
import org.flywaydb.core.Flyway
import org.scalatest.BeforeAndAfterAll
import org.scalatest.funsuite.AnyFunSuite
import zooklabs.repository.model.UserEntity
import zooklabs.types.Username

import java.time.{Clock, Instant, LocalDateTime, ZoneId}
import java.util.concurrent.Executors
import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}

class UserRepositorySuite extends AnyFunSuite with IOChecker with BeforeAndAfterAll {

  val now: Instant                    = Instant.ofEpochSecond(1601324567)
  val nowLocalDateTime: LocalDateTime = LocalDateTime.now(Clock.fixed(now, ZoneId.systemDefault()))
  val testUsername: Username          = Username("test")

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

  test("getUserEntityQuery type checks") {
    check(UserRepository.getUserEntityQuery(testUsername))
  }

  test("getZooksByUserQuery type checks") {
    check(UserRepository.getZooksByUserQuery(1))
  }

  test("listUserIdentifiersQuery type checks") {
    check(UserRepository.listUserIdentifiersQuery)
  }

  test("getByDiscordIdQuery type checks") {
    check(UserRepository.getByDiscordIdQuery("test"))
  }

  val userEntityFixture: UserEntity = UserEntity(
    username = testUsername.some,
    discordId = NonEmptyString("test123-discord-snowflake"),
    discordUsername = NonEmptyString("test#123#"),
    signUpAt = nowLocalDateTime,
    lastLoginAt = nowLocalDateTime
  )

  test("persistUserQuery type checks") {
    check(UserRepository.persistUserQuery(userEntityFixture))
  }

  test("updateLastLoginQuery type checks") {
    check(UserRepository.updateLastLoginQuery(1, LocalDateTime.now()))
  }

  test("setUsernameQuery type checks") {
    check(UserRepository.setUsernameQuery(1, testUsername))
  }

  test("usernameExistsQuery type checks") {
    check(UserRepository.usernameExistsQuery(testUsername))
  }

  test("isUserAdminQuery type checks") {
    check(UserRepository.isUserAdminQuery(1))
  }

  test("getUserIdQuery type checks") {
    check(UserRepository.getUserIdQuery(testUsername))
  }

}
