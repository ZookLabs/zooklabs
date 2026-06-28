// In-memory Postgres for local development.
//
// Runs PGlite (embedded WASM Postgres) and exposes it on a TCP socket, so the API's
// normal Postgres client connects with ZERO code changes — and no Docker required.
// Data lives in memory only: every start is a fresh, empty database.
//
//   deno task dev:db      # run the DB on its own
//   (or imported by scripts/dev.ts as part of `deno task dev:all`)
import { PGlite } from "npm:@electric-sql/pglite"
import { PGLiteSocketServer } from "npm:@electric-sql/pglite-socket"

export async function startDevDb(
  port = Number(Deno.env.get("PGPORT") ?? 5432),
): Promise<{ db: PGlite; server: PGLiteSocketServer }> {
  const db = await PGlite.create()
  const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1" })
  await server.start()
  console.log(`[dev-db] in-memory PGlite listening on 127.0.0.1:${port}`)
  return { db, server }
}

if (import.meta.main) {
  await startDevDb()
  // Keep the process alive until killed (Ctrl-C / process termination).
  await new Promise<void>(() => {})
}
