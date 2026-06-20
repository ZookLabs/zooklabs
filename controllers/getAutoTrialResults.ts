import { Context, Status } from "oak"
import {getAutoTrialResults} from "../services/autoTrialsService.ts";

export default async (urlId: string, context: Context) => {
    const id: number = parseInt(urlId)

    if (isNaN(id)) {
        return context.response.status = Status.BadRequest;
    }

    try {
        const autoTrialResults = await getAutoTrialResults(id);

        if (!autoTrialResults){
            return context.response.status = Status.NotFound;
        }

        context.response.body = autoTrialResults;
    } catch (e) {

        console.error(e);
    }
}