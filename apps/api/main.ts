import { Application, send } from "oak"
import { oakCors } from "cors"
import router from "./routes.ts"
import _404 from "./controllers/404.ts"
import errorHandler from "./controllers/errorHandler.ts"
import { logStartupDiagnostics, requestLogger } from "./logging.ts"

const app = new Application()

// Origin is env-driven so local dev can allow http://localhost:3000.
// Defaults to production so deployed behaviour is unchanged when unset.
const corsOrigin = Deno.env.get("CORS_ORIGIN") ?? "https://zooklabs.com"

// Request tracing is the outermost middleware so it always logs the final
// status/duration; the error handler sits just inside it and reports failures.
app.use(requestLogger)
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

logStartupDiagnostics()
console.log(`Listening on port:${port}...`)

Deno.serve(
  { port },
  async (request) => {
    try {
      const res = await app.handle(request)
      return res ?? Response.error()
    } catch (err) {
      // app.handle() can throw before the error handler runs (e.g. when the
      // request/connection info is malformed). Log it so it is not silent.
      console.error("[fatal] request handling failed:")
      if (err instanceof Error && err.stack) {
        console.error(err.stack)
      } else {
        console.error(err)
      }
      return new Response("Internal Server Error", { status: 500 })
    }
  },
)
