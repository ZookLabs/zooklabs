package zooklabs.repository

import java.time.LocalDateTime

import cats.data.OptionT
import cats.effect.IO
import doobie.Transactor
import doobie.implicits._
import doobie.postgres.sqlstate
import doobie.refined.implicits._
import doobie.util.query.Query0
import eu.timepit.refined.auto._
import eu.timepit.refined.types.string.NonEmptyString
import zooklabs.endpoints.model.users.{User, UserAbout, UserIdentifier}
import zooklabs.endpoints.model.zooks.ZookIdentifier
import zooklabs.repository.model.UserEntity
import zooklabs.types.Username

case class UserRepository(xa: Transactor[IO]) {

  def getUserEntityQuery(username: Username): Query0[UserEntity] = {
    sql"""SELECT id,
         |       username,
         |       discord_id,
         |       discord_username,
         |       sign_up_at,
         |       last_login_at
         |FROM users
         |WHERE lower(username) =  ${username.value.toLowerCase}         
         |""".stripMargin.query[UserEntity]
  }

  def getZooksByUserQuery(id: Int): doobie.Query0[ZookIdentifier] =
    sql"SELECT id, name FROM zook WHERE owner = $id ORDER BY id DESC".query[ZookIdentifier]

  def getUser(username: Username): IO[Option[User]] = {
    (for {
      user      <- OptionT(getUserEntityQuery(username).option)
      userZooks <- OptionT.liftF(getZooksByUserQuery(user.id).to[List])

      userIdentifier = UserIdentifier(user.username.getOrElse("Anonymous"))
      userAbout      = UserAbout(user.signUpAt, user.lastLoginAt)
    } yield User(userIdentifier, userAbout, userZooks)).transact(xa).value
  }

  val listUserIdentifiersQuery: doobie.Query0[UserIdentifier] =
    sql"SELECT username FROM users WHERE username IS NOT NULL"
      .query[UserIdentifier]

  def listUsers(): IO[List[UserIdentifier]] = {
    listUserIdentifiersQuery.to[List].transact(xa)
  }

  def getByDiscordIdQuery(discordId: String): Query0[UserEntity] =
    sql"""SELECT id, username, discord_id, discord_username, sign_up_at, last_login_at
         |FROM users
         |WHERE discord_id = $discordId
         |""".stripMargin.query[UserEntity]

  def getByDiscordId(discordId: NonEmptyString): IO[Option[UserEntity]] = {
    getByDiscordIdQuery(discordId.value).option.transact(xa)
  }

  def persistUserQuery(users: UserEntity): doobie.Update0 =
    sql"insert into users (username, discord_id, discord_username, sign_up_at, last_login_at) values (${users.username},${users.discordId},${users.discordUsername},${users.signUpAt},${users.lastLoginAt})".update

  def persistUser(user: UserEntity): IO[UserEntity] = {
    persistUserQuery(user)
      .withUniqueGeneratedKeys[Int]("id")
      .transact(xa)
      .map(generatedId => user.copy(id = generatedId))
  }

  def updateLastLoginQuery(id: Int, now: LocalDateTime): doobie.Update0 = {
    sql"UPDATE users SET last_login_at = $now WHERE id = $id".update
  }

  def updateLastLogin(id: Int, now: LocalDateTime): IO[Int] = {
    updateLastLoginQuery(id, now).run.transact(xa)
  }

  def setUsernameQuery(id: Int, username: Username): doobie.Update0 = {
    sql"UPDATE users SET username = $username WHERE id = $id".update
  }

  def setUsername(id: Int, username: Username): IO[Either[Unit, Int]] = {
    setUsernameQuery(id, username).run
      .attemptSomeSqlState {
        case sqlstate.class23.UNIQUE_VIOLATION => ()
      }
      .transact(xa)
  }

  def usernameExistsQuery(username: Username): doobie.Query0[Unit] = {
    sql"SELECT 1 from users WHERE LOWER(username) = ${username.value.toLowerCase}"
      .query[Int] // testquery Unit
      .map(_ => ())
  }

  def usernameExists(username: Username): IO[Option[Unit]] = {
    usernameExistsQuery(username).option.transact(xa)
  }

}
