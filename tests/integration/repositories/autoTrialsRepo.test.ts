import {cleanupTestDatabase} from "./setup.ts";
import {AutoTrialResults} from "../../../db/schema.ts";
import {insertAutoTrialResults} from "./helpers.ts";
import AutoTrialsRepo from "../../../repositories/autoTrialsRepo.ts";

import { expect } from "@std/expect"

Deno.test.afterEach(async () => {
    await cleanupTestDatabase()
})

Deno.test("AutoTrialsRepo.getAutoTrialResults() returns results for a given zookId", async () => {
    const trialResults: AutoTrialResults = {
        zookId: 1,
        blockPush: 200,
        highJump: 2,
        hurdles: 120,
        lap: 8,
        sprint: 110
    };

    await insertAutoTrialResults(trialResults);

    const results = await AutoTrialsRepo.getAutoTrialResults(1);

    expect(results).toEqual(trialResults);
})