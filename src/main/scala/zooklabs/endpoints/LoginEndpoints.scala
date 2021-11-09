package zooklabs.endpoints

import cats.data.EitherT
import cats.effect.{Clock, IO}
import cats.implicits._
import eu.timepit.refined.types.all.NonEmptyString
import io.circe.generic.AutoDerivation
import org.http4s.circe.{CirceEntityDecoder, CirceEntityEncoder}
import org.http4s.client.Client
import org.http4s.client.dsl.io._
import org.http4s.dsl.Http4sDsl
import org.http4s.headers._
import org.http4s.server.AuthMiddleware
import org.http4s.{AuthedRoutes, _}
import org.typelevel.log4cats.Logger
import zooklabs.conf.DiscordOAuthConfig
import zooklabs.endpoints.discord.AccessTokenResponse.decoder
import zooklabs.endpoints.discord.{AccessToken, AccessTokenResponse, UserIdentity}
import zooklabs.endpoints.model.AuthUser
import zooklabs.endpoints.model.signup.Register
import zooklabs.jwt.JwtCreator
import zooklabs.repository.UserRepository
import zooklabs.repository.model.UserEntity
import zooklabs.types.Username

import java.time.{LocalDateTime, ZoneId}
import scala.util.control.NoStackTrace

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

  case object InvalidUsername extends AvailabilityError

  case class Availability(available: Boolean)

  val checkUsernameAvailabilityEndpoint
      : PartialFunction[AuthedRequest[IO, AuthUser], IO[Response[IO]]] = {
    case GET -> Root / "availability" / usernameStr as user =>
      (for {
        _ <- Either.cond(!user.isRegistered, (), AlreadyRegistered: AvailabilityError).toEitherT[IO]
        username <-
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
            case Left(_) => InternalServerError("Username already exists")
            case Right(_) => {
              jwtCreator
                .issueJwt(AuthUser(user.id, register.username.some))
                .flatMap(token => Ok(token))
            }
          }
        }
      }
  }

  sealed trait LoginError extends NoStackTrace

  case class AccessTokenFailure(status: Int, responseBody: String) extends LoginError

  case class UserIdentityFailure(status: Int, responseBody: String) extends LoginError

  def loginRegister(code: String): IO[Response[IO]] = {
    (for {
      accessToken  <- getAccessToken(code)
      userIdentity <- getUserIdentity(accessToken.accessToken)
      user         <- getOrCreateUser(userIdentity)
      token        <- jwtCreator.issueJwt(AuthUser(user.id, user.username))
      response     <- Ok(token)
    } yield response)
      .handleErrorWith {
        case AccessTokenFailure(status, responseBody) =>
          logger.error(
            s"AccessTokenFailure status=$status, body=$responseBody"
          ) >> InternalServerError("something went wrong")
        case UserIdentityFailure(status, responseBody) =>
          logger.error(
            s"UserIdentityFailure status=$status, body=$responseBody"
          ) >> InternalServerError("something went wrong")
        case error =>
          logger.error(s"not sure what happend ${error}") >> InternalServerError(
            "something went wrong"
          )
      }
  }

  def getOrCreateUser(userIdentity: UserIdentity): IO[UserEntity] =
    for {
      instant <- clock.realTimeInstant
      now = LocalDateTime.ofInstant(instant, ZoneId.systemDefault())
      user <- usersRepository.getByDiscordId(userIdentity.id).flatMap {
        case None =>
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

  def getAccessToken(code: String): IO[AccessTokenResponse] =
    client
      .run(
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
      )
      .use {
        case Status.Successful(r) =>
          r.as[AccessTokenResponse]
        case unSuccessful =>
          unSuccessful
            .as[String]
            .flatMap(body => IO.raiseError(AccessTokenFailure(unSuccessful.status.code, body)))
      }

  def getUserIdentity(accessToken: AccessToken): IO[UserIdentity] =
    client
      .run(
        GET(
          discordOAuthConfig.discordApi / "users" / "@me",
          Authorization(Credentials.Token(AuthScheme.Bearer, accessToken.toString))
        )
      )
      .use {
        case Status.Successful(r) =>
          r.as[UserIdentity]
        case unSuccessful =>
          unSuccessful
            .as[String]
            .flatMap(body => IO.raiseError(UserIdentityFailure(unSuccessful.status.code, body)))

      }

  val endpoints: HttpRoutes[IO] = {
    HttpRoutes.of[IO](loginRegisterEndpoint) <+>
      secureMiddleware(AuthedRoutes.of(checkUsernameAvailabilityEndpoint)) <+>
      secureMiddleware(AuthedRoutes.of(registerUsernameEndpoint))
  }

}
