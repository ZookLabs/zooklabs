package zooklabs.endpoints.model.users

import io.circe.Encoder
import io.circe.refined.refinedEncoder
import zooklabs.types.Username

final case class UserIdentifier(username: Username)

object UserIdentifier {
  implicit val encodeUserIdentifier: Encoder[UserIdentifier] =
    Encoder.forProduct1(
      "username"
    )(_.username)
}
