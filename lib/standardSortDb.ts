import { randomBytes } from "crypto";
import { query } from "./db";
import { type StandardItem } from "./standardSort";

// Standard Sort — a curriculum team independently sorts standards into units,
// then sees where they agree and where they don't.
//
// Deliberately simpler than the live-room tools (Relay, Lengua, Cap Raid):
// there is no host driving pace in real time. This is parallel and
// asynchronous, closer to a survey than a live session — so there is no
// "host" role for running it, only a host_token gating one destructive admin
// action (reset). Anyone who finishes lands on the same results view anyone
// else can also just visit by URL, which doubles as the "project this on the
// screen at the meeting" view.
//
// Selections are multi-select per standard rather than one-of-N. A standard
// that genuinely belongs in two units will show up as near-universal
// agreement on both — which is the correct signal — rather than being forced
// into a single bucket or needing a special "spans multiple" escape hatch.
//
// Types and the client-safe parser/constant live in standardSort.ts, not
// here — this file imports "./db" (the pg driver), and any client component
// that imports even a constant from the same module drags pg into the
// browser bundle. See standardSort.ts's header comment.

// ─── Types ────────────────────────────────────────────────────────────────────

export type { StandardItem };

export interface StandardSortSession {
  code: string;
  host_token: string;
  title: string;
  units: string[];
  standards: StandardItem[];
  created_at: string;
}

export interface StandardSortParticipant {
  session_code: string;
  participant_token: string;
  name: string;
  joined_at: string;
}

export interface StandardSortResponse {
  session_code: string;
  participant_token: string;
  standard_id: string;
  units: string[];
  answered_at: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS standard_sort_sessions (
          code       TEXT PRIMARY KEY,
          host_token TEXT NOT NULL,
          title      TEXT NOT NULL,
          units      TEXT[] NOT NULL,
          standards  JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS standard_sort_participants (
          session_code      TEXT NOT NULL REFERENCES standard_sort_sessions(code) ON DELETE CASCADE,
          participant_token TEXT NOT NULL,
          name              TEXT NOT NULL,
          joined_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (session_code, participant_token)
        );
      `);

      // One row per (participant, standard) — re-answering (going back to
      // change a pick before finishing) overwrites rather than appends.
      await query(`
        CREATE TABLE IF NOT EXISTS standard_sort_responses (
          session_code      TEXT NOT NULL REFERENCES standard_sort_sessions(code) ON DELETE CASCADE,
          participant_token TEXT NOT NULL,
          standard_id       TEXT NOT NULL,
          units             TEXT[] NOT NULL,
          answered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (session_code, participant_token, standard_id)
        );
      `);

      await query(
        `CREATE INDEX IF NOT EXISTS standard_sort_responses_session ON standard_sort_responses (session_code)`
      );
    })();
  }
  return schemaReady;
}

// ─── Codes ────────────────────────────────────────────────────────────────────

const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  return Array.from(randomBytes(6))
    .map((b) => CODE_CHARSET[b % CODE_CHARSET.length])
    .join("");
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(opts: {
  title: string;
  units: string[];
  standards: StandardItem[];
}): Promise<{ code: string; hostToken: string }> {
  await ensureSchema();
  const hostToken = randomBytes(24).toString("hex");
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const { rows } = await query<{ code: string }>(
      `INSERT INTO standard_sort_sessions (code, host_token, title, units, standards)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (code) DO NOTHING RETURNING code`,
      [code, hostToken, opts.title.slice(0, 200), opts.units, JSON.stringify(opts.standards)]
    );
    if (rows.length > 0) return { code: rows[0].code, hostToken };
  }
  throw new Error("Could not allocate a unique room code.");
}

export async function getSession(code: string): Promise<StandardSortSession | null> {
  await ensureSchema();
  const { rows } = await query<StandardSortSession>(
    `SELECT * FROM standard_sort_sessions WHERE code = $1`,
    [code]
  );
  return rows[0] ?? null;
}

/**
 * Get a session, or create it from a seed if this is the first time anyone
 * has visited its fixed code. This is what lets a pre-decided standards list
 * work as "just visit the link" — nobody has to run the create form first.
 *
 * Idempotent under concurrent first-visitors: the insert is a no-op on
 * conflict, and either request simply re-selects the winning row.
 *
 * Once created, a seeded session stays in sync with its seed definition —
 * editing the data (fixing a typo, dropping items) takes effect on the next
 * request rather than needing the DB row touched by hand. Only title/units/
 * standards are resynced; host_token, participants, and every response are
 * left alone. A response referencing a standard_id the edit removed simply
 * stops appearing in the tally (getSessionResults only iterates the current
 * standards list) — no orphaned-row error, it just quietly drops out.
 */
export async function getOrCreateSeededSession(
  code: string,
  seed: { title: string; units: string[]; standards: StandardItem[] }
): Promise<StandardSortSession> {
  await ensureSchema();
  const existing = await getSession(code);
  if (existing) {
    const inSync =
      existing.title === seed.title &&
      JSON.stringify(existing.units) === JSON.stringify(seed.units) &&
      JSON.stringify(existing.standards) === JSON.stringify(seed.standards);
    if (inSync) return existing;

    const { rows } = await query<StandardSortSession>(
      `UPDATE standard_sort_sessions SET title=$2, units=$3, standards=$4 WHERE code=$1 RETURNING *`,
      [code, seed.title.slice(0, 200), seed.units, JSON.stringify(seed.standards)]
    );
    return rows[0];
  }

  await query(
    `INSERT INTO standard_sort_sessions (code, host_token, title, units, standards)
     VALUES ($1,$2,$3,$4,$5) ON CONFLICT (code) DO NOTHING`,
    [code, randomBytes(24).toString("hex"), seed.title.slice(0, 200), seed.units, JSON.stringify(seed.standards)]
  );
  return (await getSession(code))!;
}

/** Wipes participants and responses so the same code/link can be reused for a real run after a trial. */
export async function resetSession(code: string, hostToken: string): Promise<boolean> {
  await ensureSchema();
  const session = await getSession(code);
  if (!session || session.host_token !== hostToken) return false;
  await query(`DELETE FROM standard_sort_responses WHERE session_code = $1`, [code]);
  await query(`DELETE FROM standard_sort_participants WHERE session_code = $1`, [code]);
  return true;
}

// ─── Participants ─────────────────────────────────────────────────────────────

export async function joinSession(
  code: string,
  name: string,
  participantToken: string
): Promise<StandardSortParticipant | null> {
  await ensureSchema();
  const session = await getSession(code);
  if (!session) return null;

  const { rows } = await query<StandardSortParticipant>(
    `INSERT INTO standard_sort_participants (session_code, participant_token, name)
     VALUES ($1,$2,$3)
     ON CONFLICT (session_code, participant_token) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [code, participantToken, name.slice(0, 60)]
  );
  return rows[0] ?? null;
}

