package zooklabs.persistence

import zooklabs.conf.PersistenceConfig
import java.nio.file.Files

import cats.effect.Sync
import cats.implicits._
import zooklabs.conf.LocalPersistenceConfig
import eu.timepit.refined.types.all.NonNegInt

import java.nio.file.{Files, Path}
import cats.effect.IO

object LocalPersistence {

  def make(persistenceConfig: LocalPersistenceConfig) = {
    new Persistence {

      def getImagePath(path: Path): Path                  = path.resolve(IMAGE)
      def getZookPath(path: Path, zookName: String): Path = path.resolve(s"$zookName.$ZOOK")

      def createPath(id: String): IO[Path] = {
        val path = persistenceConfig.path.resolve(ZOOKS).resolve(id)
        IO.blocking(Files.createDirectories(path)).as(path)
      }

      def writeImage(id: String, imageBytes: Array[Byte]): IO[Unit] = {
        createPath(id)
          .flatMap(path =>
            IO.blocking(
              Files.write(getImagePath(path), imageBytes)
            )
          )
          .void
      }
      def writeZook(id: String, zookName: String, zookBytes: Array[Byte]): IO[Unit] = {
        createPath(id)
          .flatMap(path =>
            IO.blocking(
              Files.write(getZookPath(path, zookName), zookBytes)
            )
          )
          .void
      }
    }
  }
}
