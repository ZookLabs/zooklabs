import { Context } from "oak"

export default async (context: Context, next: () => Promise<unknown>) => {
  try {
    await next()
  } catch (err) {
    context.response.status = 500
    context.response.body = {
      msg: err instanceof Error ? err.message : String(err),
    }
  }
}
