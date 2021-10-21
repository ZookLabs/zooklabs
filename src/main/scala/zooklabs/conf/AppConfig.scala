package zooklabs.conf

import eu.timepit.refined.types.net.PortNumber
import org.http4s.Uri
import org.http4s.headers.Origin
import zooklabs.jwt.JwtCreds

case class AppConfig(
    post: PortNumber,
    host: String,
    databaseConfig: DatabaseConfig,
    persistenceConfig: PersistenceConfig,
    discordWebhook: Uri,
    jwtCreds: JwtCreds,
    discordOAuthConfig: DiscordOAuthConfig,
    corsHost: Origin.Host
)
