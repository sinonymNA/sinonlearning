import { query } from "./db";

let schemaReady: Promise<void> | null = null;

export function ensureStockCourseSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(`
      CREATE TABLE IF NOT EXISTS stock_course_progress (
        user_id    UUID NOT NULL,
        unit_slug  TEXT NOT NULL,
        completed_at TIMESTAMPTZ,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, unit_slug)
      )
    `).then(() => undefined);
  }
  return schemaReady;
}

export interface UnitProgress {
  unit_slug: string;
  completed_at: string | null;
  updated_at: string;
}

export async function getAllUnitProgress(userId: string): Promise<UnitProgress[]> {
  await ensureStockCourseSchema();
  const { rows } = await query<UnitProgress>(
    `SELECT unit_slug, completed_at, updated_at
     FROM stock_course_progress
     WHERE user_id = $1
     ORDER BY updated_at ASC`,
    [userId]
  );
  return rows;
}

export async function markUnitComplete(userId: string, unitSlug: string): Promise<void> {
  await ensureStockCourseSchema();
  await query(
    `INSERT INTO stock_course_progress (user_id, unit_slug, completed_at, updated_at)
     VALUES ($1, $2, now(), now())
     ON CONFLICT (user_id, unit_slug) DO UPDATE
       SET completed_at = COALESCE(stock_course_progress.completed_at, now()),
           updated_at   = now()`,
    [userId, unitSlug]
  );
}
