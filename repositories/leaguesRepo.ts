import client from "../db/database.ts"
import { LeagueCounts, LeagueRanks, LeagueRanksContainer, LeagueTrial, Trial } from "../types.ts"
import { Trials } from "./trialsEnum.ts"

class LeaguesRepo {
  async getLeader(trial: Trial): Promise<number> {
    const result = await client.queryObject<{ zookid: number }>({
      text: `select zookid from ${trial} where position = 1`,
    })
    return result.rows[0].zookid
  }

  async listLeague(trial: Trial): Promise<LeagueTrial[]> {
    const result = await client.queryObject<LeagueTrial>({
      text:
        `select zookid as zook_id, name, score, position from ${trial} where not disqualified order by position`,
      camelCase: true,
    })
    return result.rows
  }

  async getLeagueUpdatedAt(trial: Trial): Promise<string | undefined> {
    const result = await client.queryObject<{ updated_at: string }>(
      "select updated_at from leagues_metadata where league = $1",
      [trial],
    )
    return result.rows.at(0)?.updated_at
  }


  async updateLeagueOrder(trial: Trials): Promise<void> {
    await client.queryObject({
      text: `
        update ${trial.value} trial
        set position = t.pos
        from (
          select row_number() over (order by t.score ${trial.ordering.sql}, t.zookid asc) as pos, t.zookid
          from ${trial.value} t where not t.disqualified
        ) t
        where trial.zookid = t.zookid and not trial.disqualified
      `,
    });
  }

  async updateDisqualified(trial: Trials): Promise<void> {
    await client.queryObject({
      text: `
        update ${trial.value} trial
        set position = 2147483647
        where disqualified and position != 2147483647
      `,
    });
  }

  async setLeagueUpdatedAt(trial: Trials): Promise<void> {
    await client.queryObject({
      text: `
        update leagues_metadata
        set updated_at = now()
        where league = $1
      `,
      args: [trial.value],
    });
  }

  async updateLeagues(trial: Trials): Promise<void> {
    await this.updateLeagueOrder(trial);
    await this.updateDisqualified(trial);
    await this.setLeagueUpdatedAt(trial);
  }

  async getCountQuery(trial: Trials): Promise<number> {
    const result = await client.queryObject<{ count: number }>({
      text: `SELECT COUNT(*) as count FROM ${trial.value} WHERE NOT disqualified`,
    });
    return result.rows[0].count;
  }

  async getLeagueCounts(): Promise<LeagueCounts> {
    const [sprint, blockPush, hurdles, highJump, lap] = await Promise.all([
      this.getCountQuery(Trials.Sprint),
      this.getCountQuery(Trials.BlockPush),
      this.getCountQuery(Trials.Hurdles),
      this.getCountQuery(Trials.HighJump),
      this.getCountQuery(Trials.Lap),
    ]);

    return { sprint, blockPush, hurdles, highJump, lap };
  }



  async getRanksQuery(): Promise<LeagueRanks[]> {
    const result = await client.queryObject<LeagueRanks>({
      text: `
        SELECT z.id, z.name, s.position AS sprintPosition, b.position AS blockPushPosition,
               h.position AS hurdlesPosition, hj.position AS highJumpPosition, l.position AS lapPosition
        FROM zook z
        INNER JOIN sprint s ON z.id = s.zookid
        INNER JOIN block_push b ON z.id = b.zookid
        INNER JOIN hurdles h ON z.id = h.zookid
        INNER JOIN high_jump hj ON z.id = hj.zookid
        INNER JOIN lap l ON z.id = l.zookid
        WHERE NOT s.disqualified AND NOT b.disqualified AND NOT h.disqualified
          AND NOT hj.disqualified AND NOT l.disqualified
      `,
      camelCase: true,
    });
    return result.rows;
  }

  async getRanks(): Promise<LeagueRanksContainer> {
    const [leagueRanks, leagueCounts] = await Promise.all([
      this.getRanksQuery(),
      this.getLeagueCounts(),
    ]);

    return { leagueRanks, leagueCounts };
  }

  async insertOverallLeagueData(overallTrials: LeagueTrial[]): Promise<void> {
    const queryText = `
      INSERT INTO overall_league (zookid, name, score, position)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (zookid) DO UPDATE
      SET score = excluded.score,
          position = excluded.position
    `;

    const queries = overallTrials.map(trial =>
      client.queryObject({
        text: queryText,
        args: [trial.zookId, trial.name, trial.score, trial.position],
      })
    );

    await Promise.all(queries);
  }

  async updateOverallLeagueData(overallTrials: LeagueTrial[]): Promise<void> {
    await this.insertOverallLeagueData(overallTrials);
    await this.setLeagueUpdatedAt(Trials.Overall);
  }

}

export default new LeaguesRepo()
