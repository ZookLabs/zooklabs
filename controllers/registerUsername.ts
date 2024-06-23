import { Context, Status } from "oak"
import { createJwt, getAuthUser, usernameRegex } from "./helpers.ts"
import usersRepo from "../repositories/usersRepo.ts"
import { AuthUser } from "../types.ts"

export default async (context: Context) => {
  const authUser = getAuthUser(context)

  const body = await context.request.body().value

  const username = body["username"]
  if (username === undefined) {
    context.response.status = Status.BadRequest
    return
  }

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

  try {
    await usersRepo.setUsername(authUser.id, username)

    const newAuthUser: AuthUser = {
      id: authUser.id,
      username: username,
      anonymous: false,
    }

    context.response.body = await createJwt(newAuthUser)
    context.response.status = Status.OK
    return
  } catch (_e) {
    context.response.body = "Username already exists"
    context.response.status = Status.BadRequest
    return
  }
}
