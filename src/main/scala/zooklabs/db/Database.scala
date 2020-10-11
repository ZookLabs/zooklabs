package zooklabs.db

import cats.effect.{Async, Blocker, ContextShift, IO, Resource, Sync}
import cats.implicits._
import com.zaxxer.hikari.HikariConfig
import doobie.hikari.HikariTransactor
import doobie.util.ExecutionContexts
import eu.timepit.refined.auto.autoUnwrap
import org.flywaydb.core.Flyway
import zooklabs.conf.DatabaseConfig

object Database {

  def initialize(transactor: HikariTransactor[IO]): IO[Unit] = {
    transactor.configure { dataSource =>
      IO(Flyway.configure().dataSource(dataSource).load().migrate()).void
    }
  }

  def hikariConfig(databaseConfig: DatabaseConfig): HikariConfig = {
    val hikariConfig = new HikariConfig
    hikariConfig.setJdbcUrl(databaseConfig.dbCreds.host)
    hikariConfig.setUsername(databaseConfig.dbCreds.user)
    hikariConfig.setPassword(databaseConfig.dbCreds.password.value)
    hikariConfig.setMaximumPoolSize(databaseConfig.maxConnections.value)
    hikariConfig.setDriverClassName("org.postgresql.Driver")
    hikariConfig
  }

  def makeTransactor[F[_]: Async: ContextShift](
      databaseConfig: DatabaseConfig
  ): Resource[F, HikariTransactor[F]] = {
    for {
      ce    <-
        ExecutionContexts.fixedThreadPool[F](databaseConfig.maxConnections.value)
      be    <- Blocker[F]
      config = hikariConfig(databaseConfig)
      xa    <- HikariTransactor.fromHikariConfig[F](
                 config,
                 ce,
                 be
               )
    } yield xa

  }
}
