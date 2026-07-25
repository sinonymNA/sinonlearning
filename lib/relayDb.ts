import { randomBytes } from "crypto";
import { query, getPool } from "./db";
import { planTeams, RELAY_CRESTS, RELAY_ROUNDS, type RelayEssayScore } from "./relayGame";

// Relay — live multiplayer essay-relay room.
//
// Shape follows lib/sourceRoomDb.ts (6-char code, host token in the teacher's
// localStorage, per-student token, lazy schema singleton) so the three live
// classroom activities in this app stay operationally identical.
//
// The one structural difference: Relay has to track *who is holding whose
// essay* on a given round. Rather than storing that per round, seats are fixed
// at team-formation time and the holder is derived from
// relayGame.essaySeatForRound — one source of truth, no drift between what the
// server thinks and what the student's screen shows.

// ─── Types ────────────────────────────────────────────────────────────────────

export type RelayStatus = "lobby" | "writing" | "grading" | "results";

export interface RelaySession {
  code: string;
  host_token: string;
  teacher_id: string | null;
  prompt: string;
  essay_type: string;
  round_seconds: number;
  status: RelayStatus;
  current_round: number;
  round_started_at: string | null;
  created_at: string;
}

export interface RelayTeam {
  id: string;
  session_code: string;
  crest_id: string;
  team_index: number;
}

export interface RelayPlayer {
  id: string;
  session_code: string;
  team_id: string | null;
  seat_index: number | null;
  display_name: string;
  student_token: string;
  joined_at: string;
}

export interface RelayEntry {
  id: string;
  session_code: string;
  /** Owner seat's player id — the essay's identity. */
  essay_owner_id: string;
  round: number;
  author_id: string;
  text: string;
  updated_at: string;
}

export interface RelayScore {
  essay_owner_id: string;
  session_code: string;
  score: RelayEssayScore;
  scored_at: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS relay_sessions (
          code             TEXT PRIMARY KEY,
          host_token       TEXT NOT NULL,
          teacher_id       UUID REFERENCES margins_users(id),
          prompt           TEXT NOT NULL,
          essay_type       TEXT NOT NULL DEFAULT 'LEQ',
          round_seconds    INTEGER NOT NULL DEFAULT 150,
          status           TEXT NOT NULL DEFAULT 'lobby',
          current_round    INTEGER NOT NULL DEFAULT 0,
          round_started_at TIMESTAMPTZ,
          created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS relay_teams (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_code TEXT NOT NULL REFERENCES relay_sessions(code) ON DELETE CASCADE,
          crest_id     TEXT NOT NULL,
          team_index   INTEGER NOT NULL,
          UNIQUE(session_code, team_index)
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS relay_players (
          id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_code  TEXT NOT NULL REFERENCES relay_sessions(code) ON DELETE CASCADE,
          team_id       UUID REFERENCES relay_teams(id) ON DELETE SET NULL,
          seat_index    INTEGER,
          display_name  TEXT NOT NULL,
          student_token TEXT NOT NULL,
          joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(session_code, student_token)
        );
      `);

      // One row per (essay, round). The essay is identified by its owner, and
      // the author is whoever was holding it that round — so the full chain of
      // custody is recoverable for the results screen.
      await query(`
        CREATE TABLE IF NOT EXISTS relay_entries (
          id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_code   TEXT NOT NULL REFERENCES relay_sessions(code) ON DELETE CASCADE,
          essay_owner_id UUID NOT NULL REFERENCES relay_players(id) ON DELETE CASCADE,
          round          INTEGER NOT NULL,
          author_id      UUID NOT NULL REFERENCES relay_players(id) ON DELETE CASCADE,
          text           TEXT NOT NULL DEFAULT '',
          updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(essay_owner_id, round)
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS relay_scores (
          essay_owner_id UUID PRIMARY KEY REFERENCES relay_players(id) ON DELETE CASCADE,
          session_code   TEXT NOT NULL REFERENCES relay_sessions(code) ON DELETE CASCADE,
          score          JSONB NOT NULL,
          scored_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
    })();
  }
  return schemaReady;
}

// ─── Codes and tokens ─────────────────────────────────────────────────────────

const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const bytes = randomBytes(6);
  return Array.from(bytes)
    .map((b) => CODE_CHARSET[b % CODE_CHARSET.length])
    .join("");
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(opts: {
  prompt: string;
  essayType: string;
  roundSeconds: number;
  teacherId?: string | null;
}): Promise<{ code: string; hostToken: string }> {
  await ensureSchema();
  const hostToken = randomBytes(24).toString("hex");

  // Retry on the (vanishingly unlikely) code collision rather than 500ing.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { rows } = await query<{ code: string }>(
      `INSERT INTO relay_sessions (code, host_token, teacher_id, prompt, essay_type, round_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (code) DO NOTHING
       RETURNING code`,
      [code, hostToken, opts.teacherId ?? null, opts.prompt, opts.essayType, opts.roundSeconds]
    );
    if (rows.length > 0) return { code: rows[0].code, hostToken };
  }
  throw new Error("Could not allocate a unique room code.");
}

export async function getSession(code: string): Promise<RelaySession | null> {
  await ensureSchema();
  const { rows } = await query<RelaySession>(`SELECT * FROM relay_sessions WHERE code = $1`, [code]);
  return rows[0] ?? null;
}

async function assertHost(code: string, hostToken: string): Promise<RelaySession | null> {
  const session = await getSession(code);
  if (!session || session.host_token !== hostToken) return null;
  return session;
}

// ─── Joining ──────────────────────────────────────────────────────────────────

