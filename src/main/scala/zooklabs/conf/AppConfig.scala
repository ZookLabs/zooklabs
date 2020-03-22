package zooklabs.conf

import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.Url
import eu.timepit.refined.types.net.PortNumber

case class AppConfig(post: PortNumber,
                     host: String,
                     databaseConfig: DatabaseConfig,
                     persistenceConfig: PersistenceConfig,
                     discordWebhook: String Refined Url)
