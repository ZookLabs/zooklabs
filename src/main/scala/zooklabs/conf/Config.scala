package zooklabs.conf

import java.nio.file.Path

import cats.effect.{ContextShift, IO}
import cats.implicits._
import ciris._
import ciris.refined._
import eu.timepit.refined.api.Refined
import eu.timepit.refined.auto._
import eu.timepit.refined.cats._
import eu.timepit.refined.string.Url
import eu.timepit.refined.types.net.UserPortNumber
import eu.timepit.refined.types.string.NonEmptyString
import zooklabs.conf.PersistenceConfig.nonEmptyStringPathConfigDecoder

object Config {

  val databaseConfig: ConfigValue[DatabaseConfig] =
    env("DATABASE_URL")
      .as[NonEmptyString]
      .secret
      .default(Secret("postgres://Bernard:Nosey@localhost:5432/zooklabs"))
      .as[DatabaseConfig]

  val persistenceConfig: ConfigValue[PersistenceConfig] =
    env("PERSISTENCE_PATH")
      .default(System.getProperty("user.home"))
      .as[NonEmptyString]
      .as[Path]
      .map(e => PersistenceConfig(e))

  val config: ConfigValue[AppConfig] =
    (env("PORT").as[UserPortNumber].default(8080),
     databaseConfig,
     persistenceConfig,
     env("DISCORDWEBHOOK")
       .default("")
       .as[String Refined Url])
      .parMapN(AppConfig)

  def load()(implicit f: ContextShift[IO]): IO[AppConfig] = config.load[IO]
}
