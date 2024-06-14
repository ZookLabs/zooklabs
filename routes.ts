import { Router } from "oak"
import listZooks from "./controllers/listZooks.ts"
import getZook from "./controllers/getZook.ts"
import getLeagues from "./controllers/getLeagues.ts"
import getLeague from "./controllers/getLeague.ts"

const router = new Router()

router
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
    },
)

export default router
