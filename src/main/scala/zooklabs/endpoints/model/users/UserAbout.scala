package zooklabs.endpoints.model.users

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

import io.circe.Encoder

final case class UserAbout(signUpAt: LocalDateTime, lastLoginAt: LocalDateTime)

object UserAbout {
  private val dateTimeFormatter = DateTimeFormatter.ofPattern("EEEE d MMMM yyyy")

  implicit val encodeUserAbout: Encoder[UserAbout] =
    Encoder.forProduct2(
      "signUpAt",
      "lastLoginAt"
    )(u =>
      (
        u.signUpAt.format(dateTimeFormatter),
        u.lastLoginAt.format(dateTimeFormatter)
      )
    )
}
