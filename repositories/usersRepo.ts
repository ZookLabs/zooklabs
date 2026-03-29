import { User, UserAbout, UserIdentifier, ZookIdentifier } from "../types.ts"
import { UserEntity } from "../types.ts"
import db from "../db/db.ts"
import { Kysely, sql } from "kysely"
import { DatabaseSchema } from "../db/schema.ts"

export const getZooksByUserQuery = async (
  id: number,
  database: Kysely<DatabaseSchema>,
): Promise<ZookIdentifier[]> => {
  return await database
    .selectFrom("zook")
    .select(["id", "name"])
    .where("owner", "=", id)
    .orderBy("id", "desc")
    .$castTo<ZookIdentifier>()
    .execute()
}

export const getUserEntityQuery = async (
  username: string,
  database: Kysely<DatabaseSchema>,
): Promise<UserEntity> => {
  const result = await database
    .selectFrom("users")
    .select([
      "id",
      "username",
      "discordId",
      "discordUsername",
      "signUpAt",
      "lastLoginAt",
    ])
    .where(sql`lower(username)`, "=", username.toLowerCase())
    .executeTakeFirst()

  if (!result) throw new Error("User not found")

  return {
    id: result.id,
    username: result.username,
    discordId: result.discordId,
    discordUsername: result.discordUsername,
    signUpAt: result.signUpAt,
    lastLoginAt: result.lastLoginAt,
  }
}

const usernameExistsQuery = async (
  username: string,
  database: Kysely<DatabaseSchema>,
): Promise<boolean> => {
  const result = await database
    .selectFrom("users")
    .select("username") // Just select the column itself
    .where(sql`lower(username)`, "=", username.toLowerCase())
    .executeTakeFirst()
  return !!result
}

export const getUsernameQuery = async (
  id: number,
  database: Kysely<DatabaseSchema>,
): Promise<UserIdentifier | undefined> => {
  const result = await database
    .selectFrom("users")
    .select("username")
    .where("id", "=", id)
    .executeTakeFirst()

  return result?.username ? { username: result.username } : undefined
}

class UsersRepo {
  async list(): Promise<Array<UserIdentifier>> {
    return await db
      .selectFrom("users")
      .select("username")
      .where("username", "is not", null)
      .$castTo<UserIdentifier>()
      .execute()
  }

  async getUserEntity(username: string): Promise<UserEntity> {
    return await db.transaction().execute(async (trx) => {
      return await getUserEntityQuery(username, trx)
    })
  }

  async getEntity(username: string): Promise<User> {
    return await db.transaction().execute(async (trx) => {
      const userEntity: UserEntity = await getUserEntityQuery(username, trx)
      const userZooks: ZookIdentifier[] = await getZooksByUserQuery(
        userEntity.id,
        trx,
      )
      const userIdentifier: UserIdentifier = {
        username: userEntity.username ?? "Anonymous",
      }

      function formatDate(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }

        const dateTimeFormat = new Intl.DateTimeFormat("en-GB", options)

        return dateTimeFormat
          .formatToParts(date)
          .filter((p) => p.type != "literal")
          .map((p) => p.value)
          .join(" ")
      }

      const userAbout: UserAbout = {
        signUpAt: formatDate(userEntity.signUpAt),
        lastLoginAt: formatDate(userEntity.lastLoginAt),
      }

      const user: User = {
        identifier: userIdentifier,
        about: userAbout,
        zooks: userZooks,
      }

      return user
    })
  }

  async usernameExists(username: string): Promise<boolean> {
    return await usernameExistsQuery(username, db)
  }

  async setUsername(id: number, username: string): Promise<void> {
    if (username.toLowerCase() === "anonymous") {
      throw new Error("Can't set this username")
    }
    await db.transaction().execute(async (trx) => {
      const doesUsernameExists = await usernameExistsQuery(username, trx)

      if (doesUsernameExists) {
        throw new Error("Username already exists")
      }

      await trx
        .updateTable("users")
        .set({ username: username })
        .where("id", "=", id)
        .where("username", "is", null)
        .execute()
    })
  }

  async getByDiscordId(discordId: string): Promise<UserEntity | undefined> {
    const result = await db
      .selectFrom("users")
      .select([
        "id",
        "username",
        "discordId",
        "discordUsername",
        "signUpAt",
        "lastLoginAt",
      ])
      .where("discordId", "=", discordId)
      .executeTakeFirst()

    if (!result) return undefined

    return {
      id: result.id,
      username: result.username,
      discordId: result.discordId,
      discordUsername: result.discordUsername,
      signUpAt: new Date(result.signUpAt),
      lastLoginAt: new Date(result.lastLoginAt),
    }
  }

  async updateLastLogin(id: number, now: Date): Promise<void> {
    await db
      .updateTable("users")
      .set({ lastLoginAt: now })
      .where("id", "=", id)
      .execute()
  }

  async persistUser(
    userEntity: Omit<UserEntity, "username">,
  ): Promise<UserEntity> {
    const result = await db
      .insertInto("users")
      .values({
        username: null,
        discordId: userEntity.discordId,
        discordUsername: userEntity.discordUsername,
        signUpAt: userEntity.signUpAt,
        lastLoginAt: userEntity.lastLoginAt,
        isAdmin: false,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    return {
      ...userEntity,
      username: null,
      id: result.id,
    }
  }

  async isUserAdmin(userId: number): Promise<boolean> {
    const result = await db
      .selectFrom("users")
      .select("isAdmin")
      .where("id", "=", userId)
      .executeTakeFirst()
    return result?.isAdmin ?? false
  }
}

export default new UsersRepo()
