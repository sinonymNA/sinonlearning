import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export function query<T extends QueryResultRow>(text: string, params?: unknown[]) {
  return getPool().query<T>(text, params);
}

export { getPool };

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(
      `CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        kind TEXT NOT NULL,
        file_id TEXT NOT NULL,
        course_slug TEXT NOT NULL DEFAULT '',
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    )
      .then(() =>
        query(`ALTER TABLE materials ADD COLUMN IF NOT EXISTS course_slug TEXT NOT NULL DEFAULT ''`)
      )
      .then(() =>
        query(`ALTER TABLE materials ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS email_subscribers (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          source TEXT NOT NULL DEFAULT 'site_popup',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() => undefined);
  }
  return schemaReady;
}
