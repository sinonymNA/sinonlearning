import { randomUUID } from "crypto";
import { query } from "./db";

export type KoraLabWinner = "a" | "b" | "tie" | "both_bad";

export interface KoraLabCandidateConfig {
  model: string;
  thinking: boolean;
  maxTokens: number;
  label?: string;
  systemPromptOverride?: string;
}

export interface KoraLabPairRow {
  id: string;
  task_type: string;
  input_context: Record<string, unknown>;
  system_prompt_snapshot: string;
  candidate_a: unknown;
  candidate_a_config: KoraLabCandidateConfig;
  candidate_b: unknown;
  candidate_b_config: KoraLabCandidateConfig;
  winner: KoraLabWinner;
  reason: string | null;
  rated_by: string;
  created_at: string;
}

export interface KoraLabStatRow {
  task_type: string;
  winner: KoraLabWinner;
  count: number;
}

let schemaReady: Promise<void> | null = null;

export function ensureKoraLabSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(
      `CREATE TABLE IF NOT EXISTS kora_lab_pairs (
        id UUID PRIMARY KEY,
        task_type TEXT NOT NULL,
        input_context JSONB NOT NULL,
        system_prompt_snapshot TEXT NOT NULL,
        candidate_a JSONB NOT NULL,
        candidate_a_config JSONB NOT NULL,
        candidate_b JSONB NOT NULL,
        candidate_b_config JSONB NOT NULL,
        winner TEXT NOT NULL CHECK (winner IN ('a', 'b', 'tie', 'both_bad')),
        reason TEXT,
        rated_by TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    ).then(() => undefined);
  }
  return schemaReady;
}

const PAIR_COLUMNS =
  "id, task_type, input_context, system_prompt_snapshot, candidate_a, candidate_a_config, " +
  "candidate_b, candidate_b_config, winner, reason, rated_by, created_at";

export async function insertKoraLabPair(params: {
  taskType: string;
  inputContext: Record<string, unknown>;
  systemPromptSnapshot: string;
  candidateA: unknown;
  candidateAConfig: KoraLabCandidateConfig;
  candidateB: unknown;
  candidateBConfig: KoraLabCandidateConfig;
  winner: KoraLabWinner;
  reason?: string | null;
  ratedBy?: string;
}): Promise<KoraLabPairRow> {
  await ensureKoraLabSchema();
  const id = randomUUID();
  const { rows } = await query<KoraLabPairRow>(
    `INSERT INTO kora_lab_pairs
       (id, task_type, input_context, system_prompt_snapshot, candidate_a, candidate_a_config,
        candidate_b, candidate_b_config, winner, reason, rated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING ${PAIR_COLUMNS}`,
    [
      id,
      params.taskType,
      JSON.stringify(params.inputContext),
      params.systemPromptSnapshot,
      JSON.stringify(params.candidateA),
      JSON.stringify(params.candidateAConfig),
      JSON.stringify(params.candidateB),
      JSON.stringify(params.candidateBConfig),
      params.winner,
      params.reason ?? null,
      params.ratedBy ?? "admin",
    ]
  );
  return rows[0];
}

export async function listKoraLabPairs(params: {
  taskType?: string;
  limit?: number;
  offset?: number;
}): Promise<KoraLabPairRow[]> {
  await ensureKoraLabSchema();
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  if (params.taskType) {
    const { rows } = await query<KoraLabPairRow>(
      `SELECT ${PAIR_COLUMNS} FROM kora_lab_pairs WHERE task_type = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [params.taskType, limit, offset]
    );
    return rows;
  }
  const { rows } = await query<KoraLabPairRow>(
    `SELECT ${PAIR_COLUMNS} FROM kora_lab_pairs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export async function countKoraLabPairs(params: { taskType?: string }): Promise<number> {
  await ensureKoraLabSchema();
  if (params.taskType) {
    const { rows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM kora_lab_pairs WHERE task_type = $1`,
      [params.taskType]
    );
    return parseInt(rows[0]?.count ?? "0", 10);
  }
  const { rows } = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM kora_lab_pairs`);
  return parseInt(rows[0]?.count ?? "0", 10);
}

export async function getKoraLabStats(): Promise<KoraLabStatRow[]> {
  await ensureKoraLabSchema();
  const { rows } = await query<{ task_type: string; winner: KoraLabWinner; count: string }>(
    `SELECT task_type, winner, COUNT(*)::text AS count FROM kora_lab_pairs
     GROUP BY task_type, winner ORDER BY task_type, winner`
  );
  return rows.map((r) => ({ task_type: r.task_type, winner: r.winner, count: parseInt(r.count, 10) }));
}

export async function exportKoraLabPairs(params: { taskType?: string }): Promise<KoraLabPairRow[]> {
  await ensureKoraLabSchema();
  if (params.taskType) {
    const { rows } = await query<KoraLabPairRow>(
      `SELECT ${PAIR_COLUMNS} FROM kora_lab_pairs WHERE task_type = $1 ORDER BY created_at ASC`,
      [params.taskType]
    );
    return rows;
  }
  const { rows } = await query<KoraLabPairRow>(`SELECT ${PAIR_COLUMNS} FROM kora_lab_pairs ORDER BY created_at ASC`);
  return rows;
}
