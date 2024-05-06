import { Context } from "oak"
import { getLeagues } from "../services/leagueService.ts"

export default async (context: Context) => {
    context.response.body = await getLeagues();
}
