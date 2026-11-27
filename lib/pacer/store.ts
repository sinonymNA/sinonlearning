// What Pacer remembers, only on this device: the books you opened (IndexedDB, so you can resume without picking the file again), your place, your speed and your session history (localStorage).
import type { Book } from "./extract";

export type Settings = { mode: "focus" | "pacer" | "scroll"; wpm: number; chunk: number; smart: boolean; font: "serif" | "sans" | "mono"; size: number; width: "narrow" | "medium" | "wide"; theme: "paper" | "sepia" | "night" | "contrast"; dim: boolean; ramp: boolean; rampMax: number; checks: 0 | 250 | 500 | 1000 };
export const DEFAULTS: Settings = { mode: "pacer", wpm: 250, chunk: 1, smart: true, font: "serif", size: 24, width: "medium", theme: "paper", dim: false, ramp: false, rampMax: 400, checks: 0 };
export type LibItem = { id: string; title: string; author?: string; words: number; pos: number; wpm: number; updated: number };
export type Session = { t: number; title: string; words: number; wpm: number; recall: number | null; minutes: number };
export type Saved = { settings: Settings; library: LibItem[]; sessions: Session[] };
const KEY = "pacer:v1";
export function loadSaved(): Saved {
  try { const j = JSON.parse(localStorage.getItem(KEY) || "null"); if (j) return { settings: { ...DEFAULTS, ...(j.settings || {}) }, library: Array.isArray(j.library) ? j.library : [], sessions: Array.isArray(j.sessions) ? j.sessions.slice(-60) : [] }; } catch { /* private mode or corrupt */ }
  return { settings: { ...DEFAULTS }, library: [], sessions: [] };
}
export function save(s: Saved) { try { localStorage.setItem(KEY, JSON.stringify({ ...s, sessions: s.sessions.slice(-60) })); } catch { /* storage blocked */ } }

const DB = "pacer", STORE = "books";
const open = () => new Promise<IDBDatabase>((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => { r.result.createObjectStore(STORE, { keyPath: "id" }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const tx = async <T,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => { const db = await open(); return new Promise<T>((res, rej) => { const r = fn(db.transaction(STORE, mode).objectStore(STORE)); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); };
export const putBook = (b: Book) => tx("readwrite", (s) => s.put(b)).catch(() => undefined);
export const getBook = (id: string) => tx<Book | undefined>("readonly", (s) => s.get(id)).catch(() => undefined);
export const delBook = (id: string) => tx("readwrite", (s) => s.delete(id)).catch(() => undefined);
