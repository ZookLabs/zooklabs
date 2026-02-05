type DatabaseConfig = {
  database: string
  hostname: string
  user: string
  password: string
  port: number
  caCertificate: string | undefined
}

const databaseConfig: DatabaseConfig = {
  database: Deno.env.get("PGDATABASE") || "zooklabs",
  hostname: Deno.env.get("PGHOST") || "localhost",
  user: Deno.env.get("PGUSER") || "Bernard",
  password: Deno.env.get("PGPASSWORD") || "Nosey",
  port: Number(Deno.env.get("PGPORT") || 5432),
  caCertificate: Deno.env.get("PGCA"),
}

export const clientConfig = {
  database: databaseConfig.database,
  hostname: databaseConfig.hostname,
  user: databaseConfig.user,
  password: databaseConfig.password,
  port: databaseConfig.port,
  tls: databaseConfig.caCertificate
    ? {
      enforce: true,
      caCertificates: [databaseConfig.caCertificate],
      enabled: true,
    }
    : undefined,
}
