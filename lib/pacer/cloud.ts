// Talking to Pacer sync (/api/pacer/*). Only used when the reader is signed in; every call fails soft so reading never depends on the network.
import type { Book } from "./extract";
import type { Settings, Session } from "./store";

export type Account = { name: string; role: string };
export type CloudMeta = { id: string; title: string; author: string | null; words: number; bytes: number; pos: number; wpm: number; at: number; added: number };
export type CloudLib = { user: Account | null; sync: boolean; books: CloudMeta[]; settings: Settings | null; sessions: Session[]; settingsAt: number; usage?: { books: number; bytes: number; maxBooks: number; maxBytes: number } };
const json = { "Content-Type": "application/json" };

export async function fetchLibrary(): Promise<CloudLib | null> {
  try { const r = await fetch("/api/pacer/library", { cache: "no-store", credentials: "same-origin" }); if (!r.ok) return null; const j = await r.json(); return { user: j.user ?? null, sync: !!j.sync, books: j.books ?? [], settings: j.settings && Object.keys(j.settings).length ? j.settings : null, sessions: j.sessions ?? [], settingsAt: j.settingsAt ?? 0, usage: j.usage }; } catch { return null; }
}
async function pack(text: string): Promise<{ body: BodyInit; type: string }> {
  if (typeof CompressionStream !== "undefined") { try { const out = await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"))).blob(); return { body: out, type: "application/gzip" }; } catch { /* fall through */ } }
  return { body: text, type: "application/json" };
}
/** Save a book (its extracted text, never the original file) to the account. */
export async function uploadBook(b: Book, pos: number, wpm: number, at: number): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { body, type } = await pack(JSON.stringify({ id: b.id, title: b.title, author: b.author, added: b.added, chapters: b.chapters }));
    const r = await fetch(`/api/pacer/books/${b.id}`, { method: "PUT", body, headers: { "Content-Type": type, "x-pacer-pos": String(pos), "x-pacer-wpm": String(wpm), "x-pacer-at": String(at) }, credentials: "same-origin" });
    if (r.ok) return { ok: true }; const j = await r.json().catch(() => ({})); return { ok: false, error: j.error || "Could not save that book to your account." };
  } catch { return { ok: false, error: "You seem to be offline. The book is saved on this device." }; }
}
export async function downloadBook(id: string): Promise<Book | null> {
  try { const r = await fetch(`/api/pacer/books/${id}`, { cache: "no-store", credentials: "same-origin" }); if (!r.ok) return null; const j = await r.json(); return { id: j.id, title: j.title, author: j.author, chapters: j.chapters, words: j.words, added: j.added || Date.now() } as Book; } catch { return null; }
}
export async function deleteCloud(id: string): Promise<boolean> { try { return (await fetch(`/api/pacer/books/${id}`, { method: "DELETE", credentials: "same-origin" })).ok; } catch { return false; } }
/** keepalive lets this finish even while the page is closing. */
export function pushProgress(id: string, pos: number, wpm: number, at: number) { try { fetch("/api/pacer/progress", { method: "PUT", headers: json, body: JSON.stringify({ id, pos, wpm, at }), keepalive: true, credentials: "same-origin" }).catch(() => undefined); } catch { /* offline */ } }
export async function pushState(settings: Settings, sessions: Session[], at: number): Promise<{ settings: Settings; sessions: Session[]; at: number } | null> {
  try { const r = await fetch("/api/pacer/state", { method: "PUT", headers: json, body: JSON.stringify({ settings, sessions, at }), credentials: "same-origin" }); return r.ok ? await r.json() : null; } catch { return null; }
}
export async function signOut(): Promise<void> { try { await fetch("/api/margins/auth/logout", { method: "POST", credentials: "same-origin" }); } catch { /* ignore */ } }
