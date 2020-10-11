package zooklabs.conf

import java.net.URI

import cats.implicits._
import ciris.refined._
import ciris.{ConfigDecoder, Secret}
import eu.timepit.refined.auto._
import eu.timepit.refined.cats._
import eu.timepit.refined.types.string.NonEmptyString

import scala.util.Try

sealed abstract case class DbCreds(
    host: NonEmptyString,
    user: NonEmptyString,
    password: Secret[NonEmptyString]
)

//super naive but works
object DbCreds {
  def apply(uri: Secret[NonEmptyString]): Option[DbCreds] = {
    Try(URI.create(uri.value)).toOption.flatMap { uri =>
      (
        NonEmptyString
          .from(s"jdbc:postgresql://${uri.getHost}${uri.getPath}"),
        NonEmptyString.from(uri.getUserInfo.split(":")(0)),
        NonEmptyString.from(uri.getUserInfo.split(":")(1))
      ).mapN { case (host, user, password) =>
        new DbCreds(
          host = host,
          user = user,
          password = Secret(password)
        ) {}
      }.toOption
    }
  }

  implicit val databaseConfigDecoder: ConfigDecoder[Secret[NonEmptyString], DbCreds] =
    ConfigDecoder.identity[Secret[NonEmptyString]].mapOption("Database")(apply)
}
