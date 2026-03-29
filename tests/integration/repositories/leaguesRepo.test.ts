import leaguesRepo from "../../../repositories/leaguesRepo.ts"
import zookRepo from "../../../repositories/zookRepo.ts"
import { createTestLeagueTrial, createTestZookContainer } from "./fixtures.ts"
import { Trials } from "../../../repositories/trialsEnum.ts"
import db from "../../../db/db.ts"
import { assertArrayContains } from "./helper.ts"
import { expect } from "@std/expect"
import { cleanupTestDatabase, initializeLeaguesMetadata } from "./setup.ts"

/**
 * LeaguesRepo Integration tests
 * tests ranking queries, window functions, and dynamic table access
 */

Deno.test.afterEach(async () => {
  await cleanupTestDatabase()
})

/**
 * Helper: Create zook with trial results and specific scores
 */
async function createZookWithTrialScores(
  sprintScore: number,
  blockPushScore: number,
  hurdlesScore: number,
  highJumpScore: number,
  lapScore: number,
): Promise<number> {
  const container = createTestZookContainer()
  container.sprint!.score = sprintScore
  container.blockPush!.score = blockPushScore
  container.hurdles!.score = hurdlesScore
  container.highJump!.score = highJumpScore
  container.lap!.score = lapScore

  return await zookRepo.persistZook(container, async () => {})
}

// Deno.test Suite: LeaguesRepo.getLeader()
Deno.test("getLeader() returns first place zook", async () => {
  // Create zooks with trials
  const zookId1 = await createZookWithTrialScores(12.0, 300, 14.5, 1.8, 45.0)
  await createZookWithTrialScores(11.5, 250, 15.0, 1.7, 46.0)

  // Update rankings
  await leaguesRepo.updateDefaultLeagues()

  // Get leader
  const leader = await leaguesRepo.getLeader("sprint")

  // Verify (higher score is better for sprint - descending)
  expect(leader).toBe(zookId1)
})

Deno.test("getLeader() throws when no participants", async () => {
  await initializeLeaguesMetadata()

  // Try to get leader with no data
  await expect(leaguesRepo.getLeader("sprint")).rejects.toThrow(
    "No leader found",
  )
})

Deno.test("listLeague() returns ranked participants", async () => {
  // Create zooks with different scores
  await createZookWithTrialScores(12.0, 300, 14.5, 1.8, 45.0)
  await createZookWithTrialScores(11.5, 250, 15.0, 1.7, 46.0)
  await createZookWithTrialScores(11.0, 200, 15.5, 1.6, 47.0)

  // Update rankings
  await leaguesRepo.updateDefaultLeagues()

  // Get league
  const league = await leaguesRepo.listLeague("sprint")

  // Verify order and count
  assertArrayContains(league, 3)
  expect(league[0].position).toBe(1)
  expect(league[1].position).toBe(2)
  expect(league[2].position).toBe(3)
})

Deno.test("listLeague() excludes disqualified", async () => {
  const zookId1 = await createZookWithTrialScores(12.0, 300, 14.5, 1.8, 45.0)
  const zookId2 = await createZookWithTrialScores(11.5, 250, 15.0, 1.7, 46.0)

  // Disqualify second zook
  await db
    .updateTable("sprint")
    .set({ disqualified: true })
    .where("zookid", "=", zookId2)
    .execute()

  // Update rankings
  await leaguesRepo.updateDefaultLeagues()

  // Get league
  const league = await leaguesRepo.listLeague("sprint")

  // Verify only non-disqualified
  assertArrayContains(league, 1)
  expect(league[0].zookId).toBe(zookId1)
})

Deno.test("updateLeagueOrder() calculates positions correctly", async () => {
  // Create zooks
  const zookId1 = await createZookWithTrialScores(12.0, 300, 14.5, 1.8, 45.0)
  const zookId2 = await createZookWithTrialScores(11.5, 250, 15.0, 1.7, 46.0)
  const zookId3 = await createZookWithTrialScores(11.0, 200, 15.5, 1.6, 47.0)

  // Update league order
  await leaguesRepo.updateLeagueOrder(Trials.Sprint)

  // Verify positions
  const z1 = await db
    .selectFrom("sprint")
    .select("position")
    .where("zookid", "=", zookId1)
    .executeTakeFirst()
  const z2 = await db
    .selectFrom("sprint")
    .select("position")
    .where("zookid", "=", zookId2)
    .executeTakeFirst()
  const z3 = await db
    .selectFrom("sprint")
    .select("position")
    .where("zookid", "=", zookId3)
    .executeTakeFirst()

  expect(z1!.position).toBe(1)
  expect(z2!.position).toBe(2)
  expect(z3!.position).toBe(3)
})

