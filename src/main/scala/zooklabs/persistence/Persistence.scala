package zooklabs.persistence

import cats.effect.Sync
import cats.implicits._
import zooklabs.conf.PersistenceConfig
import zooklabs.conf.LocalPersistenceConfig
import zooklabs.conf.GcsPersistenceConfig

import java.nio.file.{Files, Path}
import cats.effect.IO
import eu.timepit.refined.types.all.NonNegInt

trait Persistence {

  val ZOOK  = s"zook"
  val ZOOKS = s"${ZOOK}s"
  val IMAGE = "image.png"

  def writeImage(id: String, imageBytes: Array[Byte]): IO[Unit]
  def writeZook(id: String, zookName: String, zookBytes: Array[Byte]): IO[Unit]
}

object Persistence {

  def make(persistenceConfig: PersistenceConfig) = {

    persistenceConfig match {
      case localPersistenceConfig: LocalPersistenceConfig =>
        LocalPersistence.make(localPersistenceConfig)
      case gcsPersistenceConfig: GcsPersistenceConfig => GcsPersistence.make(gcsPersistenceConfig)
    }
  }
}
