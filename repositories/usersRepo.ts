import {
  User,
  UserAbout,
  UserIdentifier,
  ZookEntity,
  ZookIdentifier,
} from "../types.ts"
import client from "../db/database.ts"
import { UserEntity } from "../types.ts"

class UsersRepo {
  async list(): Promise<Array<UserIdentifier>> {
    const result = await client.queryObject<UserIdentifier>(
      "SELECT username FROM users WHERE username IS NOT NULL",
    )
    return result.rows
  }

  async getUserEntity(username: string): Promise<UserEntity> {
    const result = await client.queryObject<UserEntity>(
      {
        text:
          "SELECT id, username, discord_id, discord_username, sign_up_at, last_login_at FROM users WHERE lower(username) = $1",
        args: [username.toLowerCase()],
        camelCase: true,
      },
    )
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
    const userZooks: ZookIdentifier[] = await this.getZooksByUser(userEntity.id)
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

    return dateTimeFormat.formatToParts(date)
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
}

export default new UsersRepo()
