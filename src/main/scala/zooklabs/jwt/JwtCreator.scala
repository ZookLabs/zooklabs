package zooklabs.jwt

import cats.effect.{Clock, IO}
import cats.syntax.option._
import io.circe.Encoder
import io.circe.syntax._
import pdi.jwt.{Jwt, JwtClaim}

import scala.concurrent.duration.{SECONDS, _}

class JwtCreator[A: Encoder](
    jwtCreds: JwtCreds,
    expiryDuration: FiniteDuration
)(implicit clock: Clock[IO]) {

  def issueJwt(content: A): IO[String] =
    clock.realTime
      .map { issuedAt =>
        JwtClaim(
          issuedAt = issuedAt.toSeconds.some,
          expiration = (issuedAt.toSeconds + expiryDuration.toSeconds).some,
          content = content.asJson.noSpaces
        )
      }
      .map(Jwt.encode(_, jwtCreds.key.value.value, jwtCreds.algorithm))

}
