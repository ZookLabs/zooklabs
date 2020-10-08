package zooklabs.program

import cats.effect.{IO, Timer}
import cats.implicits._
import eu.timepit.refined.types.all.NonNegInt
import eu.timepit.refined.types.string.NonEmptyString
import fs2.Stream
import zooklabs.`enum`.Trials
import zooklabs.model.LeagueTrial
import zooklabs.repository.LeagueRepository
import zooklabs.repository.model.LeagueRanksContainer

import scala.concurrent.duration._

final class UpdateLeagueProgram(leagueRepository: LeagueRepository)(implicit timer: Timer[IO]) {

  def updateLeague = {
    Trials.values.traverse(leagueRepository.updateLeagues) >> updateOverallLeague
  }

  def getOverallScores(container: LeagueRanksContainer): List[LeagueTrial] = {

    case class UnrankedTrial( id:NonNegInt, name:NonEmptyString, score:Double )

    val rankTrial = (trial: UnrankedTrial, index: Int) => LeagueTrial( trial.id, trial.name, trial.score, index + 1 )

    val overallResults = for {
      leagueRanks <- container.leagueRanks
      leagueCounts = container.leagueCounts
      overallScore = OverallScoreCalculations.calculateOverallScore(leagueRanks, leagueCounts)
    } yield UnrankedTrial(leagueRanks.id, leagueRanks.name, overallScore)

    val sortedResults = overallResults.sortBy(_.score)

    (for ( (result, index) <- sortedResults.view.zipWithIndex ) yield rankTrial(result, index)).toList
  }

  def updateOverallLeague = {
    for {
      container <- leagueRepository.getRanks
      results    = getOverallScores(container)
      _         <- leagueRepository.insertOverallLeagueData(results)
    } yield ()
  }

  def run(): Stream[IO, Unit] = {
    (Stream.eval(updateLeague) ++ Stream
      .sleep_[IO](1.hour)).repeat.void
  }

}
