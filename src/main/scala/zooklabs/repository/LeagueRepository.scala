package zooklabs.repository

import java.time.LocalDateTime

import cats.effect.IO
import doobie.Transactor
import doobie.implicits._
import doobie.refined.implicits._
import doobie.util.query.Query0
import doobie.util.update.Update0
import zooklabs.endpoints.model.leagues.League
import zooklabs.enum.Trials
import zooklabs.repository.model.TrialEntity

import doobie.implicits.javatime._

case class LeagueRepository(xa: Transactor[IO]) {

  val listLeagueQuery: Trials => Query0[TrialEntity] = trial =>
    Query0[TrialEntity](s"""SELECT zookid, name, score, position
         |FROM ${trial.value}
         |ORDER BY position
         |""".stripMargin)

  def getLeagueUpdatedAtQuery(trial: Trials): Query0[LocalDateTime] = sql"""
         |SELECT updated_at
         |FROM leagues_metadata
         |WHERE league = ${trial.value}
         |""".stripMargin.query

  def getLeague(trial: Trials): IO[League] = {
    (for {
      entries   <- listLeagueQuery(trial).to[List]
      updatedAt <- getLeagueUpdatedAtQuery(trial).option
    } yield League(updatedAt.getOrElse(LocalDateTime.MIN), entries)).transact(xa)
  }

  def updateLeagueOrderQuery(trial: Trials): Update0 = {
    Update0(
      s"""update ${trial.value} trial
         |set position = t.pos
         |from (select row_number() over (order by t.score ${trial.ordering.sql}, t.zookid asc) as pos, t.zookid
         |      from ${trial.value} t) t where trial.zookid = t.zookid""".stripMargin,
      None
    )
  }

  def updateLeagueOrder(trial: Trials): IO[Int] = {
    updateLeagueOrderQuery(trial).run.transact(xa)
  }

  def getLeaderQuery(trial: Trials): Query0[Int] = {
    Query0[Int](s"select zookid from ${trial.value} where position = 1")
  }

  def getLeader(trial: Trials): IO[Option[Int]] = {
    getLeaderQuery(trial).option.transact(xa)
  }

  def setLeagueUpdatedAtQuery(trial: Trials): IO[Int] = {
    sql"UPDATE leagues_metadata SET updated_at = ${LocalDateTime.now()} WHERE league LIKE ${trial.value}".update.run
      .transact(xa)
  }
}
