package zooklabs.endpoints

import cats.data.EitherT
import cats.effect.IO
import cats.implicits._
import io.circe.generic.AutoDerivation
import org.http4s.circe.{CirceEntityDecoder, CirceEntityEncoder}
import org.http4s.dsl.Http4sDsl
import org.http4s.server.AuthMiddleware
import org.http4s._
import org.typelevel.log4cats.Logger
import zooklabs.endpoints.model.AuthUser
import zooklabs.repository.{UserRepository, ZookRepository}
import zooklabs.types.Username

class AdminEndpoints(
    zookRepository: ZookRepository,
    userRepository: UserRepository,
    secureMiddleware: AuthMiddleware[IO, AuthUser]
)(implicit logger: Logger[IO])
    extends Http4sDsl[IO]
    with AutoDerivation
    with CirceEntityDecoder
    with CirceEntityEncoder {

  val setUserEndpoint: PartialFunction[AuthedRequest[IO, AuthUser], IO[Response[IO]]] = {
    case PATCH -> Root / "zook" / zookIdStr / "owner" / username as user =>
      userRepository
        .isUserAdmin(user.id)
        .ifA[Response[IO]](
          (for {
            zookId <- EitherT.fromEither[IO](zookIdStr.toIntOption.toRight(BadRequest()))
            refinedUsername <-
              EitherT.fromEither[IO](Username.from(username)).leftMap(_ => BadRequest())
            ownerId <-
              EitherT(userRepository.getUserId(refinedUsername).map(_.toRight(BadRequest())))
            setOwnerResult <-
              EitherT(zookRepository.setOwner(zookId, ownerId)).leftMap(e => BadRequest(e))
          } yield setOwnerResult).value.flatMap {
            case Left(resp) => resp
            case Right(_)   => Ok(())
          },
          IO(Response[IO](status = Status.Unauthorized))
        )
  }

  val endpoints: HttpRoutes[IO] = secureMiddleware(AuthedRoutes.of(setUserEndpoint))
}
