package zooklabs.program.mock

import cats.effect.IO
import eu.timepit.refined.types.all
import eu.timepit.refined.types.string.NonEmptyString
import munit.Assertions.fail
import zooklabs.endpoints.model.users.{User, UserIdentifier}
import zooklabs.endpoints.model.zooks.{Zook, ZookIdentifier}
import zooklabs.repository.{UserRepository, ZookRepository}
import zooklabs.repository.model.{UserEntity, ZookContainer}
import zooklabs.types.Username

import java.time.LocalDateTime

object MockUserRepository {

  private class StubUserRepository extends UserRepository {

    override def getUser(username: Username): IO[Option[User]] = fail(
      "getUser should not have been invoked"
    )

    override def listUsers(): IO[List[UserIdentifier]] = fail(
      "listUsers should not have been invoked"
    )

    override def getByDiscordId(discordId: NonEmptyString): IO[Option[UserEntity]] = fail(
      "getByDiscordId should not have been invoked"
    )

    override def persistUser(user: UserEntity): IO[UserEntity] = fail(
      "persistUser should not have been invoked"
    )

    override def updateLastLogin(id: Int, now: LocalDateTime): IO[Int] = fail(
      "updateLastLogin should not have been invoked"
    )

    override def setUsername(id: Int, username: Username): IO[Either[Unit, Int]] = fail(
      "setUsername should not have been invoked"
    )

    override def usernameExists(username: Username): IO[Option[Unit]] = fail(
      "usernameExists should not have been invoked"
    )

    override def isUserAdmin(userId: Int): IO[Boolean] = fail(
      "isUserAdmin should not have been invoked"
    )

    override def getUserId(username: Username): IO[Option[Int]] = fail(
      "getUserId should not have been invoked"
    )
  }

  val stub: UserRepository = new StubUserRepository

  def getUserMock(user: Option[User]): UserRepository = new StubUserRepository {
    override def getUser(username: Username): IO[Option[User]] = IO.pure(user)
  }

}
