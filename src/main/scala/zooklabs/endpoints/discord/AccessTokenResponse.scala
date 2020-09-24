package zooklabs.endpoints.discord

import io.circe.Decoder
import io.circe.refined._

case class AccessTokenResponse(
    accessToken: AccessToken,
    expiresIn: Int,
    refreshToken: RefreshToken,
    scope: String,
    tokenType: String
)

object AccessTokenResponse {
  implicit val decoder: Decoder[AccessTokenResponse] =
    Decoder.forProduct5("access_token", "expires_in", "refresh_token", "scope", "token_type")(
      AccessTokenResponse.apply
    )
}
