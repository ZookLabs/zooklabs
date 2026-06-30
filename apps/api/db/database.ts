import { Database } from "./databaseClient.ts"

const db = new Database()

await db.connect()

export default db.client
