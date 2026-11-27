// Loader for the HD voice (Piper running in the browser). The library and its WebAssembly are only fetched when someone turns the HD voice on.
// The voice file comes from huggingface.co; the runtime is served by this site (/pacer-hd). No reading text is ever sent anywhere: synthesis runs on the device.
/* eslint-disable @typescript-eslint/no-explicit-any */
export const HD_VOICES = [
  { id: "en_US-hfc_female-medium", label: "US female (hfc_female)" },
  { id: "en_US-lessac-medium", label: "US female (lessac)" },
  { id: "en_US-amy-medium", label: "US female (amy)" },
  { id: "en_US-ryan-medium", label: "US male (ryan)" },
  { id: "en_US-joe-medium", label: "US male (joe)" },
  { id: "en_GB-alba-medium", label: "British female (alba)" },
] as const;
export const HD_MB = 63;
export const VOICE_ID_RE = /^[a-z]{2}_[A-Z]{2}-[a-z0-9_]+-(x_low|low|medium|high)$/;

const fake = (): any => (process.env.NODE_ENV !== "production" && typeof globalThis !== "undefined" ? (globalThis as any).__pacerHdFake : undefined); // test hook, never in production builds
let mod: any = null;
const lib = async () => (mod ??= await import("@mintplex-labs/piper-tts-web"));

export const hdSupported = () => !!fake() || (typeof navigator !== "undefined" && !!(navigator as any).storage?.getDirectory && typeof WebAssembly === "object");

const HF = "https://huggingface.co/diffusionstudio/piper-voices/resolve/main";
/** "en_US-hfc_female-medium" -> "en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx" (the Piper voices repository layout). */
export function voicePath(id: string): string { const m = /^([a-z]{2})_([A-Z]{2})-(.+)-(x_low|low|medium|high)$/.exec(id); if (!m) throw new Error("bad voice id"); return `${m[1]}/${m[1]}_${m[2]}/${m[3]}/${m[4]}/${id}.onnx`; }
const names = (id: string) => [`${id}.onnx.json`, `${id}.onnx`]; // the small file first
const opfsDir = async (create: boolean) => (await (navigator as any).storage.getDirectory()).getDirectoryHandle("piper", { create });

// Writing to the on-device cache from a worker with a sync access handle works in every browser that has OPFS (Safari too), unlike createWritable on the main thread.
const WRITER = `let h, at = 0; onmessage = async (e) => { const m = e.data; try {
  if (m.op === "open") { const root = await navigator.storage.getDirectory(), dir = await root.getDirectoryHandle("piper", { create: true }), f = await dir.getFileHandle(m.name, { create: true }); h = await f.createSyncAccessHandle(); h.truncate(0); at = 0; postMessage({ op: "opened" }); }
  else if (m.op === "chunk") { const u = new Uint8Array(m.buf); h.write(u, { at }); at += u.byteLength; postMessage({ op: "ack" }); }
  else if (m.op === "close") { h.flush(); h.close(); postMessage({ op: "closed", size: at }); } } catch (err) { postMessage({ op: "error", message: String(err && err.message || err) }); } };`;
export type Writer = { write: (u8: Uint8Array) => Promise<void>; close: () => Promise<number>; abort: () => void };
export async function openWriter(name: string): Promise<Writer> {
  const url = URL.createObjectURL(new Blob([WRITER], { type: "text/javascript" })), w = new Worker(url); let pending: { ok: (m: any) => void; no: (e: Error) => void } | null = null;
  w.onmessage = (e) => { const m = e.data; if (m.op === "error") pending?.no(new Error(m.message)); else pending?.ok(m); pending = null; }; w.onerror = (e) => { pending?.no(new Error(e.message || "worker failed")); pending = null; };
  const call = (msg: any, transfer: Transferable[] = []) => new Promise<any>((ok, no) => { pending = { ok, no }; w.postMessage(msg, transfer); });
  const end = () => { w.terminate(); URL.revokeObjectURL(url); };
  try { await call({ op: "open", name }); } catch (e) { end(); throw e; }
  return { write: async (u8) => { const copy = u8.slice().buffer; await call({ op: "chunk", buf: copy }, [copy]); }, close: async () => { const m = await call({ op: "close" }); end(); return m.size as number; }, abort: end };
}
async function fetchToCache(url: string, name: string, onProgress?: (loaded: number, total: number) => void): Promise<void> {
  const res = await fetch(url); if (!res.ok || !res.body) throw new Error(`download failed (${res.status})`); const total = +(res.headers.get("Content-Length") || 0), reader = res.body.getReader(), out = await openWriter(name); let got = 0;
  try { for (;;) { const { done, value } = await reader.read(); if (done) break; await out.write(value); got += value.length; onProgress?.(got, total); } const size = await out.close(); if (size !== got || (total && got !== total)) throw new Error("the downloaded file is incomplete"); } catch (e) { out.abort(); throw e; }
}

export async function isStored(id: string): Promise<boolean> {
  const f = fake(); if (f) return !!f.stored;
  try { const d = await opfsDir(false); for (const n of names(id)) { const fh = await d.getFileHandle(n); if ((await fh.getFile()).size < 100) return false; } return true; } catch { return false; }
}
/** Download a voice into the on-device cache (awaited, size-checked, works on Safari). The library then finds the files and does not fetch them again. */
export async function download(id: string, onProgress: (frac: number) => void): Promise<void> {
  const f = fake(); if (f) { f.stored = true; onProgress(1); return; }
  const base = `${HF}/${voicePath(id)}`; if (!(await (navigator as any).storage.getDirectory())) throw new Error("no storage");
  try { await fetchToCache(`${base}.json`, `${id}.onnx.json`); await fetchToCache(base, `${id}.onnx`, (l, t) => onProgress(t ? Math.min(1, l / t) : 0)); } catch (e) { await removeVoice(id); throw e; }
}
export async function removeVoice(id: string): Promise<void> {
  session = null; const f = fake(); if (f) { f.stored = false; return; }
  try { const d = await opfsDir(false); for (const n of names(id)) { try { await d.removeEntry(n); } catch { /* already gone */ } } } catch { /* nothing stored */ }
}
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") (window as any).__pacerHdTools = { openWriter, voicePath }; // dev/test hook only

let session: { id: string; s: any } | null = null;
/** The runtime files are served by this site (copied into public/pacer-hd by scripts/copy-hd-assets.mjs), not fetched from cdnjs / jsdelivr. */
const SELF_HOSTED = { onnxWasm: "/pacer-hd/ort/", piperData: "/pacer-hd/piper_phonemize.data", piperWasm: "/pacer-hd/piper_phonemize.wasm" };
/** Load the voice into memory (a few seconds). Cheap to call again for the same voice. */
export async function prepare(id: string, onProgress?: (frac: number) => void): Promise<void> {
  if (session?.id === id || fake()) return; const t = await lib();
  session = { id, s: await t.TtsSession.create({ voiceId: id, wasmPaths: SELF_HOSTED, progress: (p: any) => onProgress?.(p?.total ? p.loaded / p.total : 0) }) };
}
const clean = (t: string) => t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, ", ").replace(/\s+/g, " ").trim();
/** Speak one segment: returns a blob URL for a WAV the audio element can play. The caller revokes it. */
export async function synthesize(text: string): Promise<string> {
  const f = fake(); if (f) return URL.createObjectURL(await f.synth(text));
  if (!session) throw new Error("voice not ready"); const wav: Blob = await session.s.predict(clean(text)); return URL.createObjectURL(wav);
}
