import { randomBytes } from "crypto";
import { query } from "./db";

// Lengua — live bilingual lesson rooms.
//
// Room lifecycle follows lib/sourceRoomDb.ts (6-char code, host token, per-
// student token, 2s polling), the same shape as Source Room, Cap Raid and
// Relay.
//
// The piece that is specific to Lengua is lengua_lexicon: a cache of glossed
// terms keyed on (term, language) and shared across every deck, session and
// school. It is the reason this is affordable. Live-translating a 45-minute
// lesson costs roughly $2 per class per period; caching means the first student
// anywhere to look up "therefore" in Spanish pays for it and nobody else ever
// does. After a few weeks of use, almost every academic word in circulation is
// already resident and marginal cost approaches zero.

// ─── Types ────────────────────────────────────────────────────────────────────

export type LenguaStatus = "lobby" | "live" | "ended";

export interface LenguaSession {
  code: string;
  host_token: string;
  teacher_id: string | null;
  deck_id: string | null;
  title: string;
  languages: string[];
  status: LenguaStatus;
  current_slide: number;
  started_at: string | null;
  created_at: string;
}

export interface LenguaStudent {
  id: string;
  session_code: string;
  display_name: string;
  student_token: string;
  language: string;
  tier: number;
  joined_at: string;
}

export interface GlossTerm {
  term: string;
  /** Definition in simplified English — what a tap yields first. */
  gloss_en: string;
  /** Translation into the student's language. */
  gloss_l1: string;
  part_of_speech?: string;
}

export interface LenguaGlossary {
  deck_id: string;
  language: string;
  terms: GlossTerm[];
  generated_at: string;
}

export interface LenguaLine {
  id: string;
  session_code: string;
  seq: number;
  text_en: string;
  /** Whisper/browser confidence, 0-1. Low-confidence lines are shown muted. */
  confidence: number;
  spoken_at: string;
}