export async function joinSession(
  code: string,
  displayName: string,
  studentToken: string
): Promise<RelayPlayer | null> {
  await ensureSchema();
  const session = await getSession(code);
  if (!session) return null;
  // Late joiners can't be slotted into a relay already in flight — the seat
  // rotation is fixed at start. They get the roster view instead.
  if (session.status !== "lobby") return null;

  const { rows } = await query<RelayPlayer>(
    `INSERT INTO relay_players (session_code, display_name, student_token)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_code, student_token)
     DO UPDATE SET display_name = EXCLUDED.display_name
     RETURNING *`,
    [code, displayName.slice(0, 40), studentToken]
  );
  return rows[0] ?? null;
}

export async function getPlayers(code: string): Promise<RelayPlayer[]> {
  await ensureSchema();
  const { rows } = await query<RelayPlayer>(
    `SELECT * FROM relay_players WHERE session_code = $1 ORDER BY joined_at ASC`,
    [code]
  );
  return rows;
}

export async function getTeams(code: string): Promise<RelayTeam[]> {
  await ensureSchema();
  const { rows } = await query<RelayTeam>(
    `SELECT * FROM relay_teams WHERE session_code = $1 ORDER BY team_index ASC`,
    [code]
  );
  return rows;
}

// ─── Starting: form random teams, then open round 1 ───────────────────────────

export async function startSession(code: string, hostToken: string): Promise<boolean> {
  await ensureSchema();
  const session = await assertHost(code, hostToken);
  if (!session || session.status !== "lobby") return false;

  const players = await getPlayers(code);
  if (players.length < 2) return false;

  // Fisher-Yates on a copy — the whole point is that groups are random, so this
  // must not depend on join order.
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const sizes = planTeams(shuffled.length);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    let cursor = 0;
    for (let t = 0; t < sizes.length; t++) {
      const crest = RELAY_CRESTS[t % RELAY_CRESTS.length];
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO relay_teams (session_code, crest_id, team_index)
         VALUES ($1, $2, $3) RETURNING id`,
        [code, crest.id, t]
      );
      const teamId = rows[0].id;
      for (let seat = 0; seat < sizes[t]; seat++) {
        await client.query(
          `UPDATE relay_players SET team_id = $1, seat_index = $2 WHERE id = $3`,
          [teamId, seat, shuffled[cursor].id]
        );
        cursor++;
      }
    }
    await client.query(
      `UPDATE relay_sessions
       SET status = 'writing', current_round = 1, round_started_at = now()
       WHERE code = $1`,
      [code]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return true;
}

/** Advance to the next round, or into grading once all four are written. */
export async function advanceRound(code: string, hostToken: string): Promise<RelayStatus | null> {
  await ensureSchema();
  const session = await assertHost(code, hostToken);
  if (!session || session.status !== "writing") return null;

  if (session.current_round >= RELAY_ROUNDS) {
    await query(`UPDATE relay_sessions SET status = 'grading' WHERE code = $1`, [code]);
    return "grading";
  }
  await query(
    `UPDATE relay_sessions
     SET current_round = current_round + 1, round_started_at = now()
     WHERE code = $1`,
    [code]
  );
  return "writing";
}

export async function setStatus(code: string, status: RelayStatus): Promise<void> {
  await ensureSchema();
  await query(`UPDATE relay_sessions SET status = $1 WHERE code = $2`, [status, code]);
}

// ─── Writing ──────────────────────────────────────────────────────────────────

/**
 * Save (or overwrite) what one author wrote on one essay in one round.
 *
 * Autosave calls this repeatedly while the clock runs, so it is an upsert keyed
 * on (essay, round) rather than an append.
 */
export async function saveEntry(opts: {
  code: string;
  essayOwnerId: string;
  round: number;
  authorId: string;
  text: string;
}): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO relay_entries (session_code, essay_owner_id, round, author_id, text)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (essay_owner_id, round)
     DO UPDATE SET text = EXCLUDED.text, author_id = EXCLUDED.author_id, updated_at = now()`,
    [opts.code, opts.essayOwnerId, opts.round, opts.authorId, opts.text.slice(0, 4000)]
  );
}

export async function getEntries(code: string): Promise<RelayEntry[]> {
  await ensureSchema();
  const { rows } = await query<RelayEntry>(
    `SELECT * FROM relay_entries WHERE session_code = $1 ORDER BY round ASC`,
    [code]
  );
  return rows;
}

/** Everything written on one essay so far, in round order — the inheritance view. */
export async function getEssayEntries(essayOwnerId: string): Promise<RelayEntry[]> {
  await ensureSchema();
  const { rows } = await query<RelayEntry>(
    `SELECT * FROM relay_entries WHERE essay_owner_id = $1 ORDER BY round ASC`,
    [essayOwnerId]
  );
  return rows;
}

/** How many essays have a non-empty entry this round — drives the host's progress readout. */
export async function getRoundProgress(code: string, round: number): Promise<number> {
  await ensureSchema();
  const { rows } = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM relay_entries
     WHERE session_code = $1 AND round = $2 AND length(trim(text)) > 0`,
    [code, round]
  );
  return Number(rows[0]?.n ?? 0);
}

// ─── Scores ───────────────────────────────────────────────────────────────────

export async function saveScore(
  code: string,
  essayOwnerId: string,
  score: RelayEssayScore
): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO relay_scores (essay_owner_id, session_code, score)
     VALUES ($1, $2, $3)
     ON CONFLICT (essay_owner_id) DO UPDATE SET score = EXCLUDED.score, scored_at = now()`,
    [essayOwnerId, code, JSON.stringify(score)]
  );
}

export async function getScores(code: string): Promise<RelayScore[]> {
  await ensureSchema();
  const { rows } = await query<RelayScore>(
    `SELECT * FROM relay_scores WHERE session_code = $1`,
    [code]
  );
  return rows;
}
