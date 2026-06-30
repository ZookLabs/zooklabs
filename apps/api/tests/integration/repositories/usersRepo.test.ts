import usersRepo, {
  getUserEntityQuery,
  getUsernameQuery,
  getZooksByUserQuery,
} from "../../../repositories/usersRepo.ts"
import { createTestUser, createTestZook } from "./fixtures.ts"
import db from "../../../db/db.ts"
import { assertRecentDate } from "./helper.ts"
import { expect } from "@std/expect"
import { cleanupTestDatabase } from "./setup.ts"
import {
  getAccountById,
  insertTestZook,
  insertUserWithUsername,
} from "./helpers.ts"

Deno.test.afterEach(async () => {
  await cleanupTestDatabase()
})

Deno.test(
  "userRepo.getEntity should throw error if user does not exist",
  { sanitizeResources: false },
  async () => {
    await expect(usersRepo.getEntity("testUser")).rejects.toThrow(
      "User not found",
    )
  },
)

Deno.test("userRepo.getEntity should return entity", async () => {
  const loggedInAt = new Date(Date.UTC(2026, 0, 1, 0, 0, 0))
  const signUpAt = new Date(Date.UTC(2025, 0, 1, 0, 0, 0))
  const testUser = await insertUserWithUsername(
    createTestUser({ lastLoginAt: loggedInAt, signUpAt: signUpAt }),
    "testUser",
  )

  const zook1Id = await insertTestZook(
    createTestZook({ owner: testUser.id, name: "bob" }),
  )
  const zook2Id = await insertTestZook(
    createTestZook({ owner: testUser.id, name: "alice" }),
  )

  const result = await usersRepo.getEntity("testUser")

  expect(result).toStrictEqual({
    identifier: {
      username: "testUser",
    },
    about: {
      signUpAt: "Wednesday 1 January 2025",
      lastLoginAt: "Thursday 1 January 2026",
    },
    zooks: [
      { id: zook2Id.id, name: "alice" },
      { id: zook1Id.id, name: "bob" },
    ],
  })
})

Deno.test("getZooksByUserQuery should list of owned zooks", async () => {
  const testUser = await usersRepo.persistUser(createTestUser())

  const zook1Id = await insertTestZook(
    createTestZook({ owner: testUser.id, name: "bob" }),
  )
  const zook2Id = await insertTestZook(
    createTestZook({ owner: testUser.id, name: "alice" }),
  )

  //retrieve zooks
  const results = await getZooksByUserQuery(testUser.id, db)
  expect(results).toHaveLength(2)
  expect(results).toStrictEqual([
    { id: zook2Id.id, name: "alice" },
    { id: zook1Id.id, name: "bob" },
  ])
})

Deno.test(
  "getZooksByUserQuery should return empty array when no zooks exist",
  async () => {
    const testUser = await usersRepo.persistUser(createTestUser())

    //retrieve zooks
    const results = await getZooksByUserQuery(testUser.id, db)
    expect(results).toHaveLength(0)
  },
)

Deno.test("usersRepo.list returns accounts with username set", async () => {
  // Create test users
  await insertUserWithUsername(createTestUser(), "alice")
  await insertUserWithUsername(createTestUser(), "bob")
  await usersRepo.persistUser(createTestUser())

  // List users
  const result = await usersRepo.list()

  // Verify - should only include non-null usernames
  expect(result.length).toStrictEqual(2)
  expect(result.some((u) => u.username === "alice")).toStrictEqual(true)
  expect(result.some((u) => u.username === "bob")).toStrictEqual(true)
})

Deno.test(
  "getUserEntityQuery finds by username case-insensitive",
  async () => {
    // Insert user
    await insertUserWithUsername(createTestUser(), "testUser")

    // Query with different cases
    const result1 = await getUserEntityQuery("testuser", db)
    const result2 = await getUserEntityQuery("TESTUSER", db)
    const result3 = await getUserEntityQuery("testUser", db)

    // Verify all match
    expect(result1.username).toStrictEqual("testUser")
    expect(result2.username).toStrictEqual("testUser")
    expect(result3.username).toStrictEqual("testUser")
  },
)

