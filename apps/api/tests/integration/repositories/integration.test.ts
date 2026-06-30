import usersRepo from "../../../repositories/usersRepo.ts"
import zookRepo from "../../../repositories/zookRepo.ts"
import leaguesRepo from "../../../repositories/leaguesRepo.ts"
// import {
//   initializeLeaguesMetadata,
// } from "./setup.ts"
import { createTestUser, createTestZookContainer } from "./fixtures.ts"
import db from "../../../db/db.ts"
import { expect } from "@std/expect"
import { cleanupTestDatabase, initializeLeaguesMetadata } from "./setup.ts"

/**
 * Cross-Repository Integration Deno.tests
 * Deno.tests workflows combining multiple repositories and verifying ACID properties
 */

Deno.test.beforeEach(() => {
})

Deno.test.afterEach(async () => {
  await cleanupTestDatabase()
})

// Deno.test("complete workflow: user → zook → trials → leagues", async () => {
//     await initializeLeaguesMetadata()

//     // 1. Create user
//     const userFixture = createTestUser()
//     const user = await usersRepo.persistUser(userFixture)
//     await usersRepo.setUsername(user.id,"champion")

//     expect(user.discordId).toBe(userFixture.discordId)
//     expect(user.id).toBeDefined()

//     // 2. Upload zook
//     const container = createTestZookContainer()
//     container.zook.owner = user.id
//     container.sprint!.score = 12.0
//     container.blockPush!.score = 300
//     container.hurdles!.score = 14.5
//     container.highJump!.score = 1.8
//     container.lap!.score = 45.0

//     const zookId = await zookRepo.persistZook(container, async () => {
//       // Verify transactions work together
//     })

//     expect(zookId).toBeDefined()

//     // 3. Verify zook ownership
//     const zook = await zookRepo.getEntity(zookId)
//     expect(zook.owner).toBe(user.id)

//     // 4. Verify trials persisted
//     const sprintResult = await zookRepo.getTrial("sprint", zookId)
//     expect(sprintResult).toBeDefined()
//     expect(sprintResult!.score).toBe(12.0)

//     // 5. Update league rankings
//     await leaguesRepo.updateLeague("sprint")

//     // 6. Verify user is in league
//     const league = await leaguesRepo.listLeague("sprint")
//     expect(league.length).toBe(1)
//     expect(league[0].zookId).toBe(zookId)
//   })

Deno.test("multiple users with multiple zooks creates rankings", async () => {
  await initializeLeaguesMetadata()

  // Create users
  const user1 = await usersRepo.persistUser(createTestUser())
  await usersRepo.setUsername(user1.id, "alice")
  const user2 = await usersRepo.persistUser(createTestUser())
  await usersRepo.setUsername(user2.id, "bob")
  const user3 = await usersRepo.persistUser(createTestUser())
  await usersRepo.setUsername(user3.id, "charlie")

  // User 1: Upload 2 zooks
  const container1a = createTestZookContainer()
  container1a.zook.owner = user1.id
  container1a.sprint!.score = 12.0

  const container1b = createTestZookContainer()
  container1b.zook.owner = user1.id
  container1b.sprint!.score = 11.0

  const zook1a = await zookRepo.persistZook(container1a, async () => {})
  const zook1b = await zookRepo.persistZook(container1b, async () => {})

  // User 2: Upload 1 zook
  const container2 = createTestZookContainer()
  container2.zook.owner = user2.id
  container2.sprint!.score = 13.0

  const zook2 = await zookRepo.persistZook(container2, async () => {})

  // User 3: Upload 1 zook
  const container3 = createTestZookContainer()
  container3.zook.owner = user3.id
  container3.sprint!.score = 10.0

  const zook3 = await zookRepo.persistZook(container3, async () => {})

  // Update rankings
  await leaguesRepo.updateDefaultLeagues()

  // Verify league rankings
  const league = await leaguesRepo.listLeague("sprint")
  // updateDefaultLeagues
  expect(league.length).toBe(4)
  expect(league[0].zookId).toBe(zook2) // 13.0 - highest
  expect(league[1].zookId).toBe(zook1a) // 12.0
  expect(league[2].zookId).toBe(zook1b) // 11.0
  expect(league[3].zookId).toBe(zook3) // 10.0 - lowest

  // Verify user count is 3 (not 4 zooks)
  const users = await usersRepo.list()
  expect(users.length).toBe(3)
})

Deno.test("transaction rollback on callback failure", async () => {
  const container = createTestZookContainer()
  let errorThrown = false

  try {
    await zookRepo.persistZook(container, async () => {
      return await Promise.reject("Simulated callback error")
    })
  } catch (_) {
    errorThrown = true
  }

  expect(errorThrown).toBe(true)

  // Verify zook was NOT persisted (transaction rolled back)
  const allZooks = await zookRepo.list()
  expect(allZooks.length).toBe(0)
})

