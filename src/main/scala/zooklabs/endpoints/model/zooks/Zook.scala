package zooklabs.endpoints.model.zooks

import io.circe.Encoder

final case class Zook(
    identifier: ZookIdentifier,
    about: ZookAbout,
    physical: ZookPhysical,
    achievement: ZookAchievement
)

object Zook {

  implicit val encodeApiZook: Encoder[Zook] =
    Encoder.forProduct4(
      "identifier",
      "about",
      "physical",
      "achievement"
    )(u =>
      (
        u.identifier,
        u.about,
        u.physical,
        u.achievement
      )
    )
}
