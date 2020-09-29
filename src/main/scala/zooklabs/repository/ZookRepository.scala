package zooklabs.repository

import cats.data.OptionT
import cats.effect.IO
import cats.implicits._
import doobie.implicits._
import doobie.refined.implicits._
import doobie.util.query.Query0
import doobie.util.update.{Update, Update0}
import doobie.{ConnectionIO, Transactor}
import eu.timepit.refined.types.all.NonNegInt
import zooklabs.endpoints.model.users.UserIdentifier
import zooklabs.endpoints.model.zooks
import zooklabs.endpoints.model.zooks._
import zooklabs.enum.Trials
import zooklabs.model._
import zooklabs.repository.model.{TrialEntity, ZookContainer, ZookEntity}

import doobie.implicits.javatime._

case class ZookRepository(xa: Transactor[IO]) {

  def persistTrialQuery(trials: Trials): Update[TrialEntity] =
    Update[TrialEntity](s"""INSERT INTO ${trials.value}
         |(zookid, name, score, position)
         |VALUES (?, ?, ?, ?)
         """.stripMargin)

  def persistZookQuery(zookEntity: ZookEntity): doobie.Update0 = {
    sql"""INSERT INTO  zook 
         | (name, height, length, width, weight, components, dateCreated, dateUploaded, owner)
         | VALUES (${zookEntity.name},
         | ${zookEntity.height},
         | ${zookEntity.length},
         | ${zookEntity.width},
         | ${zookEntity.weight},
         | ${zookEntity.components},
         | ${zookEntity.dateCreated},
         | ${zookEntity.dateUploaded},
         | ${zookEntity.owner})""".stripMargin.update
  }

  def persistZook(zookContainer: ZookContainer): IO[NonNegInt] = {
    (for {
      zookId  <- persistZookQuery(zookContainer.zook).withUniqueGeneratedKeys[NonNegInt]("id")
      toEntity = (zookTrial: ZookTrial) =>
                   TrialEntity(
                     zookId,
                     name = zookContainer.zook.name,
                     score = zookTrial.score,
                     position = zookTrial.position
                   )
      _       <- persistTrialQuery(Trials.Sprint).updateMany(zookContainer.sprint.map(toEntity))
      _       <- persistTrialQuery(Trials.BlockPush).updateMany(zookContainer.blockPush.map(toEntity))
      _       <- persistTrialQuery(Trials.Hurdles).updateMany(zookContainer.hurdles.map(toEntity))
      _       <- persistTrialQuery(Trials.HighJump).updateMany(zookContainer.highJump.map(toEntity))
      _       <- persistTrialQuery(Trials.Lap).updateMany(zookContainer.lap.map(toEntity))
    } yield zookId).transact(xa)
  }

  def dropZookQuery(id: Int): Update0 =
    sql"DELETE FROM zook WHERE id = $id".update

  def deleteZook(id: Int): IO[Int] = {
    dropZookQuery(id).run.transact(xa)
  }

  def getZookEntity(id: Int): Query0[ZookEntity] =
    sql"""SELECT id,
         |       name,
         |       height,
         |       length,
         |       width,
         |       weight,
         |       components,
         |       dateCreated,
         |       dateUploaded,
         |       owner
         |FROM zook
         |WHERE id = $id         
         |""".stripMargin.query[ZookEntity]

  def getZookTrial(zookId: Int): Trials => Query0[ZookTrial] =
    trialName =>
      Query0[ZookTrial](
        s"SELECT score, position FROM ${trialName.value} where zookid = $zookId"
      )

  def getZookAchievementQuery(zookId: Int): ConnectionIO[ZookAchievement] = {
    val getTrial: Trials => Query0[ZookTrial] = getZookTrial(zookId)
    (
      getTrial(Trials.Sprint).option,
      getTrial(Trials.BlockPush).option,
      getTrial(Trials.Hurdles).option,
      getTrial(Trials.HighJump).option,
      getTrial(Trials.Lap).option
    ).mapN { case (sprint, blockPush, hurdles, highJump, lap) =>
      ZookAchievement(sprint, blockPush, hurdles, highJump, lap)
    }
  }

  def getZookOwner(ownerId: Option[Int]): doobie.ConnectionIO[Option[UserIdentifier]] = {
    ownerId match {
      case Some(id) =>
        sql"SELECT username from users where id = $id"
          .query[UserIdentifier]
          .option
      case None     => Option.empty[UserIdentifier].pure[ConnectionIO]
    }
  }

  def getZook(id: Int): IO[Option[Zook]] = {
    (for {
      zookEntity       <- OptionT(getZookEntity(id).option)
      zookAchievements <- OptionT.liftF(getZookAchievementQuery(id))
      zookOwner        <- OptionT(getZookOwner(zookEntity.owner).map(_.some))

      zookIdentifier = ZookIdentifier(zookEntity.id, zookEntity.name)
      zookAbout      = ZookAbout(zookOwner, zookEntity.dateCreated, zookEntity.dateUploaded)
      zookPhysical   = ZookPhysical(
                         height = zookEntity.height,
                         length = zookEntity.length,
                         width = zookEntity.width,
                         weight = zookEntity.weight,
                         components = zookEntity.components
                       )
    } yield zooks.Zook(zookIdentifier, zookAbout, zookPhysical, zookAchievements))
      .transact(xa)
      .value
  }

  val listZooksQuery: doobie.Query0[ZookIdentifier] =
    sql"SELECT id, name FROM zook ORDER BY id DESC".query[ZookIdentifier]

  def listZooks(): IO[List[ZookIdentifier]] = {
    listZooksQuery.to[List].transact(xa)
  }

}
