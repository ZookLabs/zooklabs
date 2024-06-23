import { Context } from "oak"
import { create, decode } from "djwt"
import { AuthUser } from "../types.ts"
import { key } from "../routes.ts"

export const usernameRegex: RegExp = new RegExp("^[a-z0-9]{3,20}$", "i")

export function getAuthUser(context: Context): AuthUser {
  const authHeader = context.request.headers.get("Authorization")!
  const [, authUser]: [unknown, AuthUser, Uint8Array] = decode<AuthUser>(
    authHeader.slice(7),
  )
  return authUser
}

export async function createJwt(authUser: AuthUser): Promise<string> {
  const issuedAt = Temporal.Now.instant()
  const expiresAt = issuedAt.add({ hours: 24 * 7 })

  return await create({ alg: "HS256", typ: "JWT" }, {
    ...authUser,
    iat: issuedAt.epochSeconds,
    exp: expiresAt.epochSeconds,
  }, key)
}