export interface LookupRow {
  term: string;
  language: string;
  n: number;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS lengua_sessions (
          code          TEXT PRIMARY KEY,
          host_token    TEXT NOT NULL,
          teacher_id    UUID REFERENCES margins_users(id),
          deck_id       UUID,
          title         TEXT NOT NULL DEFAULT 'Lesson',
          languages     TEXT[] NOT NULL DEFAULT '{}',
          status        TEXT NOT NULL DEFAULT 'lobby',
          current_slide INTEGER NOT NULL DEFAULT 0,
          started_at    TIMESTAMPTZ,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS lengua_students (
          id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_code  TEXT NOT NULL REFERENCES lengua_sessions(code) ON DELETE CASCADE,
          display_name  TEXT NOT NULL,
          student_token TEXT NOT NULL,
          language      TEXT NOT NULL,
          tier          INTEGER NOT NULL DEFAULT 2,
          joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(session_code, student_token)
        );
      `);

      // Per-deck, per-language glossary. Built once when the teacher adds a
      // language to a deck, then reused for every future lesson from that deck.
      await query(`
        CREATE TABLE IF NOT EXISTS lengua_glossaries (
          deck_id      UUID NOT NULL,
          language     TEXT NOT NULL,
          terms        JSONB NOT NULL DEFAULT '[]',
          generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (deck_id, language)
        );
      `);

      // The shared cache. Not scoped to a deck, session, teacher or school —
      // deliberately global, because "therefore" means the same thing in every
      // classroom and should only ever be paid for once.
      await query(`
        CREATE TABLE IF NOT EXISTS lengua_lexicon (
          term       TEXT NOT NULL,
          language   TEXT NOT NULL,
          gloss_en   TEXT NOT NULL,
          gloss_l1   TEXT NOT NULL,
          part_of_speech TEXT,
          hits       INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (term, language)
        );
      `);

      // Every tap. This is the diagnostic that makes Lengua more than a
      // dictionary — live, it tells the teacher which words just lost the room.
      await query(`
        CREATE TABLE IF NOT EXISTS lengua_lookups (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_code TEXT NOT NULL REFERENCES lengua_sessions(code) ON DELETE CASCADE,
          student_id   UUID NOT NULL REFERENCES lengua_students(id) ON DELETE CASCADE,
          term         TEXT NOT NULL,
          language     TEXT NOT NULL,
          slide_index  INTEGER NOT NULL DEFAULT 0,
          reached_l1   BOOLEAN NOT NULL DEFAULT false,
          looked_up_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS lengua_lines (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_code TEXT NOT NULL REFERENCES lengua_sessions(code) ON DELETE CASCADE,
          seq          INTEGER NOT NULL,
          text_en      TEXT NOT NULL,
          confidence   REAL NOT NULL DEFAULT 1,
          spoken_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(session_code, seq)
        );
      `);

      await query(
        `CREATE INDEX IF NOT EXISTS lengua_lines_recent ON lengua_lines (session_code, seq DESC)`
      );
      await query(
        `CREATE INDEX IF NOT EXISTS lengua_lookups_session ON lengua_lookups (session_code, term)`
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
  deckId: string | null;
  title: string;
  languages: string[];
  teacherId?: string | null;
}): Promise<{ code: string; hostToken: string }> {
  await ensureSchema();
  const hostToken = randomBytes(24).toString("hex");
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const { rows } = await query<{ code: string }>(
      `INSERT INTO lengua_sessions (code, host_token, teacher_id, deck_id, title, languages)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (code) DO NOTHING RETURNING code`,
      [code, hostToken, opts.teacherId ?? null, opts.deckId, opts.title, opts.languages]
    );
    if (rows.length > 0) return { code: rows[0].code, hostToken };
  }
  throw new Error("Could not allocate a unique room code.");
}

export async function getSession(code: string): Promise<LenguaSession | null> {
  await ensureSchema();
  const { rows } = await query<LenguaSession>(`SELECT * FROM lengua_sessions WHERE code = $1`, [code]);
  return rows[0] ?? null;
}

export async function startSession(code: string, hostToken: string): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await query(
    `UPDATE lengua_sessions SET status='live', started_at=now()
     WHERE code=$1 AND host_token=$2 AND status='lobby'`,
    [code, hostToken]
  );
  return (rowCount ?? 0) > 0;
}

export async function endSession(code: string, hostToken: string): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await query(
    `UPDATE lengua_sessions SET status='ended' WHERE code=$1 AND host_token=$2`,
    [code, hostToken]
  );
  return (rowCount ?? 0) > 0;
}

export async function setCurrentSlide(
  code: string,
  hostToken: string,
  index: number
): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await query(
    `UPDATE lengua_sessions SET current_slide=$3 WHERE code=$1 AND host_token=$2`,
    [code, hostToken, Math.max(0, index)]
  );
  return (rowCount ?? 0) > 0;
}

// ─── Students ─────────────────────────────────────────────────────────────────

export async function joinSession(opts: {
  code: string;
  name: string;
  studentToken: string;
  language: string;
  tier: number;
}): Promise<LenguaStudent | null> {
  await ensureSchema();
  const session = await getSession(opts.code);
  if (!session || session.status === "ended") return null;

  // Rejoining is normal — a phone sleeps, a laptop lid closes. Upsert so a
  // student keeps their identity and their lookup history for the lesson.
  const { rows } = await query<LenguaStudent>(
    `INSERT INTO lengua_students (session_code, display_name, student_token, language, tier)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (session_code, student_token)
     DO UPDATE SET display_name=EXCLUDED.display_name,
                   language=EXCLUDED.language,
                   tier=EXCLUDED.tier
     RETURNING *`,
    [opts.code, opts.name.slice(0, 40), opts.studentToken, opts.language, opts.tier]
  );
  return rows[0] ?? null;
}

export async function getStudentByToken(
  code: string,
  studentToken: string
): Promise<LenguaStudent | null> {
  await ensureSchema();
  const { rows } = await query<LenguaStudent>(
    `SELECT * FROM lengua_students WHERE session_code=$1 AND student_token=$2`,
    [code, studentToken]
  );
  return rows[0] ?? null;
}

export async function getStudents(code: string): Promise<LenguaStudent[]> {
  await ensureSchema();
  const { rows } = await query<LenguaStudent>(
    `SELECT * FROM lengua_students WHERE session_code=$1 ORDER BY joined_at ASC`,
    [code]
  );
  return rows;
}

export async function setStudentTier(
  code: string,
  studentToken: string,
  tier: number
): Promise<void> {
  await ensureSchema();
  await query(
    `UPDATE lengua_students SET tier=$3 WHERE session_code=$1 AND student_token=$2`,
    [code, studentToken, Math.max(1, Math.min(4, tier))]
  );
}

// ─── Transcript ───────────────────────────────────────────────────────────────

export async function appendLine(opts: {
  code: string;
  seq: number;
  text: string;
  confidence: number;
}): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO lengua_lines (session_code, seq, text_en, confidence)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (session_code, seq) DO UPDATE
       SET text_en=EXCLUDED.text_en, confidence=EXCLUDED.confidence`,
    [opts.code, opts.seq, opts.text.slice(0, 2000), Math.max(0, Math.min(1, opts.confidence))]
  );
}

/** Most recent lines, oldest-first for rendering. */
export async function getRecentLines(code: string, limit = 25): Promise<LenguaLine[]> {
  await ensureSchema();
  const { rows } = await query<LenguaLine>(
    `SELECT * FROM (
       SELECT * FROM lengua_lines WHERE session_code=$1 ORDER BY seq DESC LIMIT $2
     ) t ORDER BY seq ASC`,
    [code, limit]
  );
  return rows;
}

export async function getMaxSeq(code: string): Promise<number> {
  await ensureSchema();
  const { rows } = await query<{ m: number | null }>(
    `SELECT MAX(seq) AS m FROM lengua_lines WHERE session_code=$1`,
    [code]
  );
  return rows[0]?.m ?? -1;
}

// ─── Glossaries ───────────────────────────────────────────────────────────────

export async function getGlossary(deckId: string, language: string): Promise<LenguaGlossary | null> {
  await ensureSchema();
  const { rows } = await query<LenguaGlossary>(
    `SELECT * FROM lengua_glossaries WHERE deck_id=$1 AND language=$2`,
    [deckId, language]
  );
  return rows[0] ?? null;
}

export async function saveGlossary(
  deckId: string,
  language: string,
  terms: GlossTerm[]
): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO lengua_glossaries (deck_id, language, terms, generated_at)
     VALUES ($1,$2,$3,now())
     ON CONFLICT (deck_id, language)
     DO UPDATE SET terms=EXCLUDED.terms, generated_at=now()`,
    [deckId, language, JSON.stringify(terms)]
  );
}

export async function getGlossaryLanguages(deckId: string): Promise<string[]> {
  await ensureSchema();
  const { rows } = await query<{ language: string }>(
    `SELECT language FROM lengua_glossaries WHERE deck_id=$1 ORDER BY language`,
    [deckId]
  );
  return rows.map((r) => r.language);
}

// ─── Lexicon cache ────────────────────────────────────────────────────────────

export async function lookupLexicon(term: string, language: string): Promise<GlossTerm | null> {
  await ensureSchema();
  const key = term.trim().toLowerCase();
  const { rows } = await query<GlossTerm>(
    `UPDATE lengua_lexicon SET hits = hits + 1
      WHERE term=$1 AND language=$2
      RETURNING term, gloss_en, gloss_l1, part_of_speech`,
    [key, language]
  );
  return rows[0] ?? null;
}

export async function saveLexicon(language: string, entry: GlossTerm): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO lengua_lexicon (term, language, gloss_en, gloss_l1, part_of_speech, hits)
     VALUES ($1,$2,$3,$4,$5,1)
     ON CONFLICT (term, language) DO UPDATE
       SET gloss_en=EXCLUDED.gloss_en, gloss_l1=EXCLUDED.gloss_l1`,
    [
      entry.term.trim().toLowerCase(),
      language,
      entry.gloss_en,
      entry.gloss_l1,
      entry.part_of_speech ?? null,
    ]
  );
}

