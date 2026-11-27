// Loader for the HD voice: the Kokoro model (82M parameters, an audiobook-style voice) running in a Web Worker in the browser.
// The model file (about 90 MB) comes from huggingface.co once and is kept in the browser's cache; the runtime and voice files are served by this site (/pacer-hd).
// No reading text is ever sent anywhere: synthesis runs on the device.
/* eslint-disable @typescript-eslint/no-explicit-any */
export const HD_VOICES = [
  { id: "af_heart", label: "Heart, US female (recommended)" },
  { id: "af_bella", label: "Bella, US female" },
  { id: "af_nicole", label: "Nicole, US female" },
  { id: "bf_emma", label: "Emma, British female" },
  { id: "am_michael", label: "Michael, US male" },
  { id: "bm_fable", label: "Fable, British male" },
  { id: "bm_george", label: "George, British male" },
] as const;
export const HD_MB = 90;
export const VOICE_ID_RE = /^[a-z]{2}_[a-z]+$/;
export const DEFAULT_VOICE = "af_heart";

const fake = (): any => (process.env.NODE_ENV !== "production" && typeof globalThis !== "undefined" ? (globalThis as any).__pacerHdFake : undefined); // test hook, never in production builds
export const hdSupported = () => !!fake() || (typeof Worker !== "undefined" && typeof WebAssembly === "object" && typeof caches !== "undefined");

const CACHE = "transformers-cache"; // where transformers.js keeps the model
export async function isStored(): Promise<boolean> {
  const f = fake(); if (f) return !!f.stored;
  try { const c = await caches.open(CACHE); return (await c.keys()).some((r) => /model_quantized\.onnx/.test(r.url)); } catch { return false; }
}

let worker: Worker | null = null, readyP: Promise<void> | null = null, voice = DEFAULT_VOICE, nextId = 1; const waiting = new Map<number, { ok: (b: Blob) => void; no: (e: Error) => void }>();
export const setVoice = (id: string) => { if (VOICE_ID_RE.test(id)) voice = id; };
function fail(e: Error) { waiting.forEach((w) => w.no(e)); waiting.clear(); }
/** Start the worker and load the model (downloads it the first time). Safe to call again. */
export function prepare(onProgress?: (frac: number) => void): Promise<void> {
  if (fake()) return Promise.resolve(); if (readyP) return readyP;
  readyP = new Promise<void>((ok, no) => {
    try { worker = new Worker(new URL("./kokoro.worker.ts", import.meta.url), { type: "module" }); } catch (e) { readyP = null; no(e as Error); return; }
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.op === "progress") onProgress?.(Math.min(1, m.frac)); else if (m.op === "ready") { onProgress?.(1); ok(); }
      else if (m.op === "audio") { waiting.get(m.id)?.ok(m.blob); waiting.delete(m.id); }
      else if (m.op === "error") { const err = new Error(m.message); if (m.id && waiting.has(m.id)) { waiting.get(m.id)!.no(err); waiting.delete(m.id); } else { readyP = null; worker?.terminate(); worker = null; no(err); } }
    };
    worker.onerror = (e) => { const err = new Error(e.message || "voice worker failed"); readyP = null; worker?.terminate(); worker = null; fail(err); no(err); };
    worker.postMessage({ op: "init" });
  });
  return readyP;
}
/** Download the model (first time) and get it ready. */
export const download = async (onProgress: (frac: number) => void) => { if (fake()) { fake().stored = true; onProgress(1); return; } await prepare(onProgress); };
export async function removeVoice(): Promise<void> {
  readyP = null; worker?.terminate(); worker = null; const f = fake(); if (f) { f.stored = false; return; }
  try { await caches.delete(CACHE); } catch { /* nothing stored */ }
}
const clean = (t: string) => t.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, " ").trim();
/** Speak one segment: returns a blob URL for a WAV the audio element can play. The caller revokes it. */
export async function synthesize(text: string): Promise<string> {
  const f = fake(); if (f) return URL.createObjectURL(await f.synth(text));
  await prepare(); const w = worker; if (!w) throw new Error("voice not ready"); const id = nextId++;
  const blob = await new Promise<Blob>((ok, no) => { waiting.set(id, { ok, no }); w.postMessage({ op: "gen", id, text: clean(text), voice }); });
  return URL.createObjectURL(blob);
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") (window as any).__pacerHdTools = { prepare, synthesize, removeVoice, isStored }; // dev/test hook only
