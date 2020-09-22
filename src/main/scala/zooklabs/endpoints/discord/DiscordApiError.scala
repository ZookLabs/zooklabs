package zooklabs.endpoints.discord

import io.circe.Decoder

case class DiscordApiError(error: String, errorDescription: String)

object DiscordApiError {
  implicit val decoder: Decoder[DiscordApiError] =
    Decoder.forProduct2("error", "error_description")(DiscordApiError.apply)
}
