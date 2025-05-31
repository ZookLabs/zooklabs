import { Application } from "oak"
import { oakCors } from "cors"
import router from "./routes.ts"
import _404 from "./controllers/404.ts"
import errorHandler from "./controllers/errorHandler.ts"
import { updateLeagues } from "./services/leagueService.ts"

const app = new Application()

app.use(errorHandler)
app.use(oakCors({ origin: "https://zooklabs.com", credentials: true }))
app.use(router.routes())
app.use(router.allowedMethods())
app.use(_404)

const port = parseInt(Deno.env.get("APP_PORT") || "8000")

console.log(`Listening on port:${port}...`)

const server = app.listen({ port })

const updateLeaguesCron = Deno.cron("Update Leagues Cron", "0 * * * *", async () => {
    console.log("Updating leagues...");
    await updateLeagues();
    console.log("Leagues updated.");
});

await Promise.all([
    server,
    updateLeaguesCron,
]);