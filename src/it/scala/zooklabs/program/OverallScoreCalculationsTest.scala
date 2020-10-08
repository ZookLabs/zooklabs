package zooklabs.program

import eu.timepit.refined.auto._
import org.scalatest.funsuite.AnyFunSuite
import zooklabs.repository.model.{LeagueCounts, LeagueRanks}

class OverallScoreCalculationsTest extends AnyFunSuite {

  test("normaliseRank should return zero for first place") {
    assert( OverallScoreCalculations.normaliseRank( 1, 100 ) == 0)
  }

  test("normaliseRank should scale ranks to fractions of 100") {
    // 1st, 2nd, 3rd = 0, 25, 50
    assert( OverallScoreCalculations.normaliseRank( 3, 4 ) == 50)
  }

  test("ReverseScore should return the difference between the maximum score and the given score") {
    assert( OverallScoreCalculations.reverseScore( 500 ) == 49500 )
  }

  test("processNormalised should square and round a given score") {
    // 2.5 => 6.25 => 6
    assert( OverallScoreCalculations.processNormalised( 2.5 ) == 6 )
  }

  test("getSingleLeagueScore should normalise and process a given rank") {
    // 3/4 => 50 => 2500
    assert( OverallScoreCalculations.getSingleLeagueScore( 3, 4 ) == 2500 )
  }

  test("getSingleLeagueScore should return zero for a zook in first place") {
    assert( OverallScoreCalculations.getSingleLeagueScore( 1, 100 ) == 0 )
  }

  test("calculateOverallScore should return the sum of all processed league scores reversed") {
    val leagueRanks = LeagueRanks( 1, "Name", 2, 2, 2, 2, 2 )
    val leagueCounts = LeagueCounts( 2, 4, 5, 10, 20 )

    // Normalised: 50, 25, 20, 10, 5
    // Squared: 2500 + 625 + 400 + 100 + 25 = 3650
    // Reversed = 50,000 - 3650 = 46,350
    assert( OverallScoreCalculations.calculateOverallScore( leagueRanks, leagueCounts ) == 46350 )
  }

  test("calculateOverallScore should return the maximum score if first in all leagues") {
    val leagueRanks = LeagueRanks( 1, "Name", 1, 1, 1, 1, 1 )
    val leagueCounts = LeagueCounts( 2, 4, 5, 10, 20 )

    assert( OverallScoreCalculations.calculateOverallScore( leagueRanks, leagueCounts ) == 50000 )
  }
}
