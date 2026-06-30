// Source: https://github.com/CodingGarden/fresh-spots/blob/main/app/db/migrate.ts
// Added Deno args

import {
  Migration,
  MigrationResult,
  Migrator,
} from "kysely"
import db from "./db.ts"

const log = (msg: string) => console.log("[Migrations]", msg)

class DenoFileMigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {}
    for await (const file of Deno.readDir("./db/migrations")) {
      migrations[file.name] = await import(`./migrations/${file.name}`)
    }
    return migrations
  }
}

export const migrator = new Migrator({
  db,
  provider: new DenoFileMigrationProvider(),
})

const logMigrationResults = (results?: MigrationResult[], error?: Error) => {
  results?.forEach((it) => {
    if (it.status === "Success") {
      log(`migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    log(`${(error as Error).message}`)
  }
}

// Handle args
// usage: deno run migrate.ts --up-full | --up or --down

switch (Deno.args[0]) {
  case "--up-full": {
    const { results, error } = await migrator.migrateToLatest()
    logMigrationResults(results, error as Error)
    break
  }
  case "--up": {
    const { results, error } = await migrator.migrateUp()
    logMigrationResults(results, error as Error)
    break
  }
  case "--down": {
    const { results, error } = await migrator.migrateDown()
    logMigrationResults(results, error as Error)
    break
  }
  default:
    log("Use --up-full, --up, or --down")
    break
}
