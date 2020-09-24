package zooklabs.endpoints.model.signup

import io.circe.Decoder
import io.circe.refined.refinedDecoder
import zooklabs.types.Username

case class Register(
    username: Username
)

object Register {
  implicit val decodeRegister: Decoder[Register] =
    Decoder.forProduct1("username")(Register.apply)
}
