// One-command local dev environment — in-memory DB + migrations + API + web, together.
//
//   deno task dev:all
//
//   - DB:  in-memory PGlite on 127.0.0.1:5432  (no Docker; fresh every run)
//   - API: `deno task dev`     → http://localhost:8080
//   - Web: `yarn start` (CRA)  → http://localhost:3000
//
// Ctrl-C stops everything. The in-memory database lives only for the session.
import { startDevDb } from "./dev-db.ts"

const isWin = Deno.build.os === "windows"
const enc = new TextEncoder()
const children: Deno.ChildProcess[] = []

function pipe(label: string, stream: ReadableStream<Uint8Array>) {
  ;(async () => {
    for await (const chunk of stream.pipeThrough(new TextDecoderStream())) {
      for (const line of chunk.replace(/\r/g, "").split("\n")) {
        if (line.length) {
          await Deno.stdout.write(enc.encode(`[${label}] ${line}\n`))
        }
      }
    }
  })()
}

function spawn(
  label: string,
  cmd: string,
  args: string[],
  opts: Omit<Deno.CommandOptions, "stdout" | "stderr"> = {},
): Deno.ChildProcess {
  const child = new Deno.Command(cmd, {
    args,
    stdout: "piped",
    stderr: "piped",
    ...opts,
  }).spawn()
  pipe(label, child.stdout)
  pipe(label, child.stderr)
  children.push(child)
  return child
}

// On Windows `yarn` is a .cmd shim, which CreateProcess can't launch directly.
function yarn(
  label: string,
  args: string[],
  opts: Omit<Deno.CommandOptions, "stdout" | "stderr"> = {},
): Deno.ChildProcess {
  return isWin
    ? spawn(label, "cmd", ["/c", "yarn", ...args], opts)
    : spawn(label, "yarn", args, opts)
}

function shutdown() {
  for (const c of children) {
    try {
      c.kill("SIGTERM")
    } catch { /* already exited */ }
  }
}
Deno.addSignalListener("SIGINT", () => {
  console.log("\n[dev] shutting down…")
  shutdown()
  Deno.exit(0)
})

// 1) In-memory database (runs inside this process).
console.log("[dev] starting in-memory PGlite…")
await startDevDb()

// 2) Migrations.
console.log("[dev] applying migrations…")
const migrate = new Deno.Command("deno", {
  args: ["task", "migrate"],
  cwd: "apps/api",
  env: { PGHOST: "127.0.0.1" },
  stdout: "inherit",
  stderr: "inherit",
}).spawn()
if (!(await migrate.status).success) {
  console.error("[dev] migrations failed — aborting.")
  Deno.exit(1)
}

// 3) API — reads .env.development (port 8080, CORS http://localhost:3000, PGHOST 127.0.0.1).
spawn("api", "deno", ["task", "dev"], { cwd: "apps/api" })

// 4) Web — CRA dev server on :3000. Install deps on first run.
const hasNodeModules = await Deno.stat("apps/web/node_modules")
  .then(() => true)
  .catch(() => false)
if (!hasNodeModules) {
  console.log("[dev] installing web dependencies (first run, one-off)…")
  const install = yarn("web", ["install"], { cwd: "apps/web" })
  if (!(await install.status).success) {
    console.error("[dev] yarn install failed — the web app won't start.")
  }
}
yarn("web", ["start"], {
  cwd: "apps/web",
  env: { ...Deno.env.toObject(), BROWSER: "none" },
})

console.log(
  "\n[dev] ▶ API http://localhost:8080   ▶ Web http://localhost:3000   (Ctrl-C to stop)\n",
)

// Keep the orchestrator alive until Ctrl-C.
await new Promise<void>(() => {})
