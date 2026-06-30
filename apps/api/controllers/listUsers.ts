import { Context } from "oak"
import { listUsers } from "../services/userService.ts"
import { UserIdentifier } from "../types.ts"

export default async (context: Context) => {
  const users: UserIdentifier[] = await listUsers()
  context.response.body = users
}
