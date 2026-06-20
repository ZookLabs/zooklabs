import { assertEquals } from "@std/assert"
import { Database } from "../../../db/databaseClient.ts"

// Helper to run shell commands
async function runCommand(
  cmd: string,
  args: string[],
  options?: { cwd?: string },
): Promise<boolean> {
  const command = new Deno.Command(cmd, {
    args,
    cwd: options?.cwd || ".",
  })

  const process = command.spawn()
  const status = await process.status

  return status.success
}

// Start Docker Compose PostgreSQL (clean slate)
async function startPostgres() {
  console.log("🐳 Cleaning up previous Docker Compose resources...")
  await runCommand("docker-compose", ["down", "-v"])

  console.log("🐳 Starting PostgreSQL via Docker Compose...")
  const success = await runCommand("docker-compose", ["up", "-d", "--wait"])

  if (!success) {
    throw new Error("Failed to start docker-compose")
  }
}

// Stop Docker Compose
async function stopPostgres() {
  console.log("🛑 Stopping PostgreSQL...")
  const success = await runCommand("docker-compose", ["down"])

  if (!success) {
    console.warn("Warning: Failed to cleanly stop docker-compose")
  } else {
    console.log("✓ PostgreSQL stopped")
  }
}

// Run migrations
async function runMigrations() {
  console.log("🚀 Running migrations...")

  const success = await runCommand("deno", [
    "task",
    "migrate",
  ])

  if (!success) {
    throw new Error("Failed to run migrations")
  }

  console.log("✓ Migrations executed successfully")
}

// Validate migration created users table
async function validateMigration() {
  console.log("🔍 Validating migration results...")

  const database = new Database()

  await database.connect()

  const result = await database.client.queryObject<{ name: string }>(
    "SELECT name FROM kysely_migration",
  )

  // Verify users table exists
  assertEquals(
    result.rows.map((r) => r.name),
    [
      "V1__Add_tables.ts",
      "V2__Add_LeagueMetadata_Table.ts",
      "V3__Add_users_table.ts",
      "V4__Fix_Type_Checking.ts",
      "V5__Add_disqualification_column.ts",
      "V6__Add_overall_league_table.ts",
      "V7__Add_tournament_table.ts",
      "V8__Add_is_admin_column.ts",
      "V9__Add_views_and_download_columns.ts",
      "1781970964__Add_AutoTrialResults_table.ts",
    ],
    "users table should exist after migration",
  )
}

// Main test runner
async function runTest() {
  console.log("========================================")
  console.log("   Database Migration Test Suite")
  console.log("========================================\n")

  try {
    await startPostgres()
    await runMigrations()
    await validateMigration()

    console.log("\n========================================")
    console.log("  ✅ All tests passed!")
    console.log("========================================")
  } catch (e: unknown) {
    console.error("\n========================================")
    console.error("  ❌ Test failed!")
    console.error("========================================")
    console.error("Error:", e instanceof Error ? e.message : String(e))
    throw e
  } finally {
    await stopPostgres()
  }
}

// Run the test
runTest().catch(() => Deno.exit(1))
