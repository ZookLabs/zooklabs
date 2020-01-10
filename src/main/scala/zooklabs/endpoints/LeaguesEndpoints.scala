package zooklabs.endpoints

import cats.effect.IO
import io.circe.syntax._
import org.http4s.HttpRoutes
import org.http4s.circe._
import org.http4s.dsl.Http4sDsl
import zooklabs.`enum`.Trials
import zooklabs.repository.TrialRepository

case class LeaguesEndpoints(trialRepository: TrialRepository) extends Http4sDsl[IO] {
  val endpoints: HttpRoutes[IO] = {
    HttpRoutes
      .of[IO] {
        case GET -> Root / trial =>
          Trials
            .withValueOpt(trial)
            .map(trialRepository.listTrial)
            .map(_.map(_.asJson))
            .fold(NotFound())(Ok(_))
      }
  }
}
