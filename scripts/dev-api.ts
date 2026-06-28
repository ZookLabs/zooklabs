// Backend only — in-memory DB + migrations + API, with the API's own logs shown
// directly (unprefixed). Run this in one terminal and `deno task dev:web` in another.
//
//   deno task dev:api    → http://localhost:8080
//
// The in-memory database runs inside this process, so it survives the API's --watch
// reloads (your data persists while you edit API code). Ctrl-C stops both.
import { startDevDb } from "./dev-db.ts"

await startDevDb()

const devEnv = {
  ...Deno.env.toObject(),
  PGHOST: Deno.env.get("PGHOST") ?? "127.0.0.1",
  PGPORT: Deno.env.get("PGPORT") ?? "5432",
  PGUSER: Deno.env.get("PGUSER") ?? "Bernard",
  PGPASSWORD: Deno.env.get("PGPASSWORD") ?? "Nosey",
  PGDATABASE: Deno.env.get("PGDATABASE") ?? "zooklabs",
}

console.log("[dev-api] applying migrations…")
const migrate = await new Deno.Command("deno", {
  args: ["task", "migrate"],
  env: devEnv,
  stdout: "inherit",
  stderr: "inherit",
}).output()
if (!migrate.success) {
  console.error("[dev-api] migrations failed — aborting.")
  Deno.exit(1)
}

console.log("[dev-api] starting API on http://localhost:8080 …\n")
const api = new Deno.Command("deno", {
  args: ["task", "dev"],
  stdout: "inherit",
  stderr: "inherit",
}).spawn()

Deno.addSignalListener("SIGINT", () => {
  try {
    api.kill("SIGTERM")
  } catch { /* already exited */ }
  Deno.exit(0)
})

Deno.exit((await api.status).code)