/** Seed the shared cache from a freshly generated deck glossary — free warmth. */
export async function seedLexiconFromGlossary(language: string, terms: GlossTerm[]): Promise<void> {
  for (const t of terms) await saveLexicon(language, t);
}

// ─── Lookups (the diagnostic) ─────────────────────────────────────────────────

export async function recordLookup(opts: {
  code: string;
  studentId: string;
  term: string;
  language: string;
  slideIndex: number;
  reachedL1: boolean;
}): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO lengua_lookups (session_code, student_id, term, language, slide_index, reached_l1)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      opts.code,
      opts.studentId,
      opts.term.trim().toLowerCase(),
      opts.language,
      opts.slideIndex,
      opts.reachedL1,
    ]
  );
}

/**
 * Words that lost the room, most-looked-up first.
 *
 * Grouped by term ALONE, not by (term, language). A teacher wants "six students
 * stopped on scarcity", not three separate rows reading 2, 2 and 2 — the fact
 * that they were reading it in different languages is not the signal. Counts
 * distinct students rather than raw taps so one confused student tapping five
 * times doesn't outrank a word that actually stopped half the class. The
 * languages involved come back as a detail for the rare case it matters.
 */
export async function getLookupHeatmap(code: string, limit = 12): Promise<LookupRow[]> {
  await ensureSchema();
  const { rows } = await query<LookupRow>(
    `SELECT term,
            COUNT(DISTINCT student_id)::int AS n,
            array_to_string(ARRAY(
              SELECT DISTINCT l2.language FROM lengua_lookups l2
               WHERE l2.session_code = l.session_code AND l2.term = l.term
               ORDER BY l2.language
            ), ',') AS language
       FROM lengua_lookups l WHERE l.session_code=$1
      GROUP BY l.session_code, l.term
      ORDER BY n DESC, term ASC LIMIT $2`,
    [code, limit]
  );
  return rows;
}

/** One student's harvest for the lesson — the end-of-class review list. */
export async function getStudentHarvest(code: string, studentId: string): Promise<string[]> {
  await ensureSchema();
  const { rows } = await query<{ term: string }>(
    `SELECT term, COUNT(*)::int AS n FROM lengua_lookups
      WHERE session_code=$1 AND student_id=$2
      GROUP BY term ORDER BY n DESC, term ASC LIMIT 20`,
    [code, studentId]
  );
  return rows.map((r) => r.term);
}
