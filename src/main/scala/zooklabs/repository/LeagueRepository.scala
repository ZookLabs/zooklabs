package zooklabs.repository

import cats.effect.IO
import doobie.Transactor
import doobie.implicits._
import doobie.util.query.Query0
import doobie.util.update.Update0
import zooklabs.enum.Trials
import zooklabs.model.Trial

case class LeagueRepository(xa: Transactor[IO]) {

  val listLeagueQuery: String => Query0[Trial] = trialName =>
    Query0[Trial](s"""SELECT zookid, name, position, score
         |FROM $trialName
         |ORDER BY position DESC
         |""".stripMargin)

  def listLeague(trial: Trials): IO[List[Trial]] = {
    listLeagueQuery(trial.value).to[List].transact(xa)
  }

  def updateLeagueOrder(trial: Trials): IO[Int] = {
    Update0(
      s"""update ${trial.value} trial
         |set position = t.id
         |from (select row_number() over (order by t.score ${trial.sqlOrdering.entryName}, t.zookid asc) as id, t.zookid
         |      from ${trial.value} t) t where trial.zookid = t.zookid""".stripMargin,
      None
    ).run.transact(xa)

  }
}
