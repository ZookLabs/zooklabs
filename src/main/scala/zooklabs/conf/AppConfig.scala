package zooklabs.conf

import ciris.Secret
import eu.timepit.refined.types.net.PortNumber
import eu.timepit.refined.types.string.NonEmptyString
import org.http4s.Uri
import zooklabs.jwt.JwtCreds

case class AppConfig(
    post: PortNumber,
    host: String,
    databaseConfig: DatabaseConfig,
    persistenceConfig: PersistenceConfig,
    discordWebhook: Uri,
    jwtCreds: JwtCreds,
    discordOAuthConfig: DiscordOAuthConfig
)
