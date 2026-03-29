import { sql } from "kysely"
import db from "../../../db/db.ts"

/**
 * Cleans up test database by truncating all tables
 * Preserves schema but clears data
 * Called between test cases for isolation
 */
export async function cleanupTestDatabase(): Promise<void> {
  console.debug("Cleaning up test database...")

  // Truncate all tables in dependency order
  const tables = [
    "overall_league",
    "lap",
    "high_jump",
    "hurdles",
    "block_push",
    "sprint",
    "tournament",
    "zook",
    "users",
    "leagues_metadata",
  ]

  await Promise.all(tables.map(
    (table) =>
      db.executeQuery(
        sql`TRUNCATE TABLE ${sql.table(table)} CASCADE`.compile(db),
      ),
  ))
  console.debug("Test database cleaned")
}

/**
 * Resets leagues_metadata table with initial entries
 * Call after truncating if tests depend on metadata
 */
export async function initializeLeaguesMetadata(): Promise<void> {
  const trials = [
    "sprint",
    "block_push",
    "hurdles",
    "high_jump",
    "lap",
    "overall_league",
  ]

  for (const trial of trials) {
    await db
      .insertInto("leagues_metadata")
      .values({
        league: trial,
        updatedAt: new Date(),
      })
      .onConflict((oc) => oc.column("league").doNothing())
      .execute()
  }
}
