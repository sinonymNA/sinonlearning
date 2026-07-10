import { query } from "./db";

// ── Schema ────────────────────────────────────────────────────────────────────

let schemaReady: Promise<void> | null = null;

export function ensureLifeBudgetSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(`
      CREATE TABLE IF NOT EXISTS life_budget_progress (
        user_id   UUID NOT NULL,
        module_slug TEXT NOT NULL,
        data      JSONB NOT NULL DEFAULT '{}',
        completed_at TIMESTAMPTZ,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, module_slug)
      )
    `).then(() => undefined);
  }
  return schemaReady;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ModuleProgress {
  module_slug: string;
  data: Record<string, unknown>;
  completed_at: string | null;
  updated_at: string;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getAllProgress(userId: string): Promise<ModuleProgress[]> {
  await ensureLifeBudgetSchema();
  const { rows } = await query<ModuleProgress>(
    `SELECT module_slug, data, completed_at, updated_at
     FROM life_budget_progress
     WHERE user_id = $1
     ORDER BY updated_at ASC`,
    [userId]
  );
  return rows;
}

export async function getModuleProgress(
  userId: string,
  moduleSlug: string
): Promise<ModuleProgress | null> {
  await ensureLifeBudgetSchema();
  const { rows } = await query<ModuleProgress>(
    `SELECT module_slug, data, completed_at, updated_at
     FROM life_budget_progress
     WHERE user_id = $1 AND module_slug = $2`,
    [userId, moduleSlug]
  );
  return rows[0] ?? null;
}

export async function saveModuleProgress(
  userId: string,
  moduleSlug: string,
  data: Record<string, unknown>,
  completed?: boolean
): Promise<void> {
  await ensureLifeBudgetSchema();
  await query(
    `INSERT INTO life_budget_progress (user_id, module_slug, data, completed_at, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (user_id, module_slug) DO UPDATE
       SET data         = $3,
           completed_at = COALESCE($4, life_budget_progress.completed_at),
           updated_at   = now()`,
    [userId, moduleSlug, JSON.stringify(data), completed ? new Date().toISOString() : null]
  );
}
