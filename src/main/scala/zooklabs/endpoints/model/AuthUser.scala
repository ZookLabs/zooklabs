package zooklabs.endpoints.model

import cats.implicits.catsSyntaxOptionId
import io.circe.refined._
import io.circe.{Decoder, Encoder}
import zooklabs.types.Username

class AuthUser(
    val id: Int,
    val username: Option[Username],
    val anonymous: Boolean = false
) {
  def getId: Option[Int] = {
    username.map(_ => id)
  }

  def isRegistered: Boolean = {
    username.isDefined
  }
}

object AuthUser {

  val anonymousUser: AuthUser = new AuthUser(0, Option.empty[Username], true)

  def apply(id: Int, username: Option[Username]): AuthUser = new AuthUser(id, username)

  implicit val decodeUser: Decoder[AuthUser] =
    Decoder.forProduct2("id", "username")(AuthUser.apply)

  implicit val encodeUser: Encoder[AuthUser] =
    Encoder.forProduct2("id", "username")(u => (u.id, u.username))

}
