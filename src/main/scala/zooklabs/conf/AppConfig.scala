package zooklabs.conf

import ciris.refined._
import eu.timepit.refined.types.net.UserPortNumber

case class AppConfig(apiPort: UserPortNumber, databaseConfig: DatabaseConfig)
