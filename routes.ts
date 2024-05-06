import { Router } from "oak"
import listZooks from "./controllers/listZooks.ts"
import getZook from "./controllers/getZook.ts"
import getLeagues from "./controllers/getLeagues.ts"

const router = new Router()

router
  .get("/api/zooks", listZooks)
  .get("/api/leagues", getLeagues)
  .get(
    "/api/zooks/:id",
    async (context) => {
      await getZook(context?.params?.id, context)
    },
  )

export default router
