import { Context } from "oak"

export default (context: Context) => {
  context.response.status = 404
  context.response.body = { msg: "Not Found" }
}