export async function getParticipants(code: string): Promise<StandardSortParticipant[]> {
  await ensureSchema();
  const { rows } = await query<StandardSortParticipant>(
    `SELECT * FROM standard_sort_participants WHERE session_code = $1 ORDER BY joined_at ASC`,
    [code]
  );
  return rows;
}

// ─── Responses ────────────────────────────────────────────────────────────────

export async function saveResponse(opts: {
  code: string;
  participantToken: string;
  standardId: string;
  units: string[];
}): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO standard_sort_responses (session_code, participant_token, standard_id, units)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (session_code, participant_token, standard_id)
     DO UPDATE SET units = EXCLUDED.units, answered_at = now()`,
    [opts.code, opts.participantToken, opts.standardId, opts.units]
  );
}

/** One participant's saved answers, for resuming a sort after a refresh. */
export async function getParticipantResponses(
  code: string,
  participantToken: string
): Promise<Record<string, string[]>> {
  await ensureSchema();
  const { rows } = await query<{ standard_id: string; units: string[] }>(
    `SELECT standard_id, units FROM standard_sort_responses WHERE session_code=$1 AND participant_token=$2`,
    [code, participantToken]
  );
  const out: Record<string, string[]> = {};
  for (const r of rows) out[r.standard_id] = r.units;
  return out;
}

// ─── Results ──────────────────────────────────────────────────────────────────

export interface UnitCount {
  unit: string;
  count: number;
  pct: number;
}

export interface StandardTally extends StandardItem {
  respondentCount: number;
  unitCounts: UnitCount[];
  /** Every respondent who answered picked the exact same set of units. */
  fullAgreement: boolean;
  /** No unit reached a clear majority and responses weren't unanimous — surface this for the meeting. */
  needsDiscussion: boolean;
}

export interface SessionResults {
  totalParticipants: number;
  finishedParticipants: number;
  standardCount: number;
  standards: StandardTally[];
}

const MAJORITY_THRESHOLD = 0.6;

export async function getSessionResults(code: string): Promise<SessionResults | null> {
  await ensureSchema();
  const session = await getSession(code);
  if (!session) return null;

  const participants = await getParticipants(code);
  const { rows } = await query<{ participant_token: string; standard_id: string; units: string[] }>(
    `SELECT participant_token, standard_id, units FROM standard_sort_responses WHERE session_code = $1`,
    [code]
  );

  const byStandard = new Map<string, { token: string; units: string[] }[]>();
  const answeredCount = new Map<string, number>();
  for (const r of rows) {
    if (!byStandard.has(r.standard_id)) byStandard.set(r.standard_id, []);
    byStandard.get(r.standard_id)!.push({ token: r.participant_token, units: r.units });
    answeredCount.set(r.participant_token, (answeredCount.get(r.participant_token) ?? 0) + 1);
  }

  const finishedParticipants = participants.filter(
    (p) => (answeredCount.get(p.participant_token) ?? 0) >= session.standards.length
  ).length;

  const standards: StandardTally[] = session.standards.map((std) => {
    const entries = byStandard.get(std.id) ?? [];
    const respondentCount = entries.length;

    const counts = new Map<string, number>();
    for (const e of entries) for (const u of e.units) counts.set(u, (counts.get(u) ?? 0) + 1);

    const unitCounts: UnitCount[] = session.units
      .map((unit) => {
        const count = counts.get(unit) ?? 0;
        return { unit, count, pct: respondentCount > 0 ? Math.round((count / respondentCount) * 100) : 0 };
      })
      .sort((a, b) => b.count - a.count);

    // Full agreement: every respondent's unit set is identical, order-ignored.
    const sortedSets = entries.map((e) => [...e.units].sort().join(""));
    const fullAgreement = respondentCount > 0 && sortedSets.every((s) => s === sortedSets[0]);

    const topShare = respondentCount > 0 ? (unitCounts[0]?.count ?? 0) / respondentCount : 0;
    const needsDiscussion = respondentCount > 0 && !fullAgreement && topShare < MAJORITY_THRESHOLD;

    return { ...std, respondentCount, unitCounts, fullAgreement, needsDiscussion };
  });

  return {
    totalParticipants: participants.length,
    finishedParticipants,
    standardCount: session.standards.length,
    standards,
  };
}
