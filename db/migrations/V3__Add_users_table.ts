import { Kysely } from "kysely"
import type { DatabaseSchema } from "../schema.ts"

export async function up(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema
    .createTable("users")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("username", "varchar")
    .addColumn("discord_id", "varchar", (col) => col.notNull())
    .addColumn("discord_username", "varchar", (col) => col.notNull())
    .addColumn("sign_up_at", "timestamp", (col) => col.notNull())
    .addColumn("last_login_at", "timestamp", (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex("user_discord_id_uindex")
    .on("users")
    .column("discord_id")
    .unique()
    .execute()

  await db.schema
    .createIndex("user_username_uindex")
    .on("users")
    .column("username")
    .unique()
    .execute()

  await db.schema
    .alterTable("zook")
    .addColumn("owner", "smallint")
    .execute()

  await db.schema
    .alterTable("zook")
    .addForeignKeyConstraint(
      "zook_user_id_fk",
      ["owner"],
      "users",
      ["id"],
      (cb) => cb.onDelete("set null").onUpdate("cascade"),
    )
    .execute()
}

export async function down(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema.alterTable("zook").dropConstraint("zook_user_id_fk").execute()
  await db.schema.alterTable("zook").dropColumn("owner").execute()
  await db.schema.dropTable("users").execute()
}
