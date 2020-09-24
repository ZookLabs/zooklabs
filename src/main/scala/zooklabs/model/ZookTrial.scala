package zooklabs.model
import com.zooklabs.zook.achievement.trial.{ZookTrial => CoreZookTrial}
import io.circe.Encoder

final case class ZookTrial(score: Double, position: Int = Int.MaxValue)

object ZookTrial {
  def fromCoreZookTrial(coreZookTrial: CoreZookTrial): ZookTrial = {
    ZookTrial(coreZookTrial.data)
  }

  implicit val encodeZookTrial: Encoder[ZookTrial] =
    Encoder.forProduct2(
      "score",
      "position"
    )(u =>
      (
        u.score,
        u.position
      )
    )
}
