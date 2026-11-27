// Pacer sync storage (Postgres): each signed-in user's extracted books (gzipped JSON, never the original file), their place in each, and their reader settings and session history.
import { query, transaction } from "./db";
import { LIMITS } from "./pacer/validate.mjs";

export type PacerMeta = { id: string; title: string; author: string | null; words: number; bytes: number; pos: number; wpm: number; at: number; added: number };

let ready: Promise<void> | null = null;
export function ensurePacerSchema(): Promise<void> {
  if (!ready) {
    ready = query(`CREATE TABLE IF NOT EXISTS pacer_books (
      user_id UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      words INTEGER NOT NULL,
      bytes INTEGER NOT NULL,
      data BYTEA NOT NULL,
      pos INTEGER NOT NULL DEFAULT 0,
      wpm INTEGER NOT NULL DEFAULT 250,
      progress_at BIGINT NOT NULL DEFAULT 0,
      added_at BIGINT NOT NULL,
      PRIMARY KEY (user_id, id)
    )`).then(() => query(`CREATE TABLE IF NOT EXISTS pacer_state (
      user_id UUID PRIMARY KEY REFERENCES margins_users(id) ON DELETE CASCADE,
      settings JSONB NOT NULL DEFAULT '{}',
      sessions JSONB NOT NULL DEFAULT '[]',
      settings_at BIGINT NOT NULL DEFAULT 0
    )`)).then(() => undefined).catch((e) => { ready = null; throw e; });
  }
  return ready;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const meta = (r: Record<string, any>): PacerMeta => ({ id: r.id, title: r.title, author: r.author, words: r.words, bytes: r.bytes, pos: r.pos, wpm: r.wpm, at: Number(r.progress_at), added: Number(r.added_at) });

export async function listBooks(userId: string): Promise<PacerMeta[]> {
  await ensurePacerSchema(); const r = await query(`SELECT id, title, author, words, bytes, pos, wpm, progress_at, added_at FROM pacer_books WHERE user_id = $1 ORDER BY GREATEST(progress_at, added_at) DESC`, [userId]); return r.rows.map(meta);
}
export async function usage(userId: string) { await ensurePacerSchema(); const r = await query<{ n: string; b: string }>(`SELECT COUNT(*) AS n, COALESCE(SUM(bytes), 0) AS b FROM pacer_books WHERE user_id = $1`, [userId]); return { books: Number(r.rows[0].n), bytes: Number(r.rows[0].b) }; }
export async function getBookData(userId: string, id: string): Promise<Buffer | null> { await ensurePacerSchema(); const r = await query<{ data: Buffer }>(`SELECT data FROM pacer_books WHERE user_id = $1 AND id = $2`, [userId, id]); return r.rows[0]?.data ?? null; }
/** Save (or replace) a book. Returns an error string when a quota would be exceeded. The reading position is kept when a book is re-uploaded. */
export async function putBook(userId: string, m: { id: string; title: string; author?: string; words: number; added: number }, gz: Buffer, startPos = 0, startWpm = 250, at = 0): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensurePacerSchema();
  return transaction(async (run) => {
    const u = await run<{ n: string; b: string }>(`SELECT COUNT(*) AS n, COALESCE(SUM(bytes), 0) AS b FROM pacer_books WHERE user_id = $1 AND id <> $2`, [userId, m.id]);
    if (Number(u.rows[0].n) >= LIMITS.maxBooks) return { ok: false as const, error: `You can keep up to ${LIMITS.maxBooks} books. Remove one first.` };
    if (Number(u.rows[0].b) + gz.length > LIMITS.maxTotalBytes) return { ok: false as const, error: "Your account storage is full. Remove a book first." };
    await run(`INSERT INTO pacer_books (user_id, id, title, author, words, bytes, data, pos, wpm, progress_at, added_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (user_id, id) DO UPDATE SET title = EXCLUDED.title, author = EXCLUDED.author, words = EXCLUDED.words, bytes = EXCLUDED.bytes, data = EXCLUDED.data`, [userId, m.id, m.title, m.author ?? null, m.words, gz.length, gz, Math.max(0, Math.min(m.words, startPos)), startWpm, at, m.added || Date.now()]);
    return { ok: true as const };
  });
}
export async function deleteBook(userId: string, id: string) { await ensurePacerSchema(); const r = await query(`DELETE FROM pacer_books WHERE user_id = $1 AND id = $2`, [userId, id]); return (r.rowCount ?? 0) > 0; }
/** Newest write wins: a stale device cannot move you backwards. */
export async function setProgress(userId: string, id: string, pos: number, wpm: number, at: number) { await ensurePacerSchema(); const r = await query(`UPDATE pacer_books SET pos = LEAST($3, words), wpm = $4, progress_at = $5 WHERE user_id = $1 AND id = $2 AND progress_at < $5`, [userId, id, Math.max(0, pos), wpm, at]); return (r.rowCount ?? 0) > 0; }
export async function getState(userId: string) { await ensurePacerSchema(); const r = await query<{ settings: unknown; sessions: unknown; settings_at: string }>(`SELECT settings, sessions, settings_at FROM pacer_state WHERE user_id = $1`, [userId]); const x = r.rows[0]; return { settings: x?.settings ?? null, sessions: x?.sessions ?? [], at: Number(x?.settings_at ?? 0) }; }
export async function setState(userId: string, settings: unknown, sessions: unknown, at: number) {
  await ensurePacerSchema(); await query(`INSERT INTO pacer_state (user_id, settings, sessions, settings_at) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET sessions = EXCLUDED.sessions, settings = CASE WHEN pacer_state.settings_at <= EXCLUDED.settings_at THEN EXCLUDED.settings ELSE pacer_state.settings END, settings_at = GREATEST(pacer_state.settings_at, EXCLUDED.settings_at)`, [userId, JSON.stringify(settings), JSON.stringify(sessions), at]);
}
