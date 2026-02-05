import { Context } from "oak"
import { League, trial } from "../types.ts"
import { getLeague } from "../services/leagueService.ts"
import { Status } from "oak"

export default async (urlLeague: string, context: Context) => {
  if (!trial.includes(urlLeague)) {
    return context.response.status = Status.BadRequest
  }

  const league: League = await getLeague(urlLeague)
  context.response.body = league
}
