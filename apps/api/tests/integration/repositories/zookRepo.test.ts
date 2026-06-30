import zookRepo from "../../../repositories/zookRepo.ts"
import {
  createTestUser,
  createTestZook,
  createTestZookContainer,
} from "./fixtures.ts"
import { expect } from "@std/expect"
import { cleanupTestDatabase } from "./setup.ts"
import { insertTestZook, insertUserWithUsername } from "./helpers.ts"

/**
 * ZookRepo Integration Tests
 * Tests CRUD operations, transactions, and dynamic table access
 */

Deno.test.afterEach(async () => {
  await cleanupTestDatabase()
})

// TESTED
// list
// incrementDownloads
// setOwner

// UNTESTED
// getEntityQuery
// getTrialQuery
// getZook
// persistZook

Deno.test("zookRepo.list returns all zooks in order", async () => {
  const zook1 = createTestZook({ name: "FirstZook" })
  const zook2 = createTestZook({ name: "SecondZook" })
  const zook3 = createTestZook({ name: "ThirdZook" })

  // Insert zooks
  const zook1Id = await insertTestZook(zook1)
  const zook2Id = await insertTestZook(zook2)
  const zook3Id = await insertTestZook(zook3)

  // List zooks
  const list = await zookRepo.list()

  // Verify order (DESC by ID)
  expect(list).toHaveLength(3)
  expect(list).toStrictEqual([
    { id: zook3Id.id, name: zook3.name },
    { id: zook2Id.id, name: zook2.name },
    { id: zook1Id.id, name: zook1.name },
  ])
})

// Deno.test("getEntity() returns zook with date conversion", async () => {
//   const testZook = createTestZook();

//   // Insert zook
//   const inserted = await insertTestZook(testZook);

//   // Get entity
//   const result = await zookRepo.getEntity(inserted.id);

//   // Verify data and date conversions
//   expect(result.name).toStrictEqual(testZook.name);
//   expect(result.datecreated instanceof Date).toStrictEqual(true);
//   expect(result.dateuploaded instanceof Date).toStrictEqual(true);
//   expect(result.downloads).toStrictEqual(0);
//   expect(result.views).toStrictEqual(0);
// });

// Deno.test("getEntityIncreaseViews() increments and returns", async () => {
//   const TestZook = createTestZook();

//   // Insert zook
//   const inserted = await db
//     .insertInto("zook")
//     .values({
//       name: TestZook.name,
//       height: TestZook.height,
//       length: TestZook.length,
//       width: TestZook.width,
//       weight: TestZook.weight,
//       components: TestZook.components,
//       datecreated: TestZook.datecreated.toISOString(),
//       dateuploaded: TestZook.dateuploaded.toISOString(),
//       owner: null,
//       downloads: 0,
//       views: 0,
//     })
//     .returning("id")
//     .executeTakeFirstOrThrow();

//   // Increment views and get
//   const result1 = await zookRepo.getEntityIncreaseViews(inserted.id);
//   const result2 = await zookRepo.getEntityIncreaseViews(inserted.id);

//   expect(result1.views).toStrictEqual(1);
//   expect(result2.views).toStrictEqual(2);
// });

Deno.test("zookRepo.incrementDownloads increments counter", async () => {
  const TestZook = createTestZook()

  // Insert zook
  const inserted = await insertTestZook(TestZook)

  // Increment downloads
  await zookRepo.incrementDownloads(inserted.id)

  // Verify
  const result1 = await zookRepo.getZook(inserted.id, false)
  expect(result1?.about.downloads).toStrictEqual(1)

  // Increment downloads
  await zookRepo.incrementDownloads(inserted.id)

  // Verify
  const result2 = await zookRepo.getZook(inserted.id, false)
  expect(result2?.about.downloads).toStrictEqual(2)
})

// Deno.test("persistZook() creates zook and trials in transaction", async () => {
//   const container = createTestZookContainer();
//   const owner = createTestUser();
//   const persisted = await usersRepo.persistUser(owner);

//   container.zook.owner = persisted.id;

//   // Persist with all trials
//   const zookId = await zookRepo.persistZook(container, async () => {
//     // No-op callback for this Test
//   });

//   expect(zookId).toBeDefined();

//   // Verify zook created
//   const zook = await zookRepo.getEntity(zookId);
//   expect(zook.name).toStrictEqual(container.zook.name);
//   expect(zook.owner).toStrictEqual(persisted.id);

//   // Verify trials created
//   const sprint = await zookRepo.getTrial("sprint", zookId);
//   const blockPush = await zookRepo.getTrial("block_push", zookId);
//   const hurdles = await zookRepo.getTrial("hurdles", zookId);
//   const highJump = await zookRepo.getTrial("high_jump", zookId);
//   const lap = await zookRepo.getTrial("lap", zookId);

//   expect(sprint).toBeDefined();
//   expect(blockPush).toBeDefined();
//   expect(hurdles).toBeDefined();
//   expect(highJump).toBeDefined();
//   expect(lap).toBeDefined();
// });

// Deno.test("persistZook() handles conditional trials", async () => {
//   const container = createTestZookContainer();
//   // Clear some trials
//   container.blockPush = undefined;
//   container.hurdles = undefined;

//   const zookId = await zookRepo.persistZook(container, async () => {});

//   // Verify only some trials exist
//   const sprint = await zookRepo.getTrial("sprint", zookId);
//   expect(sprint).toBeDefined();

//   const blockPush = await zookRepo.getTrial("block_push", zookId);
//   expect(blockPush).toBeUndefined();

//   const hurdles = await zookRepo.getTrial("hurdles", zookId);
//   expect(hurdles).toBeUndefined();
// });

Deno.test("persistZook() transaction callback called", async () => {
  const container = createTestZookContainer()
  let callbackCalled = false
  let callbackZookId = 0

  const zookId = await zookRepo.persistZook(container, async (id) => {
    callbackCalled = true
    callbackZookId = id
    return await Promise.resolve()
  })

  expect(callbackCalled).toStrictEqual(true)
  expect(callbackZookId).toStrictEqual(zookId)
})

Deno.test("zookRepo.setOwner updates owner", async () => {
  const zook = createTestZook()

  // Persist zook and users
  const zookInserted = await insertTestZook(zook)

  const user1 = await insertUserWithUsername(createTestUser(), "owner1")
  const user2 = await insertUserWithUsername(createTestUser(), "owner2")

  const result0 = await zookRepo.getZook(zookInserted.id, false)
  expect(result0?.about.owner).toStrictEqual({
    username: "Anonymous",
  })

  // Set first owner
  await zookRepo.setOwner(zookInserted.id, user1.id)
  const result1 = await zookRepo.getZook(zookInserted.id, false)
  expect(result1?.about.owner).toStrictEqual({
    username: user1.username,
  })

  // Change owner
  await zookRepo.setOwner(zookInserted.id, user2.id)
  const result2 = await zookRepo.getZook(zookInserted.id, false)
  expect(result2?.about.owner).toStrictEqual({
    username: user2.username,
  })
})
