import { randomUUID } from "node:crypto"
import {
  createTrialEntity,
  LeagueTrial,
  TrialEntity,
  UserEntity,
  ZookContainer,
  ZookEntity,
  ZookTrial,
} from "../../../types.ts"

/**
 * Create a test UserEntity with optional overrides
 */
export function createTestUser(
  overrides?: Partial<Omit<UserEntity, "username" | "id">>,
): UserEntity {
  const now = new Date()
  const uuid = randomUUID().substring(0, 10)

  return {
    id: 0, // generated when persisted
    username: null,
    discordId: `discord_${uuid}`,
    discordUsername: `DiscordUser${uuid}`,
    signUpAt: now,
    lastLoginAt: now,
    ...overrides,
  }
}

/**
 * Create a test ZookEntity with optional overrides
 */
export function createTestZook(
  overrides?: Partial<Omit<ZookEntity, "id">>,
): ZookEntity {
  const now = new Date()
  const uuid = randomUUID().substring(0, 10)

  return {
    id: 0, // generated when persisted
    name: `TestZook${uuid}`,
    height: 100,
    length: 150,
    width: 80,
    weight: 50,
    components: 25,
    datecreated: now,
    dateuploaded: now,
    owner: undefined,
    downloads: 0,
    views: 0,
    ...overrides,
  }
}

/**
 * Create a test ZookTrial result with optional overrides
 */
export function createTestTrialResult(
  overrides?: Partial<ZookTrial>,
): ZookTrial {
  return {
    score: Math.random() * 100,
    position: 2147483647,
    disqualified: false,
    ...overrides,
  }
}

/**
 * Create a test ZookContainer with trials
 */
export function createTestZookContainer(
  overrides?: Partial<ZookContainer>,
): ZookContainer {
  const zook = createTestZook()

  return {
    zook,
    sprint: createTestTrialResult({ score: 10.5 }),
    blockPush: createTestTrialResult({ score: 250 }),
    hurdles: createTestTrialResult({ score: 15.2 }),
    highJump: createTestTrialResult({ score: 1.8 }),
    lap: createTestTrialResult({ score: 45.3 }),
    ...overrides,
  }
}

/**
 * Create test LeagueTrial (ranked entry)
 */
export function createTestLeagueTrial(
  zookId: number = 1,
  overrides?: Partial<LeagueTrial>,
): LeagueTrial {
  return {
    zookId,
    name: `Zook${zookId}`,
    score: Math.random() * 10000,
    position: 1,
    ...overrides,
  }
}

/**
 * Batch create multiple users
 */
export function createTestUsers(count: number): UserEntity[] {
  return Array.from({ length: count }, () => createTestUser())
}

/**
 * Batch create multiple zooks
 */
export function createTestZooks(count: number): ZookEntity[] {
  return Array.from({ length: count }, () => createTestZook())
}

/**
 * Create trial results for a zook with custom scores
 */
export function createTestTrialsForZook(
  zookId: number,
  scores: {
    sprint?: number
    blockPush?: number
    hurdles?: number
    highJump?: number
    lap?: number
  },
): {
  sprint?: TrialEntity
  blockPush?: TrialEntity
  hurdles?: TrialEntity
  highJump?: TrialEntity
  lap?: TrialEntity
} {
  const zookName = `Zook${zookId}`

  return {
    sprint: scores.sprint
      ? createTrialEntity(zookId, zookName, scores.sprint)
      : undefined,
    blockPush: scores.blockPush
      ? createTrialEntity(zookId, zookName, scores.blockPush)
      : undefined,
    hurdles: scores.hurdles
      ? createTrialEntity(zookId, zookName, scores.hurdles)
      : undefined,
    highJump: scores.highJump
      ? createTrialEntity(zookId, zookName, scores.highJump)
      : undefined,
    lap: scores.lap
      ? createTrialEntity(zookId, zookName, scores.lap)
      : undefined,
  }
}

/**
 * Create test data for league ranking tests
 * Returns multiple zooks with varying scores
 */
export function createTestLeagueData(count: number = 5): LeagueTrial[] {
  return Array.from({ length: count }, (_, i) =>
    createTestLeagueTrial(i + 1, {
      position: i + 1,
      score: 10000 - i * 1000,
    }))
}
