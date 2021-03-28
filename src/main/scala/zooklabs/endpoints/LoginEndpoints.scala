package zooklabs.endpoints

import java.time.{Instant, LocalDateTime, ZoneId}

import cats.data.EitherT
import cats.effect.{Clock, IO}
import cats.implicits._
import eu.timepit.refined.types.all.NonEmptyString
import org.typelevel.log4cats.Logger
import io.circe.generic.AutoDerivation
import org.http4s.circe.{CirceEntityDecoder, CirceEntityEncoder}
import org.http4s.client.Client
import org.http4s.client.dsl.io._
import org.http4s.dsl.Http4sDsl
import org.http4s.headers._
import org.http4s.server.AuthMiddleware
import org.http4s.{AuthedRoutes, _}
import zooklabs.conf.DiscordOAuthConfig
import zooklabs.endpoints.discord.AccessTokenResponse.decoder
import zooklabs.endpoints.discord.{AccessToken, AccessTokenResponse, UserIdentity}
import zooklabs.endpoints.model.AuthUser
import zooklabs.endpoints.model.signup.Register
import zooklabs.jwt.JwtCreator
import zooklabs.repository.UserRepository
import zooklabs.repository.model.UserEntity
import zooklabs.types.Username

import scala.concurrent.duration.MILLISECONDS

