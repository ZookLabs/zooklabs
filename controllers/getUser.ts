import { User } from "../types.ts"
import { getUser } from "../services/userService.ts"
import { Context } from "oak"

export default async (urlUsername: string, context: Context) => {
  const user: User = await getUser(urlUsername)
  context.response.body = user
}
