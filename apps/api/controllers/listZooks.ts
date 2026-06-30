import { Context } from "oak"
import { listZooks } from "../services/zookService.ts"
import { ZookIdentifier } from "../types.ts"

export default async (context: Context) => {
  const zooks: ZookIdentifier[] = await listZooks()
  context.response.body = zooks
}
