/// <reference lib="webworker" />
/* eslint-disable @typescript-eslint/no-explicit-any */
// Runs the Kokoro voice model off the main thread, so reading stays smooth while the next sentence is being made.
// The model file (about 90 MB) comes from huggingface.co once and is kept in the browser's cache; the runtime and the voice files are served by this site (/pacer-hd).
import { KokoroTTS } from "kokoro-js";
import { env } from "@huggingface/transformers";

const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
env.allowLocalModels = false; env.useBrowserCache = true;
const onnx: any = (env.backends as any).onnx; if (onnx?.wasm) { onnx.wasm.wasmPaths = "/pacer-hd/ort/"; onnx.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, self.navigator.hardwareConcurrency || 1) : 1; }

// the voice files (about half a megabyte each) are in the npm package; serve them from this site instead of fetching them from Hugging Face
const realFetch = self.fetch.bind(self);
self.fetch = ((input: any, init?: any) => { const u = typeof input === "string" ? input : input instanceof URL ? input.href : input?.url || ""; const m = /Kokoro-82M-v1\.0-ONNX\/resolve\/main\/voices\/([a-z_]+)\.bin/.exec(u); return m ? realFetch(`/pacer-hd/kokoro/voices/${m[1]}.bin`, init) : realFetch(input, init); }) as typeof fetch;

let tts: KokoroTTS | null = null;
const post = (m: any, t?: Transferable[]) => (self as any).postMessage(m, t || []);
self.onmessage = async (e: MessageEvent) => {
  const m = e.data;
  try {
    if (m.op === "init") {
      let total = 0, got = 0; const files = new Map<string, { l: number; t: number }>();
      tts = await KokoroTTS.from_pretrained(MODEL, { dtype: "q8", device: "wasm", progress_callback: (p: any) => { if (p?.status === "progress" && p.total) { files.set(p.file, { l: p.loaded, t: p.total }); total = 0; got = 0; files.forEach((f) => { total += f.t; got += f.l; }); post({ op: "progress", frac: total ? got / total : 0 }); } } } as any);
      post({ op: "ready" });
    } else if (m.op === "gen") {
      if (!tts) throw new Error("voice not loaded");
      const audio: any = await tts.generate(m.text, { voice: m.voice, speed: 1 } as any); post({ op: "audio", id: m.id, blob: audio.toBlob() });
    }
  } catch (err: any) { post({ op: "error", id: m.id, message: String(err?.message || err) }); }
};
