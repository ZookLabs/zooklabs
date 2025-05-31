import { Context, Status } from "oak"
import usersRepo from "../repositories/usersRepo.ts"
import { AuthUser, UserEntity } from "../types.ts"
import { createJwt } from "./helpers.ts"

interface AccessTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  scope: string
  token_type: string
}

async function getAccessToken(code: string): Promise<AccessTokenResponse> {
  const formData = new FormData()
  formData.append(
    "client_id",
    Deno.env.get("DISCORD_OAUTH_CLIENT_ID") ?? "123456789012345678",
  )
  formData.append(
    "client_secret",
    Deno.env.get("DISCORD_OAUTH_CLIENT_SECRET") ??
      "abcdefghij1234567890abcdef123456",
  )
  formData.append("grant_type", "authorization_code")
  formData.append("code", code)
  formData.append("scope", "identify")
  formData.append(
    "redirect_uri",
    Deno.env.get("DISCORD_OAUTH_REDIRECT_URI") ??
      "http://localhost:3000/login",
  )

  const resp: Response = await fetch(
    "https://discord.com/api/v6/oauth2/token",
    {
      method: "POST",
      body: formData,
    },
  )

  const body: AccessTokenResponse = await resp.json()
  return body
}

interface UserIdentity {
  id: string
  username: string
  discriminator: string
  avatar?: string
  bot?: boolean
  system?: boolean
  mfa_enabled?: boolean
  locale?: string
  flags?: number
  premium_type?: number
  public_flags?: number
}

async function getUserIdentity(accessToken: string): Promise<UserIdentity> {
  const resp: Response = await fetch(
    "https://discord.com/api/v6/users/@me",
    {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
  const body: UserIdentity = await resp.json()
  return body
}

async function getOrCreateUser(
  userIdentity: UserIdentity,
): Promise<UserEntity> {
  const user: UserEntity | undefined = await usersRepo.getByDiscordId(
    userIdentity.id,
  )
  if (user) {
    const now: Date = new Date()
    await usersRepo.updateLastLogin(user.id, now)
    return {
      ...user,
      lastLoginAt: now,
    }
  } else {
    const userEntity: UserEntity = {
      id: 0,
      discordId: userIdentity.id,
      discordUsername: `${userIdentity.username}#${userIdentity.discriminator}`,
      signUpAt: new Date(),
      lastLoginAt: new Date(),
    }
    const persistedUser: UserEntity = await usersRepo.persistUser(
      userEntity,
    )
    return persistedUser
  }
}

export default async (code: string, context: Context) => {
  const accessToken = await getAccessToken(code)
  const userIdentity = await getUserIdentity(accessToken.access_token)
  const user = await getOrCreateUser(userIdentity)
  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    anonymous: false,
  }
  context.response.body = await createJwt(authUser)
  context.response.status = Status.OK
  return
}