class LoginEndpoints(
    discordOAuthConfig: DiscordOAuthConfig,
    client: Client[IO],
    usersRepository: UserRepository,
    jwtCreator: JwtCreator[AuthUser],
    secureMiddleware: AuthMiddleware[IO, AuthUser]
)(implicit
    logger: Logger[IO],
    clock: Clock[IO]
) extends Http4sDsl[IO]
    with AutoDerivation
    with CirceEntityDecoder
    with CirceEntityEncoder {

  object CodeQueryParamMatcher extends QueryParamDecoderMatcher[String]("code")

  val loginRegisterEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root :? CodeQueryParamMatcher(code) =>
      loginRegister(code)
  }

  sealed trait AvailabilityError

  case object AlreadyRegistered extends AvailabilityError
  case object InvalidUsername   extends AvailabilityError

  case class Availability(available: Boolean)

  val checkUsernameAvailabilityEndpoint
      : PartialFunction[AuthedRequest[IO, AuthUser], IO[Response[IO]]] = {
    case GET -> Root / "availability" / usernameStr as user =>
      (for {
        _          <- Either.cond(!user.isRegistered, (), AlreadyRegistered: AvailabilityError).toEitherT[IO]
        username   <-
          Username.from(usernameStr).leftMap(_ => InvalidUsername: AvailabilityError).toEitherT[IO]
        userExists <- EitherT.right[AvailabilityError](
                        usersRepository.usernameExists(username)
                      )
      } yield userExists).value.flatMap {
        case Left(value)       => BadRequest("oh no")
        case Right(userExists) => Ok(Availability(userExists.isEmpty))
      }

  }

  val registerUsernameEndpoint: PartialFunction[AuthedRequest[IO, AuthUser], IO[Response[IO]]] = {
    case context @ POST -> Root / "register" as user =>
      if (user.isRegistered) {
        NotImplemented("")
      } else {
        context.req.decode[Register] { register =>
          usersRepository.setUsername(user.id, register.username).flatMap {
            case Left(_)  => InternalServerError("Username already exists")
            case Right(_) => {
              jwtCreator
                .issueJwt(AuthUser(user.id, register.username.some))
                .flatMap(token => Ok(Header("Authorization", s"Bearer $token")))
            }
          }
        }
      }
  }

  def loginRegister(code: String): IO[Response[IO]] = {
    (for {
      accessToken  <- EitherT(getAccessToken(code))
      userIdentity <- EitherT(getUserIdentity(accessToken.accessToken))
      user         <- EitherT.right[String](getOrCreateUser(userIdentity))

      token <- EitherT.right[String](jwtCreator.issueJwt(AuthUser(user.id, user.username)))
    } yield token).value.flatMap {
      case Left(error)  =>
        logger.error(error) >> InternalServerError("something went wrong")
      case Right(token) =>
        Ok(Header("Authorization", s"Bearer $token"))
    }
  }

  def getOrCreateUser(userIdentity: UserIdentity): IO[UserEntity] =
    for {
      epoch <- clock.realTime(MILLISECONDS)
      now    = LocalDateTime.ofInstant(Instant.ofEpochMilli(epoch), ZoneId.systemDefault())
      user  <- usersRepository.getByDiscordId(userIdentity.id).flatMap {
                 case None       =>
                   val discordUsername = NonEmptyString
                     .unsafeFrom(s"${userIdentity.username.value}#${userIdentity.discriminator}")

                   val user = UserEntity(
                     username = None,
                     discordId = userIdentity.id,
                     discordUsername = discordUsername,
                     signUpAt = now,
                     lastLoginAt = now
                   )
                   usersRepository.persistUser(user)
                 case Some(user) =>
                   usersRepository.updateLastLogin(user.id, now) >> user.pure[IO]
               }
    } yield user

  def getAccessToken(code: String): IO[Either[String, AccessTokenResponse]] = {
    client.fetch(
      POST(
        UrlForm(
          "client_id"     -> discordOAuthConfig.clientId.value,
          "client_secret" -> discordOAuthConfig.clientSecret.value,
          "grant_type"    -> "authorization_code",
          "code"          -> code,
          "scope"         -> "identify",
          "redirect_uri"  -> discordOAuthConfig.redirectUri.value
        ),
        discordOAuthConfig.discordApi / "oauth2" / "token"
      )
    ) {
      case Status.Successful(r)    =>
        r.attemptAs[AccessTokenResponse].leftMap(_.message).value
      case Status.ClientError(r)   =>
        r.toString.asLeft[AccessTokenResponse].pure[IO]

//
//            r.attemptAs[DiscordApiError].leftMap(_.message).flatm.value.flatMap {
//          case Left(error) => Ok(error)
//          case Right(resp) => Ok(resp)
//        }
      case Status.ServerError(r)   =>
        r.toString.asLeft[AccessTokenResponse].pure[IO]
      case Status.Informational(r) =>
        r.toString.asLeft[AccessTokenResponse].pure[IO]
      case Status.Redirection(r)   =>
        r.toString.asLeft[AccessTokenResponse].pure[IO]

    }
  }

  def getUserIdentity(accessToken: AccessToken): IO[Either[String, UserIdentity]] = {
    client.fetch(
      GET(
        discordOAuthConfig.discordApi / "users" / "@me",
        Authorization(Credentials.Token(AuthScheme.Bearer, accessToken.toString))
      )
    ) {
      case Status.Successful(r)    =>
        r.attemptAs[UserIdentity].leftMap(_.message).value
      case Status.ClientError(r)   =>
        r.toString.asLeft[UserIdentity].pure[IO]

//
//            r.attemptAs[DiscordApiError].leftMap(_.message).flatm.value.flatMap {
//          case Left(error) => Ok(error)
//          case Right(resp) => Ok(resp)
//        }
      case Status.ServerError(r)   =>
        r.toString.asLeft[UserIdentity].pure[IO]
      case Status.Informational(r) =>
        r.toString.asLeft[UserIdentity].pure[IO]
      case Status.Redirection(r)   =>
        r.toString.asLeft[UserIdentity].pure[IO]
    }
  }

  val endpoints: HttpRoutes[IO] = {
    HttpRoutes.of[IO](loginRegisterEndpoint) <+>
      secureMiddleware(AuthedRoutes.of(checkUsernameAvailabilityEndpoint)) <+>
      secureMiddleware(AuthedRoutes.of(registerUsernameEndpoint))
  }

}
