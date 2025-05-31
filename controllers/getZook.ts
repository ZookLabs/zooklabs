import { Context } from "oak"
import { getZook } from "../services/zookService.ts"
import { Zook } from "../types.ts"
import { Status } from "jsr:@oak/commons@0.7/status"

export default async (urlId: string, context: Context) => {
  const id: number = parseInt(urlId)

  if (isNaN(id)) {
    return context.response.status = Status.BadRequest
  }

  const cookieId = `zv_${id}`
  const hasViewed = await context.cookies.has(cookieId)

  const zook: Zook | undefined = await getZook(id, !hasViewed)

  if (zook) {
    if (!hasViewed) {
      await context.cookies.set(cookieId, " ", {
        domain: "zooklabs.com",
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        // secure: true,
        // sameSite: "none",
      })
    }

    context.response.body = zook
  } else {
    return context.response.status = Status.NotFound
  }
}
