// Loader for the HD voice (Piper running in the browser). The library and its WebAssembly are only fetched when someone turns the HD voice on.
// Files come from huggingface.co (the voice), cdnjs.cloudflare.com (onnx runtime) and cdn.jsdelivr.net (phonemizer). No reading text is ever sent anywhere: synthesis runs on the device.
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
/** Safari on iPhone/iPad can read the on-device voice cache but older versions cannot write it, so the voice would be downloaded again each visit. */
export const canCacheVoice = () => !!fake() || (typeof (globalThis as any).FileSystemFileHandle !== "undefined" && "createWritable" in (globalThis as any).FileSystemFileHandle.prototype);

export async function isStored(id: string): Promise<boolean> { const f = fake(); if (f) return !!f.stored; try { return (await (await lib()).stored()).includes(id); } catch { return false; } }
export async function download(id: string, onProgress: (frac: number) => void): Promise<void> { const f = fake(); if (f) { f.stored = true; onProgress(1); return; } await (await lib()).download(id, (p: any) => onProgress(p?.total ? Math.min(1, p.loaded / p.total) : 0)); }
export async function removeVoice(id: string): Promise<void> { session = null; if (fake()) { fake().stored = false; return; } try { await (await lib()).remove(id); } catch { /* ignore */ } }

let session: { id: string; s: any } | null = null;
/** Load the voice into memory (a few seconds). Cheap to call again for the same voice. */
export async function prepare(id: string, onProgress?: (frac: number) => void): Promise<void> {
  if (session?.id === id || fake()) return; const t = await lib();
  session = { id, s: await t.TtsSession.create({ voiceId: id, progress: (p: any) => onProgress?.(p?.total ? p.loaded / p.total : 0) }) };
}
const clean = (t: string) => t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, ", ").replace(/\s+/g, " ").trim();
/** Speak one segment: returns a blob URL for a WAV the audio element can play. The caller revokes it. */
export async function synthesize(text: string): Promise<string> {
  const f = fake(); if (f) return URL.createObjectURL(await f.synth(text));
  if (!session) throw new Error("voice not ready"); const wav: Blob = await session.s.predict(clean(text)); return URL.createObjectURL(wav);
}
