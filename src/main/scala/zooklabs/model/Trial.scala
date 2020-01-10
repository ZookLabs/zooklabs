package zooklabs.model

import io.circe.{Encoder, Json}

final case class Trial(zookId: Int, name: String, score: BigDecimal, position: Int = Int.MaxValue)

object Trial {
  implicit val encodeTrial: Encoder[Trial] = (a: Trial) =>
    Json.obj(
      ("id", Json.fromInt(a.zookId)),
      ("name", Json.fromString(a.name)),
      ("score", Json.fromBigDecimal(a.score)),
      ("position", Json.fromInt(a.position))
  )
}
