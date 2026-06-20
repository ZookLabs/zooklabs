import { Kysely } from "kysely"
import type { DatabaseSchema } from "../schema.ts"

export async function up(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema
    .createTable("zook")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(25)", (col) => col.notNull())
    .addColumn("height", "double precision", (col) => col.notNull())
    .addColumn("length", "double precision", (col) => col.notNull())
    .addColumn("width", "double precision", (col) => col.notNull())
    .addColumn("weight", "double precision", (col) => col.notNull())
    .addColumn("components", "integer", (col) => col.notNull())
    .addColumn("datecreated", "timestamp", (col) => col.notNull())
    .addColumn("dateuploaded", "timestamp", (col) => col.notNull())
    .execute()

  await db.schema
    .createTable("sprint")
    .addColumn("zookid", "serial", (col) => col.notNull())
    .addColumn("name", "varchar(25)")
    .addColumn("position", "integer", (col) => col.notNull())
    .addColumn("score", "double precision", (col) => col.notNull())
    .addForeignKeyConstraint(
      "sprint_zook_id_fk",
      ["zookid"],
      "zook",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()

  await db.schema
    .createTable("block_push")
    .addColumn("zookid", "serial", (col) => col.notNull())
    .addColumn("name", "varchar(25)")
    .addColumn("position", "integer", (col) => col.notNull())
    .addColumn("score", "double precision", (col) => col.notNull())
    .addForeignKeyConstraint(
      "blockpush_zook_id_fk",
      ["zookid"],
      "zook",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()

  await db.schema
    .createTable("hurdles")
    .addColumn("zookid", "serial", (col) => col.notNull())
    .addColumn("name", "varchar(25)")
    .addColumn("position", "integer", (col) => col.notNull())
    .addColumn("score", "double precision", (col) => col.notNull())
    .addForeignKeyConstraint(
      "hurdles_zook_id_fk",
      ["zookid"],
      "zook",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()

  await db.schema
    .createTable("high_jump")
    .addColumn("zookid", "serial", (col) => col.notNull())
    .addColumn("name", "varchar(25)")
    .addColumn("position", "integer", (col) => col.notNull())
    .addColumn("score", "double precision", (col) => col.notNull())
    .addForeignKeyConstraint(
      "highjump_zook_id_fk",
      ["zookid"],
      "zook",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()

  await db.schema
    .createTable("lap")
    .addColumn("zookid", "serial", (col) => col.notNull())
    .addColumn("name", "varchar(25)")
    .addColumn("position", "integer", (col) => col.notNull())
    .addColumn("score", "double precision", (col) => col.notNull())
    .addForeignKeyConstraint(
      "lap_zook_id_fk",
      ["zookid"],
      "zook",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()
}

export async function down(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema.dropTable("lap").execute()
  await db.schema.dropTable("high_jump").execute()
  await db.schema.dropTable("hurdles").execute()
  await db.schema.dropTable("block_push").execute()
  await db.schema.dropTable("sprint").execute()
  await db.schema.dropTable("zook").execute()
}