Deno.test("updateDisqualified() sets max position for disqualified", async () => {
  const zookId1 = await createZookWithTrialScores(12.0, 300, 14.5, 1.8, 45.0)
  await createZookWithTrialScores(11.5, 250, 15.0, 1.7, 46.0)

  // Disqualify and update
  await db
    .updateTable("sprint")
    .set({ disqualified: true })
    .where("zookid", "=", zookId1)
    .execute()

  await leaguesRepo.updateDisqualified(Trials.Sprint)

  // Verify position
  const result = await db
    .selectFrom("sprint")
    .select("position")
    .where("zookid", "=", zookId1)
    .executeTakeFirst()

  expect(result!.position).toBe(2147483647)
})

Deno.test("setLeagueUpdatedAt() updates metadata", async () => {
  await initializeLeaguesMetadata()

  const beforeUpdate = new Date().getTime()
  await leaguesRepo.setLeagueUpdatedAt("sprint")
  const afterUpdate = new Date().getTime()

  const result = await leaguesRepo.getLeagueUpdatedAt("sprint")

  expect(result).toBeDefined()
  const updateTime = new Date(result!).getTime()
  expect(updateTime >= beforeUpdate && updateTime <= afterUpdate).toBe(true)
})

Deno.test("getCountQuery() returns participant count", async () => {
  const zookId1 = await createZookWithTrialScores(12.0, 300, 14.5, 1.8, 45.0)
  await createZookWithTrialScores(11.5, 250, 15.0, 1.7, 46.0)

  // Count should be 2
  let count = await leaguesRepo.getCountQuery(Trials.Sprint)
  expect(count).toBe(2)

  // Disqualify one
  await db
    .updateTable("sprint")
    .set({ disqualified: true })
    .where("zookid", "=", zookId1)
    .execute()

  // Count should be 1
  count = await leaguesRepo.getCountQuery(Trials.Sprint)
  expect(count).toBe(1)
})

Deno.test("getLeagueCounts() returns all trial counts", async () => {
  // Create zooks
  await createZookWithTrialScores(12.0, 300, 14.5, 1.8, 45.0)
  await createZookWithTrialScores(11.5, 250, 15.0, 1.7, 46.0)

  const counts = await leaguesRepo.getLeagueCounts()

  expect(counts.sprint).toBe(2)
  expect(counts.blockPush).toBe(2)
  expect(counts.hurdles).toBe(2)
  expect(counts.highJump).toBe(2)
  expect(counts.lap).toBe(2)
})

Deno.test("getRanksQuery() joins all trials", async () => {
  // Create zooks
  await createZookWithTrialScores(12.0, 300, 14.5, 1.8, 45.0)
  await createZookWithTrialScores(11.5, 250, 15.0, 1.7, 46.0)

  // Get ranks
  const ranks = await leaguesRepo.getRanksQuery()

  assertArrayContains(ranks, 2)
  expect(ranks[0].sprintPosition).toBeDefined()
  expect(ranks[0].blockPushPosition).toBeDefined()
  expect(ranks[0].hurdlesPosition).toBeDefined()
  expect(ranks[0].highJumpPosition).toBeDefined()
  expect(ranks[0].lapPosition).toBeDefined()
})

Deno.test("getRanks() returns container with ranks and counts", async () => {
  // Create zooks
  await createZookWithTrialScores(12.0, 300, 14.5, 1.8, 45.0)
  await createZookWithTrialScores(11.5, 250, 15.0, 1.7, 46.0)

  // Get container
  const container = await leaguesRepo.getRanks()

  expect(container.leagueRanks.length).toBe(2)
  expect(container.leagueCounts.sprint).toBe(2)
  expect(container.leagueCounts.blockPush).toBe(2)
})

Deno.test("insertOverallLeagueData() inserts and upserts", async () => {
  const trials = [
    createTestLeagueTrial(1, { score: 5000, position: 1 }),
    createTestLeagueTrial(2, { score: 4000, position: 2 }),
  ]

  // Insert
  await leaguesRepo.insertOverallLeagueData(trials)

  // Verify
  let result = await db
    .selectFrom("overall_league")
    .selectAll()
    .where("zookid", "=", 1)
    .executeTakeFirst()

  expect(result).toBeDefined()
  expect(result!.score).toBe(5000)
  expect(result!.position).toBe(1)

  // Upsert (update)
  const updated = [
    createTestLeagueTrial(1, { score: 5500, position: 1 }),
  ]
  await leaguesRepo.insertOverallLeagueData(updated)

  result = await db
    .selectFrom("overall_league")
    .selectAll()
    .where("zookid", "=", 1)
    .executeTakeFirst()

  expect(result!.score).toBe(5500)
})

Deno.test("updateLeagues() updates rankings and metadata", async () => {
  await createZookWithTrialScores(12.0, 300, 14.5, 1.8, 45.0)
  await createZookWithTrialScores(11.5, 250, 15.0, 1.7, 46.0)

  // Full update
  await leaguesRepo.updateDefaultLeagues()

  // Verify positions updated
  const rankings = await leaguesRepo.listLeague("sprint")
  expect(rankings[0].position).toBe(1)
  expect(rankings[1].position).toBe(2)

  // Verify metadata updated
  const metadata = await leaguesRepo.getLeagueUpdatedAt("sprint")
  expect(metadata).toBeDefined()
})
