package zooklabs.model
import com.zooklabs.zook.achievement.trial.{ZookTrial => CoreZookTrial}
import io.circe.Encoder

final case class ZookTrial(score: Double, position: Int, disqualified: Boolean)

object ZookTrial {
  def fromCoreZookTrial(coreZookTrial: CoreZookTrial): ZookTrial = {
    ZookTrial(score = coreZookTrial.data, position = Int.MaxValue, disqualified = false)
  }

  implicit val encodeZookTrial: Encoder[ZookTrial] =
    Encoder.forProduct3(
      "score",
      "position",
      "disqualified"
    )(u =>
      (
        u.score,
        u.position,
        u.disqualified
      )
    )
}
