import { Kysely } from "kysely"
import type { DatabaseSchema } from "../schema.ts"

export async function up(db: Kysely<DatabaseSchema>): Promise<void> {
  // update users id to integer
  await db.schema
    .alterTable("users")
    .alterColumn("id", (col) => col.setDataType("integer"))
    .execute()

  await db.schema
    .alterTable("zook")
    .alterColumn("owner", (col) => col.setDataType("integer"))
    .execute()

  // update zook id to integer
  await db.schema
    .alterTable("zook")
    .alterColumn("id", (col) => col.setDataType("integer"))
    .execute()

  await db.schema
    .alterTable("block_push")
    .alterColumn("zookid", (col) => col.setDataType("integer"))
    .execute()

  await db.schema
    .alterTable("high_jump")
    .alterColumn("zookid", (col) => col.setDataType("integer"))
    .execute()

  await db.schema
    .alterTable("hurdles")
    .alterColumn("zookid", (col) => col.setDataType("integer"))
    .execute()

  await db.schema
    .alterTable("lap")
    .alterColumn("zookid", (col) => col.setDataType("integer"))
    .execute()

  await db.schema
    .alterTable("sprint")
    .alterColumn("zookid", (col) => col.setDataType("integer"))
    .execute()

  // update trial name to not null
  await db.schema
    .alterTable("block_push")
    .alterColumn("name", (col) => col.setNotNull())
    .execute()

  await db.schema
    .alterTable("high_jump")
    .alterColumn("name", (col) => col.setNotNull())
    .execute()

  await db.schema
    .alterTable("hurdles")
    .alterColumn("name", (col) => col.setNotNull())
    .execute()

  await db.schema
    .alterTable("lap")
    .alterColumn("name", (col) => col.setNotNull())
    .execute()

  await db.schema
    .alterTable("sprint")
    .alterColumn("name", (col) => col.setNotNull())
    .execute()
}

export async function down(db: Kysely<DatabaseSchema>): Promise<void> {
  // Revert type changes and constraints
  await db.schema
    .alterTable("sprint")
    .alterColumn("name", (col) => col.dropNotNull())
    .execute()

  await db.schema
    .alterTable("lap")
    .alterColumn("name", (col) => col.dropNotNull())
    .execute()

  await db.schema
    .alterTable("hurdles")
    .alterColumn("name", (col) => col.dropNotNull())
    .execute()

  await db.schema
    .alterTable("high_jump")
    .alterColumn("name", (col) => col.dropNotNull())
    .execute()

  await db.schema
    .alterTable("block_push")
    .alterColumn("name", (col) => col.dropNotNull())
    .execute()

  await db.schema
    .alterTable("sprint")
    .alterColumn("zookid", (col) => col.setDataType("serial"))
    .execute()

  await db.schema
    .alterTable("lap")
    .alterColumn("zookid", (col) => col.setDataType("serial"))
    .execute()

  await db.schema
    .alterTable("hurdles")
    .alterColumn("zookid", (col) => col.setDataType("serial"))
    .execute()

  await db.schema
    .alterTable("high_jump")
    .alterColumn("zookid", (col) => col.setDataType("serial"))
    .execute()

  await db.schema
    .alterTable("block_push")
    .alterColumn("zookid", (col) => col.setDataType("serial"))
    .execute()

  await db.schema
    .alterTable("zook")
    .alterColumn("id", (col) => col.setDataType("serial"))
    .execute()

  await db.schema
    .alterTable("zook")
    .alterColumn("owner", (col) => col.setDataType("smallint"))
    .execute()

  await db.schema
    .alterTable("users")
    .alterColumn("id", (col) => col.setDataType("serial"))
    .execute()
}
