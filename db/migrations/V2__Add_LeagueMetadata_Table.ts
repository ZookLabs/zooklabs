import { Kysely } from "kysely"
import type { DatabaseSchema } from "../schema.ts"

export async function up(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema
    .createTable("leagues_metadata")
    .addColumn("league", "varchar(10)", (col) => col.primaryKey())
    .addColumn("updated_at", "timestamp", (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex("leagues_metadata_league_uindex")
    .on("leagues_metadata")
    .column("league")
    .unique()
    .execute()

  await db
    .insertInto("leagues_metadata")
    .values([
      { league: "sprint", updated_at: "1970-01-01 00:00:00.000000" },
      { league: "block_push", updated_at: "1970-01-01 00:00:00.000000" },
      { league: "hurdles", updated_at: "1970-01-01 00:00:00.000000" },
      { league: "high_jump", updated_at: "1970-01-01 00:00:00.000000" },
      { league: "lap", updated_at: "1970-01-01 00:00:00.000000" },
    ])
    .execute()
}

export async function down(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema.dropTable("leagues_metadata").execute()
}
