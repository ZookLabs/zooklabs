import { Kysely } from "kysely"
import type { DatabaseSchema } from "../schema.ts"

export async function up(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema
    .createTable("auto_trial_results")
    .addColumn("zookid", "serial", (col) => col.notNull().primaryKey())
    .addColumn("sprint", "double precision", (col) => col.notNull())
    .addColumn("blockPush", "double precision", (col) => col.notNull())
    .addColumn("hurdles", "double precision", (col) => col.notNull())
    .addColumn("highJump", "double precision", (col) => col.notNull())
    .addColumn("lap", "double precision", (col) => col.notNull())
    .addForeignKeyConstraint(
      "auto_trial_results_zook_id_fk",
      ["zookid"],
      "zook",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()
}

export async function down(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema.dropTable("auto_trial_results").execute()
}

