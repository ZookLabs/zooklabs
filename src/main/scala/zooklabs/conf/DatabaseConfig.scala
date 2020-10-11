package zooklabs.conf

import cats.implicits._
import ciris.refined._
import ciris.{ConfigValue, Secret, env}
import eu.timepit.refined.auto._
import eu.timepit.refined.cats._
import eu.timepit.refined.types.all.PosInt
import eu.timepit.refined.types.string.NonEmptyString

final case class DatabaseConfig(
    dbCreds: DbCreds,
    maxConnections: PosInt
)

object DatabaseConfig {
  def load: ConfigValue[DatabaseConfig] = {
    (
      env("DATABASE_URL")
        .as[NonEmptyString]
        .secret
        .default(Secret("postgres://Bernard:Nosey@localhost:5432/zooklabs"))
        .as[DbCreds],
      env("DATABASE_MAX_CONNECTIONS").as[PosInt].default(5)
    ).parMapN { (credentialConfig, maxConnections) =>
      DatabaseConfig(credentialConfig, maxConnections)
    }
  }
}
