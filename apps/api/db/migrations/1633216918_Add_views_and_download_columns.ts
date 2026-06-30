import { Kysely } from "kysely"
import type { DatabaseSchema } from "../schema.ts"

export async function up(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema
    .alterTable("zook")
    .addColumn("downloads", "integer", (col) => col.notNull().defaultTo(0))
    .execute()

  await db.schema
    .alterTable("zook")
    .addColumn("views", "integer", (col) => col.notNull().defaultTo(0))
    .execute()
}

export async function down(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema.alterTable("zook").dropColumn("views").execute()
  await db.schema.alterTable("zook").dropColumn("downloads").execute()
}
