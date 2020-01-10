package zooklabs.conf

import cats.effect.{ContextShift, IO}
import cats.implicits._
import ciris._
import ciris.refined._
import eu.timepit.refined.auto._
import eu.timepit.refined.cats._
import eu.timepit.refined.types.net.UserPortNumber
import eu.timepit.refined.types.string.NonEmptyString

object Config {

  val databaseConfig: ConfigValue[DatabaseConfig] =
    env("DATABASE_URL")
      .as[NonEmptyString]
      .secret
      .default(Secret("postgres://Bernard:Nosey@localhost:5432/zooklabs"))
      .as[DatabaseConfig]

  val config: ConfigValue[AppConfig] =
    (env("PORT").as[UserPortNumber].default(8080), databaseConfig)
      .parMapN(AppConfig)

  def load()(implicit f: ContextShift[IO]): IO[AppConfig] = config.load[IO]
}
