package zooklabs.model

import java.time.LocalDateTime

import com.zooklabs.zook.achievement.trial.{ZookTrial => CoreZookTrial}

final case class Zook(id: Int = 0,
                      name: String,
                      height: Double,
                      length: Double,
                      width: Double,
                      weight: Double,
                      components: Int,
                      dateCreated: LocalDateTime,
                      dateUploaded: LocalDateTime = LocalDateTime.now,
                      sprint: Option[ZookTrial],
                      blockPush: Option[ZookTrial],
                      hurdles: Option[ZookTrial],
                      highJump: Option[ZookTrial],
                      lap: Option[ZookTrial])

object Zook {

  private val defaultTrial: CoreZookTrial => ZookTrial = zookTrial => ZookTrial(zookTrial.data)

  def fromCoreZook(zook: com.zooklabs.zook.Zook): zooklabs.model.Zook = {
    import zook.passport._
    import achievement.trial._
    import physical._
    zooklabs.model.Zook(
      name = ownership.last.zookname,
      height = height.data,
      length = length.data,
      width = width.data,
      weight = weight.data,
      components = components.data,
      dateCreated = ownership.last.adoptionDate,
      sprint = sprint.map(defaultTrial),
      blockPush = blockPush.map(defaultTrial),
      hurdles = hurdles.map(defaultTrial),
      highJump = highJump.map(defaultTrial),
      lap = lap.map(defaultTrial)
    )
  }
}
