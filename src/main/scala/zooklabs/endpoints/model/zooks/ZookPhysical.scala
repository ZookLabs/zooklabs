package zooklabs.endpoints.model.zooks

import io.circe.Encoder

final case class ZookPhysical(
    height: Double,
    length: Double,
    width: Double,
    weight: Double,
    components: Int
)

object ZookPhysical {

  implicit val encodeZookPhysical: Encoder[ZookPhysical] =
    Encoder.forProduct5(
      "height",
      "length",
      "width",
      "weight",
      "components"
    )(u =>
      (
        u.height,
        u.length,
        u.width,
        u.weight,
        u.components
      )
    )
}
