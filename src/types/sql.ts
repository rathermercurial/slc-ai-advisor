/**
 * SqlStorage interface matching Cloudflare's DurableObject.storage.sql
 *
 * This interface is duplicated from cloudflare:workers to allow
 * model managers in src/ to be compiled without the Workers runtime.
 *
 * IMPORTANT: .one() throws if no rows exist - use .toArray()[0] for optional reads!
 */
export interface SqlStorage {
  exec<T extends Record<string, unknown>>(
    query: string,
    ...bindings: unknown[]
  ): SqlStorageCursor<T>;
}

export interface SqlStorageCursor<T> {
  /** Returns first row. THROWS if no rows exist! */
  one(): T;
  /** Returns all rows as array. Safe for empty results. */
  toArray(): T[];
}
