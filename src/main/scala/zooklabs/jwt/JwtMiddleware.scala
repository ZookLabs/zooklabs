package zooklabs.jwt

import java.time.{ZoneOffset, Clock => JClock}

import cats.Show
import cats.data.{EitherT, Kleisli, OptionT}
import cats.effect.{Clock, IO}
import cats.implicits._
import io.chrisdavenport.cats.effect.time.implicits._
import io.chrisdavenport.log4cats.Logger
import io.circe.Decoder
import io.circe.parser.decode
import org.http4s.Credentials.Token
import org.http4s.dsl.Http4sDsl
import org.http4s.headers.Authorization
import org.http4s.server.AuthMiddleware
import org.http4s.{AuthScheme, AuthedRoutes, Request}
import pdi.jwt._
import pdi.jwt.algorithms.JwtHmacAlgorithm
object JwtMiddleware extends Http4sDsl[IO] {

  sealed trait JWTMiddlewareError

  case object AuthorizationMissing                     extends JWTMiddlewareError
  case class FailedToDecode(error: Throwable)          extends JWTMiddlewareError
  case class ContentDecodeError(error: io.circe.Error) extends JWTMiddlewareError

  implicit val showJWTMiddlewareError: Show[JWTMiddlewareError] = Show.show {
    case AuthorizationMissing      => "Authorization Missing"
    case FailedToDecode(error)     => s"Failed to decode [$error]"
    case ContentDecodeError(error) => s"Content Decode Error [$error]"
  }

  private def getToken(
      request: Request[IO]
  ): EitherT[IO, JWTMiddlewareError, String] = {
    request.headers
      .get(Authorization)
      .collect {
        case Authorization(Token(AuthScheme.Bearer, token)) => token
      }
      .toRight[JWTMiddlewareError](AuthorizationMissing)
      .toEitherT[IO]
  }

  private def decodeClaim(
      token: String,
      key: String,
      algorithm: JwtHmacAlgorithm,
      options: JwtOptions = JwtOptions.DEFAULT
  )(implicit clock: Clock[IO]): EitherT[IO, JWTMiddlewareError, JwtClaim] =
    for {
      instant   <- EitherT.right(clock.getInstant)
      fixedClock = JClock.fixed(instant, ZoneOffset.UTC)
      claim     <- Jwt(fixedClock)
                     .decode(token, key, Seq(algorithm), options)
                     .toEither
                     .leftMap[JWTMiddlewareError](FailedToDecode)
                     .toEitherT[IO]
    } yield claim

  private def decodeContent[A: Decoder](
      content: String
  ): Either[JWTMiddlewareError, A] = {
    decode[A](content).leftMap(ContentDecodeError)
  }

  /**
    * @param key
    * @param algorithm
    * @param options
    * @param recoverWith allows authentication to be optional if no Authorization token is supplied.
    * @tparam A
    * @return
    */
  def make[A: Decoder](
      jwtCreds: JwtCreds,
      options: JwtOptions = JwtOptions.DEFAULT,
      recoverWith: Option[A] = None
  )(implicit clock: Clock[IO], logger: Logger[IO]): AuthMiddleware[IO, A] = {

    val authUser: Kleisli[IO, Request[IO], Either[JWTMiddlewareError, A]] =
      Kleisli[IO, Request[IO], Either[JWTMiddlewareError, A]] { request =>
        (for {
          token   <- getToken(request)
          claim   <- decodeClaim(token, jwtCreds.key.value.value, jwtCreds.algorithm, options)
          content <- decodeContent(claim.content).toEitherT[IO]
        } yield content).value.map {
          case Left(AuthorizationMissing) => recoverWith.toRight(AuthorizationMissing)
          case result                     => result
        }
      }

    val onFailure: AuthedRoutes[JWTMiddlewareError, IO] =
      Kleisli { request =>
        logger.debug(
          s"Auth Failed reason : [${request.context.show}] request : [${request.req}]"
        )
        OptionT.liftF(Forbidden())
      }

    AuthMiddleware(authUser, onFailure)
  }
}
