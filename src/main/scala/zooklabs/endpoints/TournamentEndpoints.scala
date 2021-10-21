package zooklabs.endpoints

import cats.data.EitherT
import cats.effect.IO
import cats.implicits._
import org.typelevel.log4cats.Logger
import org.http4s.circe.{CirceEntityDecoder, CirceEntityEncoder}
import org.http4s.dsl.Http4sDsl
import org.http4s.{HttpRoutes, Request, Response}
import zooklabs.repository.TournamentRepository

class TournamentEndpoints(tournamentRepository: TournamentRepository)(implicit
    logger: Logger[IO]
) extends Http4sDsl[IO]
    with CirceEntityDecoder
    with CirceEntityEncoder {

  val getTournamentEndpoint: PartialFunction[Request[IO], IO[Response[IO]]] = {
    case GET -> Root / id =>
      (for {
        tournamentId <- EitherT.fromEither[IO](id.toIntOption.toRight(BadRequest()))
        tournament <-
          EitherT(tournamentRepository.getTournament(tournamentId).map(_.toRight(NotFound())))
      } yield tournament).value.flatMap {
        case Left(resp)        => resp
        case Right(tournament) => Ok(tournament)
      }
  }

  val listTournaments: PartialFunction[Request[IO], IO[Response[IO]]] = { case GET -> Root =>
    tournamentRepository.listTournaments().flatMap(tournaments => Ok(tournaments))
  }

  val endpoints: HttpRoutes[IO] = {
    HttpRoutes.of[IO](getTournamentEndpoint orElse listTournaments)
  }
}
