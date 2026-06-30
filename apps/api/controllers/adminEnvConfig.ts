import { Context, Status } from "oak"
import { getAuthUser } from "./helpers.ts"
import usersRepo from "../repositories/usersRepo.ts"

const ENV_VARS = [
  "BUCKET_NAME",
  "DISCORD_OAUTH_CLIENT_ID",
  "DISCORD_OAUTH_CLIENT_SECRET",
  "DISCORD_OAUTH_REDIRECT_URI",
  "DISCORD_WEBHOOK",
  "GOOGLE_CREDENTIALS",
  "JWT_KEY",
  "PGCA",
  "PGDATABASE",
  "PGHOST",
  "PGPASSWORD",
  "PGPORT",
  "PGUSER",
  "ZOOK_CORE_HEADER",
  "ZOOK_CORE_KEY",
]

export default async (context: Context) => {
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

  const lines = ENV_VARS.map((key) => {
    const value = Deno.env.get(key) ?? ""
    return `${key}='${value}'`
  })

  context.response.headers.set("Content-Type", "text/plain; charset=utf-8")
  context.response.body = lines.join("\n") + "\n"
  context.response.status = Status.OK
}
