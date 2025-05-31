import { LeagueCounts, LeagueRanks } from "../types.ts"

export class OverallScoreCalculations {
    static readonly MAXIMUM_SCORE = 50_000;

    static square = (x: number): number => x * x;

    static processNormalised = (value: number): number =>
        Math.round(OverallScoreCalculations.square(value));

    // Converts a position on the scale 1 to (entries) to 0 to 100
    static normaliseRank(position: number, entries: number): number {
        return (position - 1) * (100.0 / entries);
    }

    static getSingleLeagueScore(position: number, entries: number): number {
        const normalised = OverallScoreCalculations.normaliseRank(position, entries);
        return OverallScoreCalculations.processNormalised(normalised);
    }

    static calculateOverallScore(
        leagueRanks: LeagueRanks,
        leagueCounts: LeagueCounts
    ): number {
        const trialPositions: [number, number][] = [
            [leagueRanks.sprintPosition, leagueCounts.sprint],
            [leagueRanks.blockPushPosition, leagueCounts.blockPush],
            [leagueRanks.hurdlesPosition, leagueCounts.hurdles],
            [leagueRanks.highJumpPosition, leagueCounts.highJump],
            [leagueRanks.lapPosition, leagueCounts.lap],
        ];

        // We want biggest to be best
        const totalScore = trialPositions.reduce((sum, [position, count]) => {
            return sum + OverallScoreCalculations.getSingleLeagueScore(position, count);
        }, 0);

        return OverallScoreCalculations.MAXIMUM_SCORE - totalScore;
    }
}
