package zooklabs.conf

import ciris.refined._
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.{Uri, Url}
import eu.timepit.refined.types.net.UserPortNumber

case class AppConfig(apiPort: UserPortNumber,
                     databaseConfig: DatabaseConfig,
                     persistenceConfig: PersistenceConfig,
                     discordWebhook: String Refined Url)
