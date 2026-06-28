// Web (UI) only — the CRA dev server. Run alongside `deno task dev:api`.
//
//   deno task dev:web    → http://localhost:3000
//
// Installs dependencies on first run. Ctrl-C stops it.
const isWin = Deno.build.os === "windows"

// `yarn` is a .cmd shim on Windows, which CreateProcess can't launch directly.
function yarn(args: string[]): Deno.Command {
  const env = { ...Deno.env.toObject(), BROWSER: "none" }
  return isWin
    ? new Deno.Command("cmd", {
      args: ["/c", "yarn", ...args],
      cwd: "apps/web",
      env,
      stdout: "inherit",
      stderr: "inherit",
    })
    : new Deno.Command("yarn", {
      args,
      cwd: "apps/web",
      env,
      stdout: "inherit",
      stderr: "inherit",
    })
}

const hasNodeModules = await Deno.stat("apps/web/node_modules")
  .then(() => true)
  .catch(() => false)
if (!hasNodeModules) {
  console.log("[dev-web] installing dependencies (first run, one-off)…")
  if (!(await yarn(["install"]).output()).success) {
    console.error("[dev-web] yarn install failed.")
    Deno.exit(1)
  }
}

const child = yarn(["start"]).spawn()

Deno.addSignalListener("SIGINT", () => {
  try {
    child.kill("SIGTERM")
  } catch { /* already exited */ }
  Deno.exit(0)
})

Deno.exit((await child.status).code)
