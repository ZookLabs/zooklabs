package zooklabs.conf

import ciris.refined._
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.Url
import eu.timepit.refined.types.net.UserPortNumber

case class AppConfig(post: UserPortNumber,
                     host: String,
                     databaseConfig: DatabaseConfig,
                     persistenceConfig: PersistenceConfig,
                     discordWebhook: String Refined Url)
