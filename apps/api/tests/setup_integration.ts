import * as compose from "docker-compose"

async function runIntegrationTests() {
  console.log("🚀 Starting Integration Environment...")

  try {
    // 1. Start Docker
    await compose.upAll({
      cwd: Deno.cwd(),
      log: true,
      commandOptions: ["--wait"],
    })

    // 2. Run Deno Test specifically for the integration folder
    const migrationCommand = new Deno.Command(Deno.execPath(), {
      args: ["task", "migrate"],
      stdout: "inherit",
      stderr: "inherit",
    })

    await migrationCommand.output()

    // 2. Run Deno Test specifically for the integration folder
    const command = new Deno.Command(Deno.execPath(), {
      args: ["test", "-A", "tests/integration/"],
      // args: ["test", "-A", "tests/integration/repositories/usersRepo.test.ts"],
      stdout: "inherit",
      stderr: "inherit",
    })

    const { code } = await command.output()

    // 3. Cleanup
    console.log("🛑 Tearing down...")
    await compose.down({ cwd: Deno.cwd() })

    // Exit with the same code as the tests
    Deno.exit(code)
  } catch (err) {
    console.error("💥 Integration Setup Failed:", err)
    await compose.down({ cwd: Deno.cwd() })
    Deno.exit(1)
  }
}

runIntegrationTests()
