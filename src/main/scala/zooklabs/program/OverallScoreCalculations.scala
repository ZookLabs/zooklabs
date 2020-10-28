package zooklabs.program

import zooklabs.repository.model.{LeagueCounts, LeagueRanks}

object OverallScoreCalculations {
  val MAXIMUM_SCORE = 50_000L

  val square: Double => Double = (x: Double) => x * x

  val processNormalised: Double => Long = square andThen Math.round

  // Converts a position on the scale 1 to (entries) to 0 to 100
  def normaliseRank(position: Int, entries: Long): Double = {
    (position - 1) * (100.0 / entries)
  }

  def getSingleLeagueScore(position: Int, entries: Long): Long = {
    val normalised = normaliseRank(position, entries)

    processNormalised(normalised)
  }

  def calculateOverallScore(leagueRanks: LeagueRanks, leagueCounts: LeagueCounts): Long = {
    val trialPositions = List(
      (leagueRanks.sprintPosition, leagueCounts.sprint),
      (leagueRanks.blockPushPosition, leagueCounts.blockPush),
      (leagueRanks.hurdlesPosition, leagueCounts.hurdles),
      (leagueRanks.highJumpPosition, leagueCounts.highJump),
      (leagueRanks.lapPosition, leagueCounts.lap)
    )
    // We want biggest to be best
    MAXIMUM_SCORE - trialPositions.map { case (position, count) =>
      getSingleLeagueScore(position, count)
    }.sum
  }
}
