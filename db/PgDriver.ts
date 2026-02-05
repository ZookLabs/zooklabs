// Code from here: https://gist.github.com/omar2205/cd42feccf25cff845b50ec2397eba18f
import { Client, ClientOptions } from "postgres";
import {
  CompiledQuery,
  DatabaseConnection,
  Driver,
  QueryResult,
  TransactionSettings,
} from "kysely";

type QueryArguments = unknown[] | Record<string, unknown>;

export class PostgresDriver implements Driver {
  readonly #connectionMutex = new ConnectionMutex();

  #client?: Client;
  #connection?: DatabaseConnection;

  db_client_options: ClientOptions;

  constructor(client_options: ClientOptions) {
    this.db_client_options = client_options;
  }

  init(): Promise<void> {
    this.#client = new Client(this.db_client_options);
    this.#connection = new PgConnection(this.#client);
    return Promise.resolve();
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    await this.#connectionMutex.lock();
    return this.#connection!;
  }

  async beginTransaction(
    connection: DatabaseConnection,
    _settings: TransactionSettings,
  ): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("begin"));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("commit"));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("rollback"));
  }

  releaseConnection(): Promise<void> {
    this.#connectionMutex.unlock();
    return Promise.resolve();
  }

  destroy(): Promise<void> {
    this.#client?.end();
    return Promise.resolve();
  }
}

class PgConnection implements DatabaseConnection {
  readonly #db: Client;

  // one-time module-level flag to avoid spamming the log
  private _streamQueryWarningShown = false;

  constructor(c: Client) {
    this.#db = c;
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const { sql, parameters } = compiledQuery;

    const { rows } = await this.#db.queryObject(
      sql,
      parameters as QueryArguments,
    );

    return Promise.resolve({
      rows: rows as [],
    });
  }

  /**
   * @deprecated This is NOT true streaming. Use pagination or server-side cursors instead.
   * @remarks
   * This is a compatibility shim: the underlying client buffers the entire
   * result set and this method yields a single chunk. Do not use for large queries.
   */
  async *streamQuery<R>(
    compiledQuery: CompiledQuery,
    _chunkSize?: number,
  ): AsyncIterableIterator<QueryResult<R>> {
    if (!this._streamQueryWarningShown) {
      console.warn(
        "PgConnection.streamQuery() is a compatibility shim: it buffers the entire result set and yields a single chunk. Avoid for large queries.",
      );
      this._streamQueryWarningShown = true;
    }

    const result = await this.executeQuery<R>(compiledQuery);
    yield result;
  }
}

class ConnectionMutex {
  #promise?: Promise<void>;
  #resolve?: () => void;

  async lock(): Promise<void> {
    while (this.#promise) {
      await this.#promise;
    }

    this.#promise = new Promise((resolve) => {
      this.#resolve = resolve;
    });
  }

  unlock(): void {
    const resolve = this.#resolve;

    this.#promise = undefined;
    this.#resolve = undefined;

    resolve?.();
  }
}
