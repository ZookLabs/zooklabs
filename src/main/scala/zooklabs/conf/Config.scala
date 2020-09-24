package zooklabs.conf

import java.nio.file.{Path, Paths}

import cats.effect.{ContextShift, IO}
import cats.implicits._
import ciris._
import ciris.refined._
import eu.timepit.refined.api.Refined
import eu.timepit.refined.auto._
import eu.timepit.refined.cats._
import eu.timepit.refined.string.Url
import eu.timepit.refined.types.net.PortNumber
import eu.timepit.refined.types.string.NonEmptyString
import org.http4s.Uri
import org.http4s.implicits.http4sLiteralsSyntax
import pdi.jwt.JwtAlgorithm
import pdi.jwt.algorithms.JwtHmacAlgorithm
import zooklabs.conf.PersistenceConfig.nonEmptyStringPathConfigDecoder
import zooklabs.jwt.JwtCreds

object Config {

  val databaseConfig: ConfigValue[DatabaseConfig] =
    env("DATABASE_URL")
      .as[NonEmptyString]
      .secret
      .default(Secret("postgres://Bernard:Nosey@localhost:5432/zooklabs"))
      .as[DatabaseConfig]

  val persistenceConfig: ConfigValue[PersistenceConfig] =
    env("PERSISTENCE_PATH")
      .as[NonEmptyString]
      .as[Path]
      .default(Paths.get(System.getProperty("user.home")))
      .map(PersistenceConfig.apply)

  val jwtCredsConfig: ConfigValue[JwtCreds] = {

    implicit val jwtHmacAlgorithmDecoder: ConfigDecoder[String, JwtHmacAlgorithm] =
      ConfigDecoder
        .identity[String]
        .mapOption("JwtHmacAlgorithm")(
          JwtAlgorithm.optionFromString(_).collect {
            case algorithm: JwtHmacAlgorithm => algorithm
          }
        )

    (
      env("JWT_KEY").as[NonEmptyString].default("changeme").secret,
      env("JWT_HMAC_ALGO")
        .as[JwtHmacAlgorithm]
        .default(JwtAlgorithm.HS256)
    ).parMapN(
      JwtCreds
    )
  }
  val discordOAuthConfig: ConfigValue[DiscordOAuthConfig] = {
    (
      env("CLIENT_ID").as[String].default("123456789012345678").secret,
      env("CLIENT_SECRET").as[String].default("abcdefghij1234567890abcdef123456").secret,
      env("DISCORD_API")
        .as[String]
        .map(Uri.unsafeFromString)
        .default(uri"https://discord.com/api/v6")
        .as[Uri],
      env("REDIRECT_URI").default("http://localhost:3000/login").as[String Refined Url]
    ).parMapN(
      DiscordOAuthConfig
    )
  }

  val config: ConfigValue[AppConfig] =
    (
      env("PORT").as[PortNumber].default(8080),
      env("HOST").as[String].default("0.0.0.0"),
      databaseConfig,
      persistenceConfig,
      env("DISCORD_WEBHOOK")
        .as[String]
        .map(Uri.unsafeFromString)
        .default(
          uri"https://discordapp.com/api/webhooks/678034781069377537/lwBF1yc_ZqRppSdU1zfrMm1YYSpomQ9LIJwwRM_rXek0IJ-lGYhcfnXN_Vl-AuC1wnql"
        )
        .as[Uri],
      jwtCredsConfig,
      discordOAuthConfig
    )
      .parMapN(AppConfig)

  def load()(implicit f: ContextShift[IO]): IO[AppConfig] = config.load[IO]
}
