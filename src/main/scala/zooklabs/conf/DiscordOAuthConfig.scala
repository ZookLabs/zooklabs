package zooklabs.conf

import ciris.Secret
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.Url
import org.http4s.Uri

case class DiscordOAuthConfig(
    clientId: Secret[String],
    clientSecret: Secret[String],
    discordApi: Uri,
    redirectUri: String Refined Url
)