Deno.test("disqualification affects rankings", async () => {
  await initializeLeaguesMetadata()

  // Create users and zooks
  const user1 = await usersRepo.persistUser(createTestUser())
  await usersRepo.setUsername(user1.id, "user1")
  const user2 = await usersRepo.persistUser(createTestUser())
  await usersRepo.setUsername(user2.id, "user2")

  const container1 = createTestZookContainer()
  container1.zook.owner = user1.id
  container1.sprint!.score = 12.0

  const container2 = createTestZookContainer()
  container2.zook.owner = user2.id
  container2.sprint!.score = 11.0

  const zook1 = await zookRepo.persistZook(container1, async () => {})
  const zook2 = await zookRepo.persistZook(container2, async () => {})

  // Initial rankings
  await leaguesRepo.updateDefaultLeagues()
  let league = await leaguesRepo.listLeague("sprint")
  expect(league.length).toBe(2)
  expect(league[0].zookId).toBe(zook1)
  // updateDefaultLeagues
  // Disqualify top zook
  await db
    .updateTable("sprint")
    .set({ disqualified: true })
    .where("zookid", "=", zook1)
    .execute()

  // Update rankings
  await leaguesRepo.updateDefaultLeagues()

  // Verify new ranking (zook1 excluded, zook2 is now first)
  league = await leaguesRepo.listLeague("sprint")
  // expect(league.lengthupdateDefaultLeagues
  expect(league[0].zookId).toBe(zook2)
  expect(league[0].position).toBe(1)
})

Deno.test("overall league aggregates multi-trial rankings", async () => {
  await initializeLeaguesMetadata()

  // Create users and zooks
  const user1 = await usersRepo.persistUser(createTestUser())
  await usersRepo.setUsername(user1.id, "user1")
  const user2 = await usersRepo.persistUser(createTestUser())
  await usersRepo.setUsername(user2.id, "user2")

  const container1 = createTestZookContainer()
  container1.zook.owner = user1.id
  container1.sprint!.score = 12.0
  container1.blockPush!.score = 300
  container1.hurdles!.score = 14.5
  container1.highJump!.score = 1.8
  container1.lap!.score = 45.0

  const container2 = createTestZookContainer()
  container2.zook.owner = user2.id
  container2.sprint!.score = 11.0
  container2.blockPush!.score = 280
  container2.hurdles!.score = 15.0
  container2.highJump!.score = 1.7
  container2.lap!.score = 46.0

  await zookRepo.persistZook(container1, async () => {})
  await zookRepo.persistZook(container2, async () => {})

  // Update all league rankings
  await leaguesRepo.updateDefaultLeagues()

  // Get multi-trial ranks
  const ranks = await leaguesRepo.getRanks()
  expect(ranks.leagueRanks.length).toBe(2)
  expect(ranks.leagueCounts.sprint).toBe(2)
  expect(ranks.leagueCounts.blockPush).toBe(2)
  expect(ranks.leagueCounts.hurdles).toBe(2)
  expect(ranks.leagueCounts.highJump).toBe(2)
  expect(ranks.leagueCounts.lap).toBe(2)

  // Verify first rank has all positions
  const topRank = ranks.leagueRanks[0]
  expect(topRank.sprintPosition).toBe(1)
  expect(topRank.blockPushPosition).toBe(1)
})

// Deno.test("view tracking across zook operations", async () => {
//   const user = await usersRepo.persistUser(createTestUser())

//   const container = createTestZookContainer()
//   container.zook.owner = user.id
//   const zookId = await zookRepo.persistZook(container, async () => {})

//   // Initial views should be 0
//   let zook = await zookRepo.getEntity(zookId)
//   expect(zook.views).toBe(0)

//   // Simulate views
//   await zookRepo.getEntityIncreaseViews(zookId)
//   zook = await zookRepo.getEntity(zookId)
//   expect(zook.views).toBe(1)

//   await zookRepo.getEntityIncreaseViews(zookId)
//   await zookRepo.getEntityIncreaseViews(zookId)
//   zook = await zookRepo.getEntity(zookId)
//   expect(zook.views).toBe(3)

//   // Verify downloads also work
//   await zookRepo.incrementDownloads(zookId)
//   zook = await zookRepo.getEntity(zookId)
//   expect(zook.downloads).toBe(1)
// })

// Deno.test("owner information retrieval", async () => {
//   const user = await usersRepo.persistUser(createTestUser())
//   await usersRepo.setUsername(user.id, "zookmaster")

//   const container = createTestZookContainer()
//   container.zook.owner = user.id
//   const zookId = await zookRepo.persistZook(container, async () => {})

//   // Get zook
//   const zook = await zookRepo.getEntity(zookId)
//   expect(zook.owner).toBe(user.id)

//   // Get owner info
//   const owner = await zookRepo.getOwner(zook.owner!)
//   expect(owner.username).toBe("zookmaster")
// })
