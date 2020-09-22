package zooklabs.endpoints

import io.circe.Encoder

case class APIError(error: String)

object APIError {

  implicit val encodeAPIError: Encoder[APIError] =
    Encoder.forProduct1(
      "error"
    )(u =>
      (
        u.error
      )
    )
}
