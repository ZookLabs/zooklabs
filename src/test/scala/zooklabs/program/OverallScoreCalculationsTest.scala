package zooklabs.program

import eu.timepit.refined.auto._
import zooklabs.repository.model.{LeagueCounts, LeagueRanks}

class OverallScoreCalculationsTest extends munit.FunSuite {

  test("normaliseRank should return zero for first place") {
    assertEquals(OverallScoreCalculations.normaliseRank(1, 100), 0d)
  }

  test("normaliseRank should scale ranks to fractions of 100") {
    // 1st, 2nd, 3rd = 0, 25, 50
    assertEquals(OverallScoreCalculations.normaliseRank(3, 4), 50d)
  }

  test("processNormalised should square and round a given score") {
    // 2.5 => 6.25 => 6
    assertEquals(OverallScoreCalculations.processNormalised(2.5), 6L)
  }

  test("getSingleLeagueScore should normalise and process a given rank") {
    // 3/4 => 50 => 250
    assertEquals(OverallScoreCalculations.getSingleLeagueScore(3, 4), 2500L)
  }

  test("getSingleLeagueScore should return zero for a zook in first place") {
    assertEquals(OverallScoreCalculations.getSingleLeagueScore(1, 100), 0L)
  }

  test("calculateOverallScore should return the sum of all processed league scores reversed") {
    val leagueRanks  = LeagueRanks(1, "Name", 2, 2, 2, 2, 2)
    val leagueCounts = LeagueCounts(2, 4, 5, 10, 20)

    // Normalised: 50, 25, 20, 10, 5
    // Squared: 2500 + 625 + 400 + 100 + 25 = 3650
    // Reversed = 50,000 - 3650 = 46,350
    assertEquals(OverallScoreCalculations.calculateOverallScore(leagueRanks, leagueCounts), 46350L)
  }

  test("calculateOverallScore should return the maximum score if first in all leagues") {
    val leagueRanks  = LeagueRanks(1, "Name", 1, 1, 1, 1, 1)
    val leagueCounts = LeagueCounts(2, 4, 5, 10, 20)

    assertEquals(OverallScoreCalculations.calculateOverallScore(leagueRanks, leagueCounts), 50000L)
  }
}