Deno.test("getUserEntityQuery converts dates correctly", async () => {
  // Insert user
  await insertUserWithUsername(createTestUser(), "dateTest")

  // Retrieve user
  const result = await getUserEntityQuery("dateTest", db)

  // Verify dates are Date objects, not strings
  expect(result.signUpAt instanceof Date).toStrictEqual(true)
  expect(result.lastLoginAt instanceof Date).toStrictEqual(true)
  assertRecentDate(result.signUpAt)
  assertRecentDate(result.lastLoginAt)
})

Deno.test(
  "getUserEntityQuery throws error if user does not exist",
  async () => {
    await expect(getUserEntityQuery("doesNotExist", db)).rejects.toThrow(
      "User not found",
    )
  },
)

Deno.test("usersRepo.getByDiscordId finds user by Discord ID", async () => {
  const testUser = createTestUser({ discordId: "123456789" })

  // Insert user
  await usersRepo.persistUser(testUser)

  // Query by Discord ID
  const result = await usersRepo.getByDiscordId("123456789")

  expect(result).toBeDefined()
  expect(result!.discordId).toStrictEqual("123456789")
  expect(result!.discordUsername).toStrictEqual(testUser.discordUsername)
})

Deno.test(
  "usersRepo.getByDiscordId returns undefined for non-existent user",
  async () => {
    const result = await usersRepo.getByDiscordId("nonexistent")
    expect(result).toBeUndefined()
  },
)

Deno.test(
  "usersRepo.persistUser creates new user with generated ID",
  async () => {
    const testUser = createTestUser()
    // Persist user
    const result = await usersRepo.persistUser(testUser)

    // Verify ID was assigned
    expect(result.id).toBeDefined()

    // Verify user exists in database
    const retrieved = await getAccountById(result.id)

    expect(retrieved).toBeDefined()
    expect(retrieved).toStrictEqual({
      ...testUser,
      id: result.id,
      isAdmin: false,
    })
  },
)

Deno.test(
  "usersRepo.setUsername should allow the username to be set if the username is null",
  async () => {
    // Persist user
    const persisted = await usersRepo.persistUser(createTestUser())

    // verify username is undefined
    const beforeUpdate = await usersRepo.getByDiscordId(persisted.discordId)
    expect(beforeUpdate!.id).toStrictEqual(persisted.id)
    expect(beforeUpdate!.username).toBeNull()

    // Set username
    await usersRepo.setUsername(persisted.id, "testusername")

    // Verify update
    const afterUpdate = await usersRepo.getByDiscordId(persisted.discordId)
    expect(afterUpdate!.id).toStrictEqual(persisted.id)
    expect(afterUpdate!.username).toStrictEqual("testusername")
  },
)

Deno.test(
  "usersRepo.setUsername should not allow the username to be updated after its set",
  async () => {
    // Persist user
    const persisted = await usersRepo.persistUser(createTestUser())
    // set username
    await usersRepo.setUsername(persisted.id, "testusername")

    // verify username is undefined
    const beforeUpdate = await usersRepo.getByDiscordId(persisted.discordId)
    expect(beforeUpdate!.id).toStrictEqual(persisted.id)
    expect(beforeUpdate!.username).toStrictEqual("testusername")

    // Attempt to set username again
    await usersRepo.setUsername(persisted.id, "newusername")

    // Verify username is unchanged
    const afterUpdate = await usersRepo.getByDiscordId(persisted.discordId)
    expect(afterUpdate!.id).toStrictEqual(persisted.id)
    expect(afterUpdate!.username).toStrictEqual("testusername")
  },
)

Deno.test(
  "usersRepo.setUsername should fail if username already exists",
  async () => {
    // existing user
    await insertUserWithUsername(createTestUser(), "testusername")

    // Persist user
    const persisted = await usersRepo.persistUser(createTestUser())

    // set username
    await expect(
      usersRepo.setUsername(persisted.id, "testusername"),
    ).rejects.toThrow("Username already exists")
  },
)

