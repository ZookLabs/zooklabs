import { User, UserAbout, UserIdentifier, ZookIdentifier } from "../types.ts"
import client from "../db/database.ts"
import { UserEntity } from "../types.ts"
import db from "../db/db.ts"

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
    const result = await client.queryObject<UserEntity>({
      text:
        "SELECT id, username, discord_id, discord_username, sign_up_at, last_login_at FROM users WHERE lower(username) = $1",
      args: [username.toLowerCase()],
      camelCase: true,
    })
    return result.rows[0]
  }

  async getZooksByUser(id: number): Promise<ZookIdentifier[]> {
    const result = await client.queryObject<ZookIdentifier>(
      "SELECT id, name FROM zook WHERE owner = $1 ORDER BY id DESC",
      [id],
    )
    return result.rows
  }

  async getEntity(username: string): Promise<User> {
    const userEntity: UserEntity = await this.getUserEntity(username)
    const userZooks: ZookIdentifier[] = await this.getZooksByUser(
      userEntity.id,
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
  }

  async usernameExists(username: string): Promise<boolean> {
    const result = await client.queryObject<number>(
      "SELECT 1 from users WHERE LOWER(username) = $1",
      [username.toLowerCase()],
    )
    return (result.rowCount ?? 0) > 0
  }

  async setUsername(id: number, username: string): Promise<void> {
    await client.queryArray("UPDATE users SET username = $2 WHERE id = $1", [
      id,
      username,
    ])
    return
  }

  async getByDiscordId(discordId: string): Promise<UserEntity | undefined> {
    const result = await client.queryObject<UserEntity>({
      text:
        "SELECT id, username, discord_id, discord_username, sign_up_at, last_login_at from users WHERE discord_id = $1",
      args: [discordId],
      camelCase: true,
    })
    return result.rows[0]
  }

  async updateLastLogin(id: number, now: Date): Promise<void> {
    await client.queryArray(
      "UPDATE users SET last_login_at = $1 WHERE id = $2",
      [now, id],
    )
    return
  }

  async persistUser(userEntity: UserEntity): Promise<UserEntity> {
    const insertResult = await client.queryObject<{ id: number }>(
      "insert into users (id, username, discord_id, discord_username, sign_up_at, last_login_at, is_admin) values (DEFAULT, null, $1, $2, $3, $4, DEFAULT) RETURNING id",
      [
        userEntity.discordId,
        userEntity.discordUsername,
        userEntity.signUpAt,
        userEntity.lastLoginAt,
      ],
    )
    return {
      ...userEntity,
      id: insertResult.rows[0].id,
    }
  }

  async isUserAdmin(userId: number): Promise<boolean> {
    const result = await client.queryObject<{ is_admin: boolean }>(
      "SELECT is_admin FROM users WHERE id = $1",
      [userId],
    )
    return result.rows[0]?.is_admin
  }
}

export default new UsersRepo()
