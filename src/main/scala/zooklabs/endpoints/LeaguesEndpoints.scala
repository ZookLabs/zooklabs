package zooklabs.endpoints

import cats.effect.IO
import org.http4s.HttpRoutes
import org.http4s.circe._
import org.http4s.dsl.Http4sDsl
import zooklabs.`enum`.Trials
import zooklabs.repository.LeagueRepository
import cats.implicits._

case class LeaguesEndpoints(leagueRepository: LeagueRepository)
    extends Http4sDsl[IO]
    with CirceEntityEncoder {
  val endpoints: HttpRoutes[IO] = {
    HttpRoutes
      .of[IO] {
        case GET -> Root / trial =>
          Trials
            .withValueOpt(trial)
            .map(leagueRepository.listLeague)
            .fold(NotFound())(Ok(_))
        case GET -> Root =>
          Ok(
            Trials.values.toList
            .traverse(t => leagueRepository.getLeader(t).map(t.value -> _))
            .map[Map[String, Option[Int]]](_.toMap)
          )
      }
  }
}
