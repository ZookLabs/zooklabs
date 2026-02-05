import { Kysely } from "kysely"
import type { DatabaseSchema } from "../schema.ts"

export async function up(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema
    .createTable("overall_league")
    .addColumn("zookid", "integer", (col) => col.primaryKey())
    .addColumn("name", "varchar(25)", (col) => col.notNull())
    .addColumn("position", "integer", (col) => col.notNull())
    .addColumn("score", "double precision", (col) => col.notNull())
    .addColumn(
      "disqualified",
      "boolean",
      (col) => col.notNull().defaultTo(false),
    )
    .addForeignKeyConstraint("overall_league_zook_id_fk", ["zookid"], "zook", [
      "id",
    ], (cb) => cb.onDelete("cascade"))
    .execute()

  await db.schema
    .alterTable("leagues_metadata")
    .alterColumn("league", (col) => col.setDataType("varchar(15)"))
    .execute()

  await db
    .insertInto("leagues_metadata")
    .values({
      league: "overall_league",
      updated_at: "1970-01-01 00:00:00.000000",
    })
    .execute()
}

export async function down(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.deleteFrom("leagues_metadata").where("league", "=", "overall_league")
    .execute()
  await db.schema
    .alterTable("leagues_metadata")
    .alterColumn("league", (col) => col.setDataType("varchar(10)"))
    .execute()
  await db.schema.dropTable("overall_league").execute()
}
