package zooklabs.endpoints

import cats.data.EitherT
import cats.effect.IO
import cats.implicits._
import org.typelevel.log4cats.Logger
import org.http4s.circe.{CirceEntityDecoder, CirceEntityEncoder}
import org.http4s.dsl.Http4sDsl
import org.http4s.{HttpRoutes, Request, Response}
import zooklabs.repository.UserRepository
import zooklabs.types.Username
class UserEndpoints(
    userRepository: UserRepository
)(implicit logger: Logger[IO])
    extends Http4sDsl[IO]
    with CirceEntityDecoder
    with CirceEntityEncoder {

  val getUserEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / username =>
      (for {
        refinedUsername <- EitherT.fromEither[IO](Username.from(username)).leftMap(_ => NotFound())
        user <- EitherT(userRepository.getUser(refinedUsername).map(_.toRight(NotFound())))
      } yield user).value.flatMap {
        case Left(resp)  => resp
        case Right(user) => Ok(user)
      }
  }

  val listUsersEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = { case GET -> Root =>
    userRepository.listUsers().flatMap(users => Ok(users))
  }

  val endpoints: HttpRoutes[IO] = {
    HttpRoutes.of[IO](getUserEndpoint orElse listUsersEndpoint)
  }
}
