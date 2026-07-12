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
        data         JSONB NOT NULL DEFAULT '{}',
        PRIMARY KEY (user_id, unit_slug)
      )
    `)
    .then(() => query(`
      ALTER TABLE stock_course_progress
        ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'
    `))
    .then(() => undefined);
  }
  return schemaReady;
}

export interface UnitProgress {
  unit_slug: string;
  completed_at: string | null;
  updated_at: string;
  data: { bestScore?: number; attempts?: number };
}

export async function getAllUnitProgress(userId: string): Promise<UnitProgress[]> {
  await ensureStockCourseSchema();
  const { rows } = await query<UnitProgress>(
    `SELECT unit_slug, completed_at, updated_at, data
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
    `INSERT INTO stock_course_progress (user_id, unit_slug, completed_at, updated_at, data)
     VALUES ($1, $2, now(), now(), '{}')
     ON CONFLICT (user_id, unit_slug) DO UPDATE
       SET completed_at = COALESCE(stock_course_progress.completed_at, now()),
           updated_at   = now()`,
    [userId, unitSlug]
  );
}

export async function saveQuizScore(userId: string, unitSlug: string, score: number): Promise<void> {
  await ensureStockCourseSchema();
  await query(
    `INSERT INTO stock_course_progress (user_id, unit_slug, updated_at, data)
     VALUES ($1, $2, now(), jsonb_build_object('bestScore', $3, 'attempts', 1))
     ON CONFLICT (user_id, unit_slug) DO UPDATE
       SET updated_at = now(),
           data = jsonb_set(
             jsonb_set(
               stock_course_progress.data,
               '{bestScore}',
               to_jsonb(GREATEST(
                 COALESCE((stock_course_progress.data->>'bestScore')::int, 0),
                 $3::int
               ))
             ),
             '{attempts}',
             to_jsonb(COALESCE((stock_course_progress.data->>'attempts')::int, 0) + 1)
           )`,
    [userId, unitSlug, score]
  );
}
