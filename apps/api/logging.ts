import { Context } from "oak"

let requestCounter = 0

function nextRequestId(): number {
  return ++requestCounter
}

function safeUrl(context: Context): string {
  try {
    return context.request.url.pathname + context.request.url.search
  } catch {
    return "[malformed url]"
  }
}

function safeFullUrl(context: Context): string {
  try {
    return context.request.url.toString()
  } catch {
    return "[malformed url]"
  }
}

/**
 * Per-request tracing. Registers a monotonic request id on the context and logs
 * the method, path, final status and duration once the request completes
 * (whether it succeeds or throws).
 *
 * Intended to be registered as the outermost middleware so it always sees the
 * final status set by downstream middleware/error handlers.
 */
export async function requestLogger(
  context: Context,
  next: () => Promise<unknown>,
): Promise<void> {
  const id = nextRequestId()
  const started = performance.now()
  const method = context.request.method
  const url = safeUrl(context)
  const userAgent = context.request.headers.get("user-agent") ?? "-"

  context.state.requestId = id
  context.state.startedAt = started

  try {
    await next()
  } finally {
    const ms = Math.round(performance.now() - started)
    console.log(
      `[http] #${id} ${method} ${url} -> ${context.response.status} (${ms}ms) ua="${userAgent}"`,
    )
  }
}

/**
 * Logs a caught error with as much request context as possible. Used by the
 * error handler so failures are no longer silently swallowed.
 */
export function logError(context: Context, err: unknown): void {
  const id: number | undefined = context.state.requestId
  const idLabel = id === undefined ? "" : `#${id} `
  const method = context.request.method
  const url = safeFullUrl(context)
  const error = err instanceof Error ? err : new Error(String(err))

  console.error(`[error] ${idLabel}${method} ${url}`)
  if (error.stack) {
    console.error(error.stack)
  } else {
    console.error(`[error] ${String(err)}`)
  }
}

const REQUIRED_ENV_VARS = [
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

/**
 * Logs the presence (never the values) of the env vars the API depends on so a
 * missing/rotated variable is visible immediately in the deploy logs.
 */
export function logStartupDiagnostics(): void {
  console.log("[startup] environment diagnostics:")
  for (const key of REQUIRED_ENV_VARS) {
    const present = Deno.env.get(key) !== undefined
    console.log(`  ${present ? "set   " : "MISSING"} ${key}`)
  }
  console.log(
    `[startup] CORS_ORIGIN = ${Deno.env.get("CORS_ORIGIN") ?? "(unset)"}`,
  )
  console.log(
    `[startup] APP_PORT = ${Deno.env.get("APP_PORT") ?? "(unset → 8000)"}`,
  )
  console.log(
    `[startup] USE_LOCAL_PERSISTENCE = ${
      Deno.env.get("USE_LOCAL_PERSISTENCE") ?? "(unset)"
    }`,
  )
  console.log(
    `[startup] RECALCULATE_LEAGUES_ON_UPLOAD = ${
      Deno.env.get("RECALCULATE_LEAGUES_ON_UPLOAD") ?? "(unset → enabled)"
    }`,
  )
  console.log(`[startup] Deno ${Deno.version.deno}`)
}
