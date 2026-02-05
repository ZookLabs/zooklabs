import { Kysely } from "kysely"
import type { DatabaseSchema } from "../schema.ts"

export async function up(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema
    .alterTable("sprint")
    .addColumn(
      "disqualified",
      "boolean",
      (col) => col.notNull().defaultTo(false),
    )
    .execute()

  await db.schema
    .alterTable("block_push")
    .addColumn(
      "disqualified",
      "boolean",
      (col) => col.notNull().defaultTo(false),
    )
    .execute()

  await db.schema
    .alterTable("hurdles")
    .addColumn(
      "disqualified",
      "boolean",
      (col) => col.notNull().defaultTo(false),
    )
    .execute()

  await db.schema
    .alterTable("high_jump")
    .addColumn(
      "disqualified",
      "boolean",
      (col) => col.notNull().defaultTo(false),
    )
    .execute()

  await db.schema
    .alterTable("lap")
    .addColumn(
      "disqualified",
      "boolean",
      (col) => col.notNull().defaultTo(false),
    )
    .execute()
}

export async function down(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema.alterTable("lap").dropColumn("disqualified").execute()
  await db.schema.alterTable("high_jump").dropColumn("disqualified").execute()
  await db.schema.alterTable("hurdles").dropColumn("disqualified").execute()
  await db.schema.alterTable("block_push").dropColumn("disqualified").execute()
  await db.schema.alterTable("sprint").dropColumn("disqualified").execute()
}
