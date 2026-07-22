import { randomBytes } from "crypto";
import { query } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SourceRoomSession {
  code: string;
  host_token: string;
  teacher_id: string | null;
  source_text: string | null;
  source_image_url: string | null;
  source_label: string;
  source_citation: string | null;
  questions: SourceRoomQuestion[];
  timer_seconds: number;
  status: "waiting" | "active" | "ended";
  started_at: string | null;
  created_at: string;
}

export interface SourceRoomQuestion {
  id: string;
  prompt: string;
}

export interface SourceRoomResponse {
  id: string;
  session_code: string;
  student_name: string;
  student_token: string;
  question_id: string;
  response_text: string;
  submitted_at: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS source_room_sessions (
          code              TEXT PRIMARY KEY,
          host_token        TEXT NOT NULL,
          teacher_id        UUID REFERENCES margins_users(id),
          source_text       TEXT,
          source_image_url  TEXT,
          source_label      TEXT NOT NULL DEFAULT 'Historical Source',
          source_citation   TEXT,
          questions         JSONB NOT NULL DEFAULT '[]',
          timer_seconds     INTEGER NOT NULL DEFAULT 180,
          status            TEXT NOT NULL DEFAULT 'waiting',
          started_at        TIMESTAMPTZ,
          created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS source_room_responses (
          id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_code  TEXT NOT NULL REFERENCES source_room_sessions(code) ON DELETE CASCADE,
          student_name  TEXT NOT NULL,
          student_token TEXT NOT NULL,
          question_id   TEXT NOT NULL,
          response_text TEXT NOT NULL DEFAULT '',
          submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(session_code, student_token, question_id)
        );
      `);
    })();
  }
  return schemaReady;
}

// ─── Code generation ──────────────────────────────────────────────────────────

const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const bytes = randomBytes(6);
  return Array.from(bytes)
    .map((b) => CODE_CHARSET[b % CODE_CHARSET.length])
    .join("");
}

// ─── Session functions ────────────────────────────────────────────────────────

export async function createSession(opts: {
  sourceText?: string;
  sourceImageUrl?: string;
  sourceLabel?: string;
  sourceCitation?: string;
  questions: SourceRoomQuestion[];
  timerSeconds: number;
  teacherId?: string;
}): Promise<{ code: string; hostToken: string }> {
  await ensureSchema();

  const code = generateCode();
  const hostToken = randomBytes(24).toString("hex");

  await query(
    `INSERT INTO source_room_sessions
       (code, host_token, teacher_id, source_text, source_image_url, source_label, source_citation, questions, timer_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      code,
      hostToken,
      opts.teacherId ?? null,
      opts.sourceText ?? null,
      opts.sourceImageUrl ?? null,
      opts.sourceLabel ?? "Historical Source",
      opts.sourceCitation ?? null,
      JSON.stringify(opts.questions),
      opts.timerSeconds,
    ],
  );

  return { code, hostToken };
}

export async function getSession(code: string): Promise<SourceRoomSession | null> {
  await ensureSchema();
  const result = await query<SourceRoomSession>(
    `SELECT * FROM source_room_sessions WHERE code = $1`,
    [code.toUpperCase()],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { ...row, questions: row.questions as unknown as SourceRoomQuestion[] };
}

export async function startSession(code: string, hostToken: string): Promise<boolean> {
  await ensureSchema();
  const result = await query<{ code: string }>(
    `UPDATE source_room_sessions
     SET status = 'active', started_at = now()
     WHERE code = $1 AND host_token = $2
     RETURNING code`,
    [code.toUpperCase(), hostToken],
  );
  return result.rows.length > 0;
}

export async function endSession(code: string, hostToken: string): Promise<boolean> {
  await ensureSchema();
  const result = await query<{ code: string }>(
    `UPDATE source_room_sessions
     SET status = 'ended'
     WHERE code = $1 AND host_token = $2
     RETURNING code`,
    [code.toUpperCase(), hostToken],
  );
  return result.rows.length > 0;
}

export async function upsertResponse(
  code: string,
  studentToken: string,
  studentName: string,
  questionId: string,
  responseText: string,
): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO source_room_responses
       (session_code, student_name, student_token, question_id, response_text, submitted_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (session_code, student_token, question_id)
     DO UPDATE SET response_text = EXCLUDED.response_text, submitted_at = now()`,
    [code.toUpperCase(), studentName, studentToken, questionId, responseText],
  );
}

export async function getResponses(code: string): Promise<SourceRoomResponse[]> {
  await ensureSchema();
  const result = await query<SourceRoomResponse>(
    `SELECT * FROM source_room_responses WHERE session_code = $1 ORDER BY student_name, question_id`,
    [code.toUpperCase()],
  );
  return result.rows;
}

export async function getStudentResponses(
  code: string,
  studentToken: string,
): Promise<SourceRoomResponse[]> {
  await ensureSchema();
  const result = await query<SourceRoomResponse>(
    `SELECT * FROM source_room_responses WHERE session_code = $1 AND student_token = $2`,
    [code.toUpperCase(), studentToken],
  );
  return result.rows;
}

export async function getResponseStudentCount(code: string): Promise<number> {
  await ensureSchema();
  const result = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT student_token) AS count FROM source_room_responses WHERE session_code = $1`,
    [code.toUpperCase()],
  );
  return parseInt(result.rows[0]?.count ?? "0", 10);
}
