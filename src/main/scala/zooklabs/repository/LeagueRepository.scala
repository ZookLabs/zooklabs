package zooklabs.repository

import java.time.LocalDateTime

import cats.effect.IO
import cats.implicits.catsSyntaxTuple5Semigroupal
import doobie.{ConnectionIO, Transactor}
import doobie.implicits._
import doobie.refined.implicits._
import zooklabs.endpoints.model.leagues.League
import zooklabs.model.LeagueTrial
import zooklabs.repository.model.{
  LeagueCounts,
  LeagueRanks,
  LeagueRanksContainer,
}
import cats.effect.IO
import cats.implicits._
import doobie.implicits._
import doobie.refined.implicits._
import doobie.util.query.Query0
import doobie.util.update.{Update, Update0}
import doobie.{ConnectionIO, Transactor}
import zooklabs.enum.Trials
import doobie.implicits.javatime._

case class LeagueRepository(xa: Transactor[IO]) {

  val listLeagueQuery: Trials => Query0[LeagueTrial] = trial =>
    Query0[LeagueTrial](s"""SELECT zookid, name, score, position
         |FROM ${trial.value}
         |WHERE NOT disqualified
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
         |      from ${trial.value} t where not t.disqualified) t where trial.zookid = t.zookid and not trial.disqualified""".stripMargin,
      None
    )
  }

  def updateDisqualifiedQuery(trial: Trials): Update0 = {
    Update0(
      s"""update ${trial.value} trial
         |set position = 2147483647
         |where disqualified and position != 2147483647""".stripMargin,
      None
    )
  }

  def setLeagueUpdatedAtQuery(trial: Trials): Update0 = {
    sql"UPDATE leagues_metadata SET updated_at = ${LocalDateTime.now()} WHERE league LIKE ${trial.value}".update
  }

  def updateLeagues(trial: Trials): IO[Unit] = {

    (for {
      _ <- updateLeagueOrderQuery(trial).run
      _ <- updateDisqualifiedQuery(trial).run
      _ <- setLeagueUpdatedAtQuery(trial).run
    } yield ()).transact(xa)
  }

  def getLeaderQuery(trial: Trials): Query0[Int] = {
    Query0[Int](s"select zookid from ${trial.value} where position = 1")
  }

  def getLeader(trial: Trials): IO[Option[Int]] = {
    getLeaderQuery(trial).option.transact(xa)
  }

  def getCountQuery(trial: Trials): Query0[Int] = {
    Query0[Int](
      s"select count(*) from ${trial.value} where not disqualified and position != 2147483647"
    )
  }

  def getLeagueCounts: ConnectionIO[LeagueCounts] = {
    (
      getCountQuery(Trials.Sprint).unique,
      getCountQuery(Trials.BlockPush).unique,
      getCountQuery(Trials.Hurdles).unique,
      getCountQuery(Trials.HighJump).unique,
      getCountQuery(Trials.Lap).unique
    ).mapN { case (sprint, blockPush, hurdles, highJump, lap) =>
      LeagueCounts(sprint, blockPush, hurdles, highJump, lap)
    }
  }

  def getRanksQuery: Query0[LeagueRanks] = {
    sql"""SELECT z.id, z.name, s.position, b.position, h.position, hj.position, l.position
         |FROM zook z
         |         INNER JOIN sprint s on z.id = s.zookid
         |         INNER JOIN block_push b on z.id = b.zookid
         |         INNER JOIN hurdles h on z.id = h.zookid
         |         INNER JOIN high_jump hj on z.id = hj.zookid
         |         INNER JOIN lap l on z.id = l.zookid
         |WHERE
         |  NOT s.disqualified
         |  AND NOT b.disqualified
         |  AND NOT h.disqualified
         |  AND NOT hj.disqualified
         |  AND NOT l.disqualified""".stripMargin.query[LeagueRanks]
  }

  def getRanks: IO[LeagueRanksContainer] = {
    (for {
      leagueRanks <- getRanksQuery.to[List]
      counts      <- getLeagueCounts
    } yield LeagueRanksContainer(leagueRanks, counts)).transact(xa)
  }

  def insertOverallLeagueDataQuery = {
    Update[LeagueTrial](s"""INSERT INTO overall_league
                           |(zookid, name, score, position)
                           |VALUES (?, ?, ?, ?)
                           |ON CONFLICT (zookid) DO UPDATE
                           |SET score = excluded.score,
                           |position = excluded.position
         """.stripMargin)
  }

  def updateOverallLeagueData(overallTrials: List[LeagueTrial]) = {
    (for {
      _ <- insertOverallLeagueDataQuery.updateMany(overallTrials)
      _ <- setLeagueUpdatedAtQuery(Trials.Overall).run
    } yield ()).transact(xa)
  }
}
