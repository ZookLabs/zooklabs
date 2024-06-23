import { Context, Status } from "oak"
import { getAuthUser, usernameRegex } from "./helpers.ts"
import usersRepo from "../repositories/usersRepo.ts"

export default async (username: string, context: Context) => {
  const authUser = getAuthUser(context)

  if (authUser.username) {
    context.response.body = "Username already set"
    context.response.status = Status.Unauthorized
    return
  }

  if (!username.match(usernameRegex)) {
    context.response.body = "Invalid username"
    context.response.status = Status.BadRequest
    return
  }

  const usernameExists = await usersRepo.usernameExists(username)

  context.response.body = { available: !usernameExists }
  context.response.status = Status.OK
  return
}
