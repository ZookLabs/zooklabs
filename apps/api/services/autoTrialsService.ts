import {AutoTrialResults} from "../db/schema.ts";
import autoTrialsRepo from "../repositories/autoTrialsRepo.ts";

export const getAutoTrialResults = async(zookId: number): Promise<AutoTrialResults | undefined>  => {
    return await autoTrialsRepo.getAutoTrialResults(zookId);
}

export const addAutoTrialResults = async(results: AutoTrialResults): Promise<void> => {
    await autoTrialsRepo.addAutoTrialResults(results);
}