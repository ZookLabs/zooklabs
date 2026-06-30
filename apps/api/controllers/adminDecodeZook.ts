import { Context, Status } from "oak"
import { decodeZook, getZookFromRequest } from "./uploadZook.ts"
import usersRepo from "../repositories/usersRepo.ts"
import { getAuthUser } from "./helpers.ts"

export default async (
  context: Context,
) => {
  const authUser = getAuthUser(context)
  if (!authUser) {
    context.response.status = Status.Unauthorized
    return
  }

  const isAdmin = await usersRepo.isUserAdmin(authUser.id)
  if (!isAdmin) {
    context.response.status = Status.Unauthorized
    return
  }
  const zookBytesCleaned = await getZookFromRequest(context)
  if (!zookBytesCleaned) {
    return
  }
  const zookXml = decodeZook(context, zookBytesCleaned)
  if (!zookXml) {
    return
  }
  context.response.status = Status.OK
  context.response.headers.set("Content-Type", "application/xml")
  context.response.body = zookXml
}
