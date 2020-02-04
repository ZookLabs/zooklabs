package zooklabs.conf

import java.nio.file.{Path, Paths}

import cats.implicits._
import ciris.ConfigDecoder
import ciris.refined._
import eu.timepit.refined.cats._
import eu.timepit.refined.types.string.NonEmptyString

import scala.util.Try

case class PersistenceConfig(path: Path)

object PersistenceConfig {

  implicit final val nonEmptyStringPathConfigDecoder: ConfigDecoder[NonEmptyString, Path] =
    ConfigDecoder.identity[NonEmptyString].mapOption("Path") { s =>
      Try(Paths.get(s.toString)).toOption
    }

}
