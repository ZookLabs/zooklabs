import { Router, RouterMiddleware } from "oak"
import listZooks from "./controllers/listZooks.ts"
import getZook from "./controllers/getZook.ts"
import getLeagues from "./controllers/getLeagues.ts"
import getLeague from "./controllers/getLeague.ts"
import listUsers from "./controllers/listUsers.ts"
import getUser from "./controllers/getUser.ts"
import { jwtMiddleware, JwtMiddlewareOptions } from "oak-middleware-jwt"
import checkUsernameAvailability from "./controllers/checkUsernameAvailability.ts"
import registerUsername from "./controllers/registerUsername.ts"
const router = new Router()

const text_encoder = new TextEncoder()
export const key: CryptoKey = await crypto.subtle.importKey(
  "raw",
  text_encoder.encode(Deno.env.get("JWT_KEY")),
  { name: "HMAC", hash: { name: "SHA-256" } },
  true,
  ["sign", "verify"],
)

const jwtMiddlewareOptions: JwtMiddlewareOptions = {
  key: key,
  algorithm: "HS256",
}

router
  .get("/api/zooks", listZooks)
  .get(
    "/api/zooks/:id",
    async (context) => {
      await getZook(context?.params?.id, context)
    },
  )
  .get("/api/leagues", getLeagues)
  .get("/api/leagues/:trial", async (context) => {
    await getLeague(context?.params?.trial, context)
  }).get("/api/users", listUsers)
  .get("/api/users/:username", async (context) => {
    await getUser(context?.params?.username, context)
  }).get(
    "/api/login/availability/:username",
    jwtMiddleware<RouterMiddleware<string>>(jwtMiddlewareOptions),
    async (context) => {
      await checkUsernameAvailability(context?.params?.username, context)
    },
  ).post(
    "/api/login/register",
    jwtMiddleware<RouterMiddleware<string>>(jwtMiddlewareOptions),
    registerUsername,
  )

export default router
