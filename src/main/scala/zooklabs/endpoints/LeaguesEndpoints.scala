package zooklabs.endpoints

import cats.effect.IO
import org.http4s.HttpRoutes
import org.http4s.circe._
import org.http4s.dsl.Http4sDsl
import zooklabs.`enum`.Trials
import zooklabs.repository.LeagueRepository

case class LeaguesEndpoints(trialRepository: LeagueRepository)
    extends Http4sDsl[IO]
    with CirceEntityEncoder {
  val endpoints: HttpRoutes[IO] = {
    HttpRoutes
      .of[IO] {
        case GET -> Root / trial =>
          Trials
            .withValueOpt(trial)
            .map(trialRepository.listLeague)
            .fold(NotFound())(Ok(_))
      }
  }
}
