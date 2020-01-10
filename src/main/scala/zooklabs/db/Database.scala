package zooklabs.db

import cats.effect.IO
import cats.implicits._
import doobie.hikari.HikariTransactor
import org.flywaydb.core.Flyway

object Database {

  def initialize(transactor: HikariTransactor[IO]): IO[Unit] = {
    transactor.configure { dataSource =>
      IO(Flyway.configure().dataSource(dataSource).load().migrate()).void
    }
  }
}
