package zooklabs.program

import cats.effect.{IO, Timer}
import cats.implicits._
import fs2.Stream
import zooklabs.`enum`.Trials
import zooklabs.repository.LeagueRepository

import scala.concurrent.duration._

final class UpdateLeagueProgram(leagueRepository: LeagueRepository)(implicit timer: Timer[IO]) {

  def run(): Stream[IO, Unit] = {
    (Stream.eval(Trials.values.traverse(updateLeague(leagueRepository))) ++ Stream
      .sleep_[IO](1.hour)).repeat.void
  }

  def updateLeague(leagueRepository: LeagueRepository)(trial: Trials): IO[Int] = {
    leagueRepository.updateLeagueOrder(trial) >> leagueRepository.setLeagueUpdatedAtQuery(
      trial
    )
  }

}
