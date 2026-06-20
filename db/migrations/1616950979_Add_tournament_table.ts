import { Kysely } from "kysely"
import type { DatabaseSchema } from "../schema.ts"

export async function up(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema
    .createTable("tournament")
    .addColumn("id", "integer", (col) => col.primaryKey())
    .addColumn("title", "varchar", (col) => col.notNull())
    .addColumn("description", "varchar", (col) => col.notNull())
    .addColumn("owner_id", "integer")
    .addColumn("zooks", "jsonb", (col) => col.notNull())
    .addForeignKeyConstraint("tournament_users_id_fk", ["owner_id"], "users", [
      "id",
    ])
    .execute()
}

export async function down(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema.dropTable("tournament").execute()
}
