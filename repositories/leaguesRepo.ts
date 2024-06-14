import { QueryObjectResult } from "postgres"
import client from "../db/database.ts"
import {League, LeagueTrial, Trial} from "../types.ts"

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
        `select zookid, name, score, position from ${trial} where not disqualified order by position`,
    })
    return result.rows
  }

  async getLeagueUpdatedAt(trial: Trial): Promise<string | undefined> {
    const result : QueryObjectResult<string> = await client.queryObject<string>({
      text: `select updated_at from leagues_metadata where league = ${trial}`,
    })
    return result.rows.at(0)
  }
}

export default new LeaguesRepo()
