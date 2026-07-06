import { randomUUID } from "crypto";
import { query } from "./db";
import { ensureMarginsSchema } from "./marginsDb";
import type { Beat, ReelStatus } from "./reelTypes";

export interface ReelProjectRow {
  id: string;
  teacher_id: string;
  title: string;
  beats: Beat[];
  status: ReelStatus;
  created_at: string;
  updated_at: string;
}

export interface ReelImageRow {
  id: string;
  uploaded_by: string;
  mime_type: string;
  data: Buffer;
  byte_size: number;
  source_url: string | null;
  attribution: string | null;
  created_at: string;
}

export interface ReelAudioRow {
  id: string;
  project_id: string;
  beat_id: string;
  mime_type: string;
  data: Buffer;
  byte_size: number;
  created_at: string;
}

export type ReelJobKind = "render" | "mux";
export type ReelJobStatus = "queued" | "rendering" | "done" | "failed";

export interface ReelJobRow {
  id: string;
  project_id: string;
  kind: ReelJobKind;
  status: ReelJobStatus;
  output: Buffer | null;
  output_mime: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

let schemaReady: Promise<void> | null = null;

export function ensureReelSchema(): Promise<void> {
  if (!schemaReady) {
    // margins_users must exist before the teacher_id FK — Reel could be created
    // on a cold DB (mirrors the dashJam.ts ordering caveat).
    schemaReady = ensureMarginsSchema()
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS reel_projects (
          id UUID PRIMARY KEY,
          teacher_id UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
          title TEXT NOT NULL DEFAULT 'Untitled video',
          beats JSONB NOT NULL DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS reel_images (
          id UUID PRIMARY KEY,
          uploaded_by UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
          mime_type TEXT NOT NULL,
          data BYTEA NOT NULL,
          byte_size INTEGER NOT NULL,
          source_url TEXT,
          attribution TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS reel_audio (
          id UUID PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES reel_projects(id) ON DELETE CASCADE,
          beat_id TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          data BYTEA NOT NULL,
          byte_size INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS reel_render_jobs (
          id UUID PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES reel_projects(id) ON DELETE CASCADE,
          kind TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'queued',
          output BYTEA,
          output_mime TEXT,
          error TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(
          `CREATE INDEX IF NOT EXISTS reel_render_jobs_queued_idx ON reel_render_jobs (created_at) WHERE status = 'queued'`
        )
      )
      .then(() => undefined);
  }
  return schemaReady;
}

// ── Projects ──

const PROJECT_COLUMNS = "id, teacher_id, title, beats, status, created_at, updated_at";

export async function createReelProject(params: {
  teacherId: string;
  title?: string;
  beats?: Beat[];
}): Promise<ReelProjectRow> {
  await ensureReelSchema();
  const id = randomUUID();
  const { rows } = await query<ReelProjectRow>(
    `INSERT INTO reel_projects (id, teacher_id, title, beats)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PROJECT_COLUMNS}`,
    [id, params.teacherId, params.title?.trim() || "Untitled video", JSON.stringify(params.beats ?? [])]
  );
  return rows[0];
}

export async function getReelProjectById(id: string): Promise<ReelProjectRow | undefined> {
  await ensureReelSchema();
  const { rows } = await query<ReelProjectRow>(
    `SELECT ${PROJECT_COLUMNS} FROM reel_projects WHERE id = $1`,
    [id]
  );
  return rows[0];
}

export async function getReelProjectsByTeacher(teacherId: string): Promise<ReelProjectRow[]> {
  await ensureReelSchema();
  const { rows } = await query<ReelProjectRow>(
    `SELECT ${PROJECT_COLUMNS} FROM reel_projects WHERE teacher_id = $1 ORDER BY updated_at DESC`,
    [teacherId]
  );
  return rows;
}

export async function updateReelProject(
  id: string,
  patch: { title?: string; beats?: Beat[]; status?: ReelStatus }
): Promise<ReelProjectRow | undefined> {
  await ensureReelSchema();
  const { rows } = await query<ReelProjectRow>(
    `UPDATE reel_projects SET
       title = COALESCE($2, title),
       beats = COALESCE($3, beats),
       status = COALESCE($4, status),
       updated_at = now()
     WHERE id = $1
     RETURNING ${PROJECT_COLUMNS}`,
    [id, patch.title?.trim() || null, patch.beats ? JSON.stringify(patch.beats) : null, patch.status ?? null]
  );
  return rows[0];
}

export async function deleteReelProject(id: string, teacherId: string): Promise<boolean> {
  await ensureReelSchema();
  const { rowCount } = await query(`DELETE FROM reel_projects WHERE id = $1 AND teacher_id = $2`, [
    id,
    teacherId,
  ]);
  return (rowCount ?? 0) > 0;
}

// ── Images (mirror slider_images) ──

export async function createReelImage(params: {
  uploadedBy: string;
  mimeType: string;
  data: Buffer;
  sourceUrl?: string | null;
  attribution?: string | null;
}): Promise<ReelImageRow> {
  await ensureReelSchema();
  const id = randomUUID();
  const { rows } = await query<ReelImageRow>(
    `INSERT INTO reel_images (id, uploaded_by, mime_type, data, byte_size, source_url, attribution)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, uploaded_by, mime_type, data, byte_size, source_url, attribution, created_at`,
    [
      id,
      params.uploadedBy,
      params.mimeType,
      params.data,
      params.data.length,
      params.sourceUrl ?? null,
      params.attribution ?? null,
    ]
  );
  return rows[0];
}

export async function getReelImage(id: string): Promise<ReelImageRow | undefined> {
  await ensureReelSchema();
  const { rows } = await query<ReelImageRow>(
    `SELECT id, uploaded_by, mime_type, data, byte_size, source_url, attribution, created_at
     FROM reel_images WHERE id = $1`,
    [id]
  );
  return rows[0];
}

// ── Audio (per-beat narration clips) ──

export async function createReelAudio(params: {
  projectId: string;
  beatId: string;
  mimeType: string;
  data: Buffer;
}): Promise<ReelAudioRow> {
  await ensureReelSchema();
  const id = randomUUID();
  const { rows } = await query<ReelAudioRow>(
    `INSERT INTO reel_audio (id, project_id, beat_id, mime_type, data, byte_size)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, project_id, beat_id, mime_type, data, byte_size, created_at`,
    [id, params.projectId, params.beatId, params.mimeType, params.data, params.data.length]
  );
  return rows[0];
}

export async function getReelAudio(id: string): Promise<ReelAudioRow | undefined> {
  await ensureReelSchema();
  const { rows } = await query<ReelAudioRow>(
    `SELECT id, project_id, beat_id, mime_type, data, byte_size, created_at FROM reel_audio WHERE id = $1`,
    [id]
  );
  return rows[0];
}

// ── Render jobs (Postgres-backed queue shared with the Python worker) ──

const JOB_COLUMNS = "id, project_id, kind, status, output, output_mime, error, created_at, updated_at";

export async function enqueueRenderJob(projectId: string, kind: ReelJobKind): Promise<ReelJobRow> {
  await ensureReelSchema();
  const id = randomUUID();
  const { rows } = await query<ReelJobRow>(
    `INSERT INTO reel_render_jobs (id, project_id, kind, status)
     VALUES ($1, $2, $3, 'queued')
     RETURNING ${JOB_COLUMNS}`,
    [id, projectId, kind]
  );
  return rows[0];
}

// Atomically claim the oldest queued job (used by the worker). SKIP LOCKED lets
// multiple workers coexist without double-claiming.
export async function claimNextJob(): Promise<ReelJobRow | undefined> {
  await ensureReelSchema();
  const { rows } = await query<ReelJobRow>(
    `UPDATE reel_render_jobs SET status = 'rendering', updated_at = now()
     WHERE id = (
       SELECT id FROM reel_render_jobs WHERE status = 'queued'
       ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED
     )
     RETURNING ${JOB_COLUMNS}`
  );
  return rows[0];
}

export async function completeJob(id: string, output: Buffer, outputMime: string): Promise<void> {
  await ensureReelSchema();
  await query(
    `UPDATE reel_render_jobs SET status = 'done', output = $2, output_mime = $3, error = NULL, updated_at = now()
     WHERE id = $1`,
    [id, output, outputMime]
  );
}

export async function failJob(id: string, error: string): Promise<void> {
  await ensureReelSchema();
  await query(
    `UPDATE reel_render_jobs SET status = 'failed', error = $2, updated_at = now() WHERE id = $1`,
    [id, error.slice(0, 2000)]
  );
}

export async function getJob(id: string): Promise<ReelJobRow | undefined> {
  await ensureReelSchema();
  const { rows } = await query<ReelJobRow>(`SELECT ${JOB_COLUMNS} FROM reel_render_jobs WHERE id = $1`, [id]);
  return rows[0];
}

// Latest job of a kind for a project — used by the status/video endpoints.
export async function getLatestJob(
  projectId: string,
  kind: ReelJobKind
): Promise<ReelJobRow | undefined> {
  await ensureReelSchema();
  const { rows } = await query<ReelJobRow>(
    `SELECT ${JOB_COLUMNS} FROM reel_render_jobs
     WHERE project_id = $1 AND kind = $2 ORDER BY created_at DESC LIMIT 1`,
    [projectId, kind]
  );
  return rows[0];
}

// An in-flight job for a project+kind, if any — used to de-dupe render requests
// so a teacher can't stack duplicate renders of the same output.
export async function getActiveJob(
  projectId: string,
  kind: ReelJobKind
): Promise<ReelJobRow | undefined> {
  await ensureReelSchema();
  const { rows } = await query<ReelJobRow>(
    `SELECT ${JOB_COLUMNS} FROM reel_render_jobs
     WHERE project_id = $1 AND kind = $2 AND status IN ('queued', 'rendering')
     ORDER BY created_at DESC LIMIT 1`,
    [projectId, kind]
  );
  return rows[0];
}

// Fail jobs stuck 'rendering' past the cutoff so a crashed worker never leaves
// the editor polling forever. Called opportunistically by the worker loop and
// by the status endpoint.
export async function reapStaleJobs(maxRenderingMs = 10 * 60 * 1000): Promise<number> {
  await ensureReelSchema();
  const cutoff = new Date(Date.now() - maxRenderingMs).toISOString();
  const { rowCount } = await query(
    `UPDATE reel_render_jobs
     SET status = 'failed', error = 'Render timed out.', updated_at = now()
     WHERE status = 'rendering' AND updated_at < $1`,
    [cutoff]
  );
  return rowCount ?? 0;
}
