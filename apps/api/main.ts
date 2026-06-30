import { Application, send } from "oak"
import { oakCors } from "cors"
import router from "./routes.ts"
import _404 from "./controllers/404.ts"
import errorHandler from "./controllers/errorHandler.ts"

const app = new Application()

// Origin is env-driven so local dev can allow http://localhost:3000.
// Defaults to production so deployed behaviour is unchanged when unset.
const corsOrigin = Deno.env.get("CORS_ORIGIN") ?? "https://zooklabs.com"

app.use(errorHandler)
app.use(oakCors({ origin: corsOrigin, credentials: true }))

// Serve persisted images/files over HTTP in local dev (production uses GCS URLs directly).
if (Deno.env.get("USE_LOCAL_PERSISTENCE") === "true") {
  app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.startsWith("/static/")) {
      const filePath = ctx.request.url.pathname.slice("/static/".length)
      await send(ctx, filePath, { root: ".persistence" })
      return
    }
    await next()
  })
}

app.use(router.routes())
app.use(router.allowedMethods())
app.use(_404)

const port = parseInt(Deno.env.get("APP_PORT") || "8000")

console.log("[startup] config:")
// console.log(`  APP_PORT       = ${Deno.env.get("APP_PORT") ?? "(unset → 8000)"}`)
// console.log(`  CORS_ORIGIN    = ${corsOrigin}`)
// console.log(`  PGHOST         = ${Deno.env.get("PGHOST") ?? "(unset → localhost)"}`)
// console.log(`  PGPORT         = ${Deno.env.get("PGPORT") ?? "(unset → 5432)"}`)
// console.log(`  PGUSER         = ${Deno.env.get("PGUSER") ?? "(unset → Bernard)"}`)
// console.log(`  PGDATABASE     = ${Deno.env.get("PGDATABASE") ?? "(unset → zooklabs)"}`)
// console.log(`  PGPASSWORD     = ${Deno.env.get("PGPASSWORD") ? "***set***" : "(unset → Nosey)"}`)
// console.log(`  PGCA           = ${Deno.env.get("PGCA") ?? "(unset → no TLS)"}`)
// console.log(`  USE_LOCAL_PERSISTENCE = ${Deno.env.get("USE_LOCAL_PERSISTENCE") ?? "(unset)"}`)
console.log(`  RECALCULATE_LEAGUES_ON_UPLOAD = ${Deno.env.get("RECALCULATE_LEAGUES_ON_UPLOAD") ?? "(unset → enabled)"}`)
console.log(`Listening on port:${port}...`)

Deno.serve(
  { port },
  async (request, info) => {
    const res = await app.handle(request, info.remoteAddr)
    return res ?? Response.error()
  },
)
