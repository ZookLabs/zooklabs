import {cleanupTestDatabase} from "./setup.ts";
import {AutoTrialResultsEntity} from "../../../types.ts";
import {insertAutoTrialResults, insertTestZook} from "./helpers.ts";
import {createTestZook} from "./fixtures.ts";
import AutoTrialsRepo from "../../../repositories/autoTrialsRepo.ts";

import { expect } from "@std/expect"

Deno.test.afterEach(async () => {
    await cleanupTestDatabase()
})

// The first test opens the shared database connection, which stays open
Deno.test("AutoTrialsRepo.getAutoTrialResults() returns results for a given zookId", { sanitizeResources: false }, async () => {
    const { id: zookId } = await insertTestZook(createTestZook());
    const trialResults: AutoTrialResultsEntity = {
        zookId,
        blockPush: 200,
        highJump: 2,
        hurdles: 120,
        lap: 8,
        sprint: 110
    };

    await insertAutoTrialResults(trialResults);

    const results = await AutoTrialsRepo.getAutoTrialResults(zookId);

    expect(results).toEqual(trialResults);
})

Deno.test("AutoTrialsRepo.getAutoTrialResults() returns undefined when a zook has no results", async () => {
    const { id: zookId } = await insertTestZook(createTestZook());

    const results = await AutoTrialsRepo.getAutoTrialResults(zookId);

    expect(results).toBeUndefined();
})

Deno.test("AutoTrialsRepo.addAutoTrialResults() inserts and then replaces results", async () => {
    const { id: zookId } = await insertTestZook(createTestZook());
    const first: AutoTrialResultsEntity = {
        zookId,
        blockPush: 200,
        highJump: 2,
        hurdles: 120,
        lap: 8,
        sprint: 110
    };
    const second: AutoTrialResultsEntity = {
        zookId,
        blockPush: 210,
        highJump: 3,
        hurdles: 125,
        lap: 7.5,
        sprint: 115
    };

    await AutoTrialsRepo.addAutoTrialResults(first);
    expect(await AutoTrialsRepo.getAutoTrialResults(zookId)).toEqual(first);

    await AutoTrialsRepo.addAutoTrialResults(second);
    expect(await AutoTrialsRepo.getAutoTrialResults(zookId)).toEqual(second);
})
