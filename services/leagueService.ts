import leaguesRepo from "../repositories/leaguesRepo.ts"
import { League, LeagueRanksContainer, Leagues, LeagueTrial } from "../types.ts"
import { OverallScoreCalculations } from "./overallScoreCalculations.ts"
import { TrialTables } from "../db/schema.ts"

export const getLeagues = async (): Promise<Leagues> => {
  return {
    sprint: await leaguesRepo.getLeader("sprint"),
    block_push: await leaguesRepo.getLeader("block_push"),
    hurdles: await leaguesRepo.getLeader("hurdles"),
    high_jump: await leaguesRepo.getLeader("high_jump"),
    lap: await leaguesRepo.getLeader("lap"),
    overall_league: await leaguesRepo.getLeader("overall_league"),
  }
}

export const getLeague = async (trial: keyof TrialTables): Promise<League> => {
  return {
    updatedAt: (await leaguesRepo.getLeagueUpdatedAt(trial)) ??
      "not updated yet",
    entries: await leaguesRepo.listLeague(trial),
  }
}

export const updateLeagues = async (): Promise<void> => {
  await leaguesRepo.updateDefaultLeagues()
  await updateOverallLeague()
}

interface UnrankedTrial {
  id: number
  name: string
  score: number
}

const getOverallScores = (container: LeagueRanksContainer): LeagueTrial[] => {
  const rankTrial = (trial: UnrankedTrial, index: number): LeagueTrial => ({
    zookId: trial.id,
    name: trial.name,
    score: trial.score,
    position: index + 1,
  })

  const overallResults = container.leagueRanks.map((leagueRank) => {
    const overallScore = OverallScoreCalculations.calculateOverallScore(
      leagueRank,
      container.leagueCounts,
    )
    return {
      id: leagueRank.id,
      name: leagueRank.name,
      score: overallScore,
    }
  })

  const sortedResults = overallResults.sort((a, b) => b.score - a.score)

  return sortedResults.map((result, index) => rankTrial(result, index))
}

export const updateOverallLeague = async (): Promise<void> => {
  const container = await leaguesRepo.getRanks()
  const results = getOverallScores(container)
  await leaguesRepo.updateOverallLeagueData(results)
}
