package zooklabs.persistence

import java.nio.file.{Files, Path}

import cats.effect.Sync
import cats.implicits._
import zooklabs.conf.PersistenceConfig

trait Persistence[F[_]] {
  def createZookPathAndDirectories(id: String): F[Path]
  def writeImage(path: Path, imageBytes: Array[Byte]): F[Path]
  def writeZook(path: Path, zookName: String, zookBytes: Array[Byte]): F[Path]
  def imagePath(id: String): Path
}

class PersistenceImpl[F[_]: Sync](persistenceConfig: PersistenceConfig) extends Persistence[F] {

  val ZOOK  = s"zook"
  val ZOOKS = s"${ZOOK}s"
  val IMAGE = "image.png"

  val zookPath: Path = persistenceConfig.path.resolve(ZOOKS)

  def createZookPathAndDirectories(id: String): F[Path] = {
    val path = zookPath.resolve(id)
    Sync[F].delay(Files.createDirectories(path)).as(path)
  }

  def imagePath(id: String): Path = {
    zookPath.resolve(id).resolve(IMAGE)
  }

  def writeImage(path: Path, imageBytes: Array[Byte]): F[Path] = {
    Sync[F].delay(Files.write(path.resolve(IMAGE), imageBytes))
  }

  def writeZook(path: Path, zookName: String, zookBytes: Array[Byte]): F[Path] = {
    Sync[F].delay(Files.write(path.resolve(s"$zookName.$ZOOK"), zookBytes))
  }
}
