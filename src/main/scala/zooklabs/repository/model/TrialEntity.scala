package zooklabs.repository.model

import eu.timepit.refined.types.all.NonNegInt
import eu.timepit.refined.types.string.NonEmptyString
import io.circe.Encoder
import io.circe.refined.refinedEncoder

final case class TrialEntity(
    zookId: NonNegInt,
    name: NonEmptyString,
    score: Double,
    position: Int = Int.MaxValue
)

object TrialEntity {

  implicit val encodeTrialEntity: Encoder[TrialEntity] =
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
