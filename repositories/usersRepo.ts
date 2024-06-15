import {UserIdentifier} from "../types.ts";
import client from "../db/database.ts";

class UsersRepo {
  async list(): Promise<Array<UserIdentifier>> {
    const result = await client.queryObject<UserIdentifier>(
      "SELECT username FROM users WHERE username IS NOT NULL",
    )
    return result.rows
  }
}

export default new UsersRepo()
