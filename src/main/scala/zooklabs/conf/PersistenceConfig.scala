package zooklabs.conf

import java.net.URI
import java.nio.file.{Path, Paths}

import cats.implicits._
import ciris.ConfigDecoder
import ciris.refined._
import eu.timepit.refined.cats._
import eu.timepit.refined.types.string.NonEmptyString

import scala.util.Try
import com.google.auth.oauth2.ServiceAccountCredentials

sealed trait PersistenceConfig {
  val path: Path
}

case class LocalPersistenceConfig(path: Path) extends PersistenceConfig

case class GcsPersistenceConfig(creds: ServiceAccountCredentials, bucket: String, path: Path)
    extends PersistenceConfig

object PersistenceConfig {
  implicit final val nonEmptyStringPathConfigDecoder: ConfigDecoder[NonEmptyString, Path] =
    ConfigDecoder.identity[NonEmptyString].mapOption("Path") { s =>
      Try(Paths.get(URI.create(s.value))).toOption
    }
}
