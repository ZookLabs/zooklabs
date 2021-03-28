package zooklabs.repository

import cats.data.OptionT
import cats.effect.IO
import cats.implicits.{catsSyntaxTuple5Semigroupal, _}
import doobie.Transactor
import doobie.implicits._
import doobie.postgres.circe.jsonb.implicits.{pgDecoderGetT, pgEncoderPutT}
import doobie.refined.implicits._
import doobie.util.{Get, Put}
import zooklabs.endpoints.model.tournament.{Tournament, TournamentAbout, TournamentIdentifier}
import zooklabs.endpoints.model.zooks.ZookIdentifier
import zooklabs.endpoints.model.zooks.ZookIdentifier._
import zooklabs.repository.model.EntityTournament

case class TournamentRepository(xa: Transactor[IO]) {

  implicit val jsonbGetZookIdentifier: Get[List[ZookIdentifier]] =
    pgDecoderGetT[List[ZookIdentifier]]
  implicit val jsonbPutZookIdentifier: Put[List[ZookIdentifier]] =
    pgEncoderPutT[List[ZookIdentifier]]

  def listTournamentsQuery(): doobie.Query0[TournamentIdentifier] = {
    sql"""SELECT id, title from tournament""".query[TournamentIdentifier]
  }

  def getTournamentQuery(id: Int): doobie.Query0[EntityTournament] = {
    sql"""SELECT * FROM tournament where id = $id""".query[EntityTournament]
  }

  def getTournament(id: Int): IO[Option[Tournament]] = {
    (for {
      entityTournament    <- OptionT(getTournamentQuery(id).option)
      tournamentIdentifier = TournamentIdentifier(entityTournament.id, entityTournament.title)
      tournamentAbout      = TournamentAbout(entityTournament.description, entityTournament.ownerId)
    } yield Tournament(tournamentIdentifier, tournamentAbout, entityTournament.zooks))
      .transact(xa)
      .value
  }

  def listTournaments(): IO[List[TournamentIdentifier]] = {
    listTournamentsQuery().to[List].transact(xa)
  }

}
