package zooklabs.repository

import java.sql.Timestamp
import java.time.LocalDateTime

import cats.effect.IO
import cats.instances.option._
import doobie.implicits._
import doobie.util.Write
import doobie.util.query.Query0
import doobie.util.update.{Update, Update0}
import doobie.{Transactor, util}
import zooklabs.enum.Trials
import zooklabs.model.{Trial, Zook, ZookTrial, Zooks}

case class ZookRepository(xa: Transactor[IO]) {

  val persistTrialQuery: Trials => Update[Trial] = trialName =>
    Update[Trial](s"""INSERT INTO ${trialName.value}
         |(zookid, name, score, position)
         |VALUES (?, ?, ?, ?)
         """.stripMargin)

  implicit val ZookWrite: Write[Zook] =
    Write[
      (String, Double, Double, Double, Double, Int, LocalDateTime, LocalDateTime)
    ].contramap(
      zook =>
        (
          zook.name,
          zook.height,
          zook.length,
          zook.width,
          zook.weight,
          zook.components,
          zook.dateCreated,
          zook.dateUploaded
      )
    )

  val persistZookQuery: Update[Zook] =
    Update[Zook](s"""INSERT INTO zook
         |(name, height, length, width, weight, components, dateCreated, dateUploaded)
         |VALUES (?,?,?,?,?,?,?,?)
         |""".stripMargin)

  def buildTrial: (String, Int) => Option[ZookTrial] => Option[Trial] =
    (name, id) =>
      _.map {
        case ZookTrial(score, position) =>
          Trial(zookId = id, name = name, score = score, position = position)
    }

  def persistZook(zook: Zook): IO[Int] = {
    (for {
      id      <- persistZookQuery.toUpdate0(zook).withUniqueGeneratedKeys[Int]("id")
      toTrial = buildTrial(zook.name, id)
      _       <- persistTrialQuery(Trials.Sprint).updateMany(toTrial(zook.sprint))
      _ <- persistTrialQuery(Trials.BlockPush).updateMany(
            toTrial(zook.blockPush)
          )
      _ <- persistTrialQuery(Trials.Hurdles).updateMany(toTrial(zook.hurdles))
      _ <- persistTrialQuery(Trials.HighJump).updateMany(toTrial(zook.highJump))
      _ <- persistTrialQuery(Trials.Lap).updateMany(toTrial(zook.lap))
    } yield id).transact(xa)
  }

  def dropZookQuery(id: Int): Update0 =
    sql"DELETE FROM zook WHERE id = $id".update

  def deleteZook(id: Int): IO[Int] = {
    dropZookQuery(id).run.transact(xa)
  }

  def getZookQuery(id: Int): Query0[Zook] =
    sql"""
         |SELECT zook.id,
         |       zook.name,
         |       height,
         |       length,
         |       width,
         |       weight,
         |       components,
         |       dateCreated,
         |       dateUploaded,
         |       sprint.score        AS sprint_score,
         |       sprint.position     AS sprint_position,
         |       block_push.score    AS block_push_score,
         |       block_push.position AS block_push_position,
         |       hurdles.score       AS hurdles_score,
         |       hurdles.position    AS hurdles_position,
         |       high_jump.score     AS high_jump_score,
         |       high_jump.position  AS high_jump_position,
         |       lap.score           AS lap_score,
         |       lap.position        AS lap_position
         |FROM zook
         |         LEFT JOIN sprint ON zook.id = sprint.zookid
         |         LEFT JOIN block_push ON zook.id = block_push.zookid
         |         LEFT JOIN hurdles ON zook.id = hurdles.zookid
         |         LEFT JOIN high_jump ON zook.id = high_jump.zookid
         |         LEFT JOIN lap ON zook.id = lap.zookid
         |WHERE zook.id = $id
         |""".stripMargin.query[Zook]

  def getZook(id: Int): IO[Option[Zook]] = {
    getZookQuery(id).option.transact(xa)
  }

  val listZooksQuery: doobie.Query0[Zooks] =
    sql"SELECT id, name from zook".query[Zooks]

  def listZooks(): IO[List[Zooks]] = {
    listZooksQuery.to[List].transact(xa)
  }

}
