package zooklabs.program

import zooklabs.repository.model.{LeagueCounts, LeagueRanks}

object OverallScoreCalculations {
  val MaximumScore = 50_000L

  val square: Double => Double = (x: Double) => x * x

  // We want biggest to be best
  val reverseScore: Long => Long = (score:Long) => MaximumScore - score

  val processNormalised: Double => Long = square andThen Math.round

  // Converts a position on the scale 1 to (entries) to 0 to 100
  def normaliseRank(position: Int, entries: Int): Double = {
    (position - 1) * (100.0 / entries)
  }

  def getSingleLeagueScore(position: Int, entries: Int): Long = {
    val normalised = normaliseRank(position, entries)

    processNormalised( normalised )
  }

  def calculateOverallScore(leagueRanks: LeagueRanks, leagueCounts: LeagueCounts): Long = {
    val trialPositions = List(
      (leagueRanks.sprintPosition, leagueCounts.sprint),
      (leagueRanks.blockPushPosition, leagueCounts.blockPush),
      (leagueRanks.hurdlesPosition, leagueCounts.hurdles),
      (leagueRanks.highJumpPosition, leagueCounts.highJump),
      (leagueRanks.lapPosition, leagueCounts.lap)
    )

//    (for ((position, entries) <- trialPositions) yield getSingleLeagueScore(position, entries)).foldLeft(MaximumScore)( _ - _ )
    reverseScore( (for ((position, entries) <- trialPositions) yield getSingleLeagueScore(position, entries)).sum )
  }
}
