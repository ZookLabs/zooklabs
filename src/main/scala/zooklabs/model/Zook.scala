package zooklabs.model

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

import com.zooklabs.zook.achievement.trial.{ZookTrial => CoreZookTrial}
import io.circe.Encoder
import io.circe.generic.auto._

final case class Zook(id: Int = 0,
                      name: String,
                      height: Double,
                      length: Double,
                      width: Double,
                      weight: Double,
                      components: Int,
                      dateCreated: LocalDateTime,
                      dateUploaded: LocalDateTime,
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
      dateUploaded = LocalDateTime.now(),
      sprint = sprint.map(defaultTrial),
      blockPush = blockPush.map(defaultTrial),
      hurdles = hurdles.map(defaultTrial),
      highJump = highJump.map(defaultTrial),
      lap = lap.map(defaultTrial)
    )
  }

  private val dateTimeFormatter = DateTimeFormatter.ofPattern("EEEE d MMMM yyyy")

  implicit val encodeZook: Encoder[Zook] =
    Encoder.forProduct14(
      "id",
      "name",
      "height",
      "length",
      "width",
      "weight",
      "components",
      "dateCreated",
      "dateUploaded",
      "sprint",
      "blockPush",
      "hurdles",
      "highJump",
      "lap"
    )(
      u =>
        (
          u.id,
          u.name,
          u.height,
          u.length,
          u.width,
          u.weight,
          u.components,
          u.dateCreated.format(dateTimeFormatter),
          u.dateUploaded.format(dateTimeFormatter),
          u.sprint,
          u.blockPush,
          u.hurdles,
          u.highJump,
          u.lap
      ))
}
