import { Client } from "postgres"
class Database {
  client: Client
  constructor() {
    const caCertificate = Deno.env.get("PGCA")

    this.client = new Client({
      user: Deno.env.get("PGUSER") ?? "Bernard",
      database: Deno.env.get("PGDATABASE") ?? "zooklabs",
      hostname: Deno.env.get("PGHOST") ?? "localhost",
      port: Deno.env.get("PGPORT") ?? "5432",
      password: Deno.env.get("PGPASSWORD") ?? "Nosey",
      tls: caCertificate
        ? {
          enforce: true,
          caCertificates: [caCertificate],
          enabled: true,
        }
        : undefined,
    })
  }

  async connect() {
    await this.client.connect()
  }
}

const db = new Database()

await db.connect()

export default db.client
