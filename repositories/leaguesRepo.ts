import client from "../db/database.ts"
import { LeagueTrial, Trial } from "../types.ts"

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
        `select zookid as zookId, name, score, position from ${trial} where not disqualified order by position`,
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
}

export default new LeaguesRepo()
