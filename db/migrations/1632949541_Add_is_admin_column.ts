import { Kysely } from "kysely"
import type { DatabaseSchema } from "../schema.ts"

export async function up(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("is_admin", "boolean", (col) => col.notNull().defaultTo(false))
    .execute()
}

export async function down(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema.alterTable("users").dropColumn("is_admin").execute()
}
