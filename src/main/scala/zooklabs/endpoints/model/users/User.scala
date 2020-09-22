package zooklabs.endpoints.model.users

import io.circe.Encoder
import zooklabs.endpoints.model.zooks.ZookIdentifier

final case class User(
    identifier: UserIdentifier,
    about: UserAbout,
    zooks: List[ZookIdentifier]
)

object User {

  implicit val encodeUser: Encoder[User] =
    Encoder.forProduct3(
      "identifier",
      "about",
      "zooks"
    )(u =>
      (
        u.identifier,
        u.about,
        u.zooks
      )
    )
}
