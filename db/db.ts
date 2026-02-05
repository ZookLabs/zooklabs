// Code from here: https://gist.github.com/omar2205/cd42feccf25cff845b50ec2397eba18f
import { PostgresDriver } from "../db/PgDriver.ts"

import {
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely"

import { DatabaseSchema } from "./schema.ts"
import { clientConfig } from "./databaseConfig.ts"

export class Db {
  static #instance: Kysely<DatabaseSchema>
  private constructor() {}

  public static getInstance(): Kysely<DatabaseSchema> {
    if (!Db.#instance) Db.#instance = Db.#initDb()

    return Db.#instance
  }

  static #initDb() {
    return new Kysely<DatabaseSchema>({
      dialect: {
        createAdapter() {
          return new PostgresAdapter()
        },
        createDriver() {
          return new PostgresDriver(clientConfig)
        },
        createIntrospector(db) {
          return new PostgresIntrospector(db)
        },
        createQueryCompiler() {
          return new PostgresQueryCompiler()
        },
      },
    })
  }
}

export default Db.getInstance()
