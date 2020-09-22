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

case class LeagueRepository(xa: Transactor[IO]) {

  val listLeagueQuery: String => Query0[TrialEntity] = trialName =>
    Query0[TrialEntity](s"""SELECT zookid, name, score, position
         |FROM $trialName
         |ORDER BY position
         |""".stripMargin)

  val getLeagueUpdatedAtQuery: String => Query0[LocalDateTime] =
    trialName => sql"""
         |SELECT updated_at
         |FROM leagues_metadata
         |WHERE league = $trialName
         |""".stripMargin.query

  def getLeague(trial: Trials): IO[League] = {
    (for {
      entries   <- listLeagueQuery(trial.value).to[List]
      updatedAt <- getLeagueUpdatedAtQuery(trial.value).option
    } yield League(updatedAt.getOrElse(LocalDateTime.MIN), entries)).transact(xa)
  }

  def updateLeagueOrder(trial: Trials): IO[Int] = {
    Update0(
      s"""update ${trial.value} trial
         |set position = t.pos
         |from (select row_number() over (order by t.score ${trial.ordering.sql}, t.zookid asc) as pos, t.zookid
         |      from ${trial.value} t) t where trial.zookid = t.zookid""".stripMargin,
      None
    ).run.transact(xa)

  }

  def getLeader(trial: Trials): IO[Option[Int]] = {
    Query0[Int](s"select zookid from ${trial.value} where position = 1").option.transact(xa)
  }

  def setLeagueUpdatedAt(trial: Trials): IO[Int] = {
    sql"UPDATE leagues_metadata SET updated_at = ${LocalDateTime.now()} WHERE league LIKE ${trial.value}".update.run
      .transact(xa)
  }
}