Deno.test(
  "usersRepo.setUsername should fail if username is anonymous",
  async () => {
    // Persist user
    const persisted = await usersRepo.persistUser(createTestUser())

    // set username
    await expect(
      usersRepo.setUsername(persisted.id, "anonymous"),
    ).rejects.toThrow("Can't set this username")
  },
)

Deno.test("usersRepo.usernameExists checks username availability", async () => {
  // Persist user
  await insertUserWithUsername(createTestUser(), "existinguser")

  // Check existence
  const exists = await usersRepo.usernameExists("existinguser")
  const notExists = await usersRepo.usernameExists("newuser")

  expect(exists).toStrictEqual(true)
  expect(notExists).toStrictEqual(false)
})

Deno.test("usersRepo.usernameExists is case-insensitive", async () => {
  // Persist user
  await insertUserWithUsername(createTestUser(), "CaseSensitive")

  // Check with different cases
  expect(await usersRepo.usernameExists("casesensitive")).toStrictEqual(true)
  expect(await usersRepo.usernameExists("CASESENSITIVE")).toStrictEqual(true)
  expect(await usersRepo.usernameExists("CaseSensitive")).toStrictEqual(true)
})

Deno.test("usersRepo.updateLastLogin updates timestamp", async () => {
  const initalLoggedInAtInital = new Date(Date.UTC(2026, 0, 1, 0, 0, 0))
  const testUser = createTestUser({ lastLoginAt: initalLoggedInAtInital })
  const persisted = await usersRepo.persistUser(testUser)

  // Retrieve and verify
  const beforeUpdate = await getAccountById(persisted.id)
  expect(beforeUpdate).toBeDefined()
  expect(beforeUpdate?.lastLoginAt).toStrictEqual(initalLoggedInAtInital)

  // Update last login
  const initalLoggedInAtUpdated = new Date(Date.UTC(2026, 6, 6, 0, 0, 0))
  await usersRepo.updateLastLogin(persisted.id, initalLoggedInAtUpdated)

  // Retrieve and verify
  const afterUpdate = await getAccountById(persisted.id)
  expect(afterUpdate).toBeDefined()
  expect(afterUpdate?.lastLoginAt).toStrictEqual(initalLoggedInAtUpdated)
})

Deno.test("usersRepo.isUserAdmin returns admin status", async () => {
  // Create regular user
  const regularUser = createTestUser()
  const regular = await usersRepo.persistUser(regularUser)

  // Create admin user
  const adminUser = createTestUser()
  const admin = await usersRepo.persistUser(adminUser)
  // set user to admin
  await db.updateTable("users").set({ isAdmin: true }).where(
    "id",
    "=",
    admin.id,
  ).execute()

  // Check statuses
  expect(await usersRepo.isUserAdmin(regular.id)).toStrictEqual(false)
  expect(await usersRepo.isUserAdmin(admin.id)).toStrictEqual(true)
})

Deno.test(
  "usersRepo.isUserAdmin returns false for non-existent user",
  async () => {
    const result = await usersRepo.isUserAdmin(999999)
    expect(result).toStrictEqual(false)
  },
)

Deno.test("getUsernameQuery returns username if set", async () => {
  const testUser = await insertUserWithUsername(createTestUser(), "bob")
  const result = await getUsernameQuery(testUser.id, db)

  expect(result).toStrictEqual({ username: "bob" })
})
Deno.test(
  "getUsernameQuery returns undefined if username is not set",
  async () => {
    const testUser = await usersRepo.persistUser(createTestUser())
    const result = await getUsernameQuery(testUser.id, db)
    expect(result).toBeUndefined()
  },
)
Deno.test(
  "getUsernameQuery returns undefined if user does not exist",
  async () => {
    const result = await getUsernameQuery(99999999, db)
    expect(result).toBeUndefined()
  },
)
