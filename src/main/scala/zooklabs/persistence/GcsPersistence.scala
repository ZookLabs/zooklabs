package zooklabs.persistence

import java.nio.file.Path
import zooklabs.conf.GcsPersistenceConfig
import com.google.auth.oauth2.ServiceAccountCredentials
import java.io.ByteArrayInputStream
import com.google.cloud.storage.StorageOptions
import com.google.cloud.storage.Storage
import com.google.cloud.storage.BlobInfo
import cats.implicits._
import cats.effect.IO

object GcsPersistence {

  def make(persistenceConfig: GcsPersistenceConfig) = {

    val storage: Storage =
      StorageOptions.newBuilder().setCredentials(persistenceConfig.creds).build().getService();

    new Persistence {

      def getImagePath(id: String) = {
        s"$ZOOKS/$id/$IMAGE"
      }

      def getZookPath(id: String, zookName: String) = {
        s"$ZOOKS/$id/$zookName.$ZOOK"
      }
      def writeImage(id: String, imageBytes: Array[Byte]): IO[Unit] = {
        val blobInfo = BlobInfo.newBuilder(persistenceConfig.bucket, getImagePath(id)).build
        IO.blocking(storage.create(blobInfo, imageBytes))
      }

      def writeZook(id: String, zookName: String, zookBytes: Array[Byte]): IO[Unit] = {
        val blobInfo =
          BlobInfo.newBuilder(persistenceConfig.bucket, getZookPath(id, zookName)).build
        IO.blocking(storage.create(blobInfo, zookBytes))
      }
    }

  }
}
