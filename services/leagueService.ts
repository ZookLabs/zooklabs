import leaguesRepo from "../repositories/leaguesRepo.ts"
import { Leagues } from "../types.ts"


export const getLeagues = async (): Promise<Leagues> => {

    const leagues = {
        sprint: await leaguesRepo.getLeader('sprint'),
        block_push: await leaguesRepo.getLeader('block_push'),
        hurdles: await leaguesRepo.getLeader('hurdles'),
        high_jump: await leaguesRepo.getLeader('high_jump'),
        lap: await leaguesRepo.getLeader('lap'),
        overall_league: await leaguesRepo.getLeader('overall_league'),
    };

    return leagues;
};