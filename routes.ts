import { Router } from "oak"
import listZooks from "./controllers/listZooks.ts"
import getZook from "./controllers/getZook.ts"

const router = new Router()

router
  .get("/api/zooks", listZooks)
  .get(
    "/api/zooks/:id",
    async (context) => {
      await getZook(context?.params?.id, context)
    },
  )

export default router
