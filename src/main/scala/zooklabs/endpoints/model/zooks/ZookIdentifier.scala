package zooklabs.endpoints.model.zooks

import eu.timepit.refined.types.all.NonNegInt
import eu.timepit.refined.types.string.NonEmptyString
import io.circe.Encoder
import io.circe.refined.refinedEncoder

final case class ZookIdentifier(
    id: NonNegInt,
    name: NonEmptyString
)

object ZookIdentifier {
  implicit val encodeZookIdentifier: Encoder[ZookIdentifier] =
    Encoder.forProduct2(
      "id",
      "name"
    )(u =>
      (
        u.id,
        u.name
      )
    )
}
