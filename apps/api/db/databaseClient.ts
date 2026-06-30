import { Client } from "postgres"
import { clientConfig } from "./databaseConfig.ts"

export class Database {
  client: Client
  constructor() {
    this.client = new Client(clientConfig)
  }

  async connect() {
    await this.client.connect()
  }
}
