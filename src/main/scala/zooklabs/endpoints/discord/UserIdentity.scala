package zooklabs.endpoints.discord

import eu.timepit.refined.types.string.NonEmptyString
import io.circe.Decoder
import io.circe.refined._

case class UserIdentity(
    id: NonEmptyString,
    username: NonEmptyString,
    discriminator: String,
    avatar: Option[String],
    bot: Option[Boolean],
    system: Option[Boolean],
    mfaEnabled: Option[Boolean],
    locale: Option[String],
    flags: Option[Int],
    premiumType: Option[Int],
    publicFlags: Option[Int]
)

object UserIdentity {
  implicit val decoder: Decoder[UserIdentity] =
    Decoder.forProduct11(
      "id",
      "username",
      "discriminator",
      "avatar",
      "bot",
      "system",
      "mfa_enabled",
      "locale",
      "flags",
      "premium_type",
      "public_flags"
    )(UserIdentity.apply)
}
