package zooklabs.endpoints.model.zooks

import io.circe.Encoder
import zooklabs.model.ZookTrial

final case class ZookAchievement(
    sprint: Option[ZookTrial],
    blockPush: Option[ZookTrial],
    hurdles: Option[ZookTrial],
    highJump: Option[ZookTrial],
    lap: Option[ZookTrial]
)

object ZookAchievement {

  implicit val encodeZookAchievement: Encoder[ZookAchievement] =
    Encoder.forProduct5(
      "sprint",
      "blockPush",
      "hurdles",
      "highJump",
      "lap"
    )(u =>
      (
        u.sprint,
        u.blockPush,
        u.hurdles,
        u.highJump,
        u.lap
      )
    )
}
