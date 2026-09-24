import { Context } from "oak"
import { logError } from "../logging.ts"

export default async (context: Context, next: () => Promise<unknown>) => {
  try {
    await next()
  } catch (err) {
    logError(context, err)
    context.response.status = 500
    context.response.body = {
      msg: err instanceof Error ? err.message : String(err),
    }
  }
}
