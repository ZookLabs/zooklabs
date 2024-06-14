import leaguesRepo from "../repositories/leaguesRepo.ts"
import { League, Leagues, Trial } from "../types.ts"

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

export const getLeague = async (trial: Trial): Promise<League> => {
  return {
    entries: await leaguesRepo.listLeague(trial),
    updatedAt: await leaguesRepo.getLeagueUpdatedAt(trial) ??
      "not updated yet",
  }
}
