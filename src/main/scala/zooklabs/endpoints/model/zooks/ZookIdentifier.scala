package zooklabs.endpoints.model.zooks

import eu.timepit.refined.types.all.NonNegInt
import eu.timepit.refined.types.string.NonEmptyString
import io.circe.Codec
import io.circe.refined.{refinedDecoder, refinedEncoder}

final case class ZookIdentifier(
    id: NonNegInt,
    name: NonEmptyString
)

object ZookIdentifier {
  implicit val encodeZookIdentifier: Codec[ZookIdentifier] =
    Codec.forProduct2(
      "id",
      "name"
    )(ZookIdentifier.apply)(u =>
      (
        u.id,
        u.name
      )
    )
}
