import { Router, RouterMiddleware, Status } from "oak"
import listZooks from "./controllers/listZooks.ts"
import getZook from "./controllers/getZook.ts"
import getLeagues from "./controllers/getLeagues.ts"
import getLeague from "./controllers/getLeague.ts"
import listUsers from "./controllers/listUsers.ts"
import getUser from "./controllers/getUser.ts"
import uploadZook from "./controllers/uploadZook.ts"
import adminSetOwner from "./controllers/adminSetOwner.ts"
import { jwtMiddleware, JwtMiddlewareOptions } from "oak-middleware-jwt"
import checkUsernameAvailability from "./controllers/checkUsernameAvailability.ts"
import registerUsername from "./controllers/registerUsername.ts"
import loginRegister from "./controllers/loginRegister.ts"
import { downloadZook } from "./controllers/downloadZook.ts"
import { updateLeagues } from "./services/leagueService.ts"
import { getAuthUser } from "./controllers/helpers.ts"
import adminDecodeZook from "./controllers/adminDecodeZook.ts"
import getAutoTrialResults from "./controllers/getAutoTrialResults.ts";
import addAutoTrialResults from "./controllers/addAutoTrialResults.ts";
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

router.redirect("/", new URL("https://zooklabs.com"))
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
  ).get("/api/login", async (context) => {
    const code = context.request.url.searchParams.get("code")
    if (!code) {
      context.response.status = Status.BadRequest
      return
    }
    await loginRegister(code, context)
  }).post(
    "/api/zooks/upload",
    jwtMiddleware<RouterMiddleware<string>>({
      ...jwtMiddlewareOptions,
      onFailure: () => false,
    }),
    uploadZook,
  ).get(
    "/api/zooks/download/:id/:name",
    async (context) => {
      await downloadZook(context?.params?.id, context?.params?.name, context)
    },
  ).put(
    "/api/admin/zook/:id/owner/:username",
    jwtMiddleware<RouterMiddleware<string>>(jwtMiddlewareOptions),
    async (context) => {
      await adminSetOwner(
        context?.params?.id,
        context?.params?.username,
        context,
      )
    },
  ).get(
    "/api/admin/leagues/update",
    jwtMiddleware<RouterMiddleware<string>>(jwtMiddlewareOptions),
    async (context) => {
      const authUser = getAuthUser(context)
      if (!authUser) {
        context.response.status = Status.Unauthorized
        return
      }
      await updateLeagues()
      context.response.status = Status.OK
    },
  ).post(
    "/api/admin/zook/decode",
    jwtMiddleware<RouterMiddleware<string>>(jwtMiddlewareOptions),
    adminDecodeZook,
  ).get(
      "/api/autotrials/:zookid",
    jwtMiddleware<RouterMiddleware<string>>(jwtMiddlewareOptions),
    async (context) => {
        await getAutoTrialResults(context.params.zookid, context)
    },
  ).post(
      "/api/autotrials/:zookid",
    jwtMiddleware<RouterMiddleware<string>>(jwtMiddlewareOptions),
    async (context) => {
        await addAutoTrialResults(context.params.zookid, context)
    },
  )

router

export default router
