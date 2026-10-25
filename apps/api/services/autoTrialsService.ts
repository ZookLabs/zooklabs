import {AutoTrialResultsEntity} from "../types.ts";
import autoTrialsRepo from "../repositories/autoTrialsRepo.ts";

export const getAutoTrialResults = async(zookId: number): Promise<AutoTrialResultsEntity | undefined>  => {
    return await autoTrialsRepo.getAutoTrialResults(zookId);
}

export const addAutoTrialResults = async(results: AutoTrialResultsEntity): Promise<void> => {
    await autoTrialsRepo.addAutoTrialResults(results);
}