package zooklabs.model

import eu.timepit.refined.types.all.NonNegInt
import eu.timepit.refined.types.string.NonEmptyString
import io.circe.Encoder
import io.circe.refined.refinedEncoder

final case class LeagueTrial(
    zookId: NonNegInt,
    name: NonEmptyString,
    score: Double,
    position: Int = Int.MaxValue
)

object LeagueTrial {

  implicit val encodeLeagueTrial: Encoder[LeagueTrial] =
    Encoder.forProduct4(
      "zookId",
      "name",
      "score",
      "position"
    )(u =>
      (
        u.zookId,
        u.name,
        u.score,
        u.position
      )
    )

}
