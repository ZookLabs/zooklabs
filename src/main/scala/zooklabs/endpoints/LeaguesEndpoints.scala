package zooklabs.endpoints

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

import cats.effect.IO
import cats.implicits._
import io.circe.Encoder
import io.circe.generic.AutoDerivation
import org.http4s.HttpRoutes
import org.http4s.circe._
import org.http4s.dsl.Http4sDsl
import zooklabs.`enum`.Trials
import zooklabs.repository.LeagueRepository

case class LeaguesEndpoints(leagueRepository: LeagueRepository)
    extends Http4sDsl[IO]
    with AutoDerivation
    with CirceEntityEncoder {

  private val dateTimeFormatter = DateTimeFormatter.ofPattern("E, d MMM yyyy HH:mm:ss")

  implicit val encodeLocalDateTime: Encoder[LocalDateTime] =
    Encoder.encodeString
      .contramap[LocalDateTime](_.format(dateTimeFormatter))

  val endpoints: HttpRoutes[IO] = {
    HttpRoutes
      .of[IO] {
        case GET -> Root / trial =>
          Trials
            .parse(trial)
            .map(leagueRepository.getLeague)
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
