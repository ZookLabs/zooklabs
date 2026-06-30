import usersRepo from "../repositories/usersRepo.ts"
import { getAuthUser } from "./helpers.ts"
import { Context, Status } from "oak"
import zookrepo from "../repositories/zookRepo.ts"

export default async (
  urlZookId: string,
  username: string,
  context: Context,
) => {
  const authUser = getAuthUser(context)
  if (!authUser) {
    context.response.status = Status.Unauthorized
    return
  }

  try {
    const isAdmin = await usersRepo.isUserAdmin(authUser.id)
    if (!isAdmin) {
      context.response.status = Status.Unauthorized
      return
    }

    const zookIdParsed = parseInt(urlZookId, 10)
    if (isNaN(zookIdParsed)) {
      context.response.status = Status.BadRequest
      context.response.body = "Invalid zook ID"
      return
    }

    const ownerId = await usersRepo.getUserEntity(username)
    if (!ownerId) {
      context.response.status = Status.NotFound
      context.response.body = "User not found"
      return
    }
    try {
      await zookrepo.setOwner(
        zookIdParsed,
        ownerId.id,
      )
    } catch (error) {
      console.error("Failed to set owner:", error)
      context.response.status = Status.BadRequest
      context.response.body = "Failed to set owner"
    }

    context.response.status = Status.OK
    context.response.body = "Owner updated successfully"
  } catch (error) {
    console.error("Failed to set owner:", error)
    context.response.status = Status.InternalServerError
  }
}
