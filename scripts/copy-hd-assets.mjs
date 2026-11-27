// Copies the HD voice runtime (the onnx runtime WebAssembly that ships with transformers.js, and Kokoro's voice files) out of node_modules into public/pacer-hd/,
// so the site serves them itself instead of the browser fetching them from a CDN. Runs before dev and build (see package.json); the output is not committed.
import fs from "node:fs";
const VOICES = ["af_heart", "af_bella", "af_nicole", "bf_emma", "am_michael", "bm_fable", "bm_george"]; // keep in step with HD_VOICES in components/pacer/hdVoice.ts
const T = "node_modules/@huggingface/transformers/dist";
const jobs = [
  [`${T}/ort-wasm-simd-threaded.jsep.mjs`, "public/pacer-hd/ort/ort-wasm-simd-threaded.jsep.mjs"],
  [`${T}/ort-wasm-simd-threaded.jsep.wasm`, "public/pacer-hd/ort/ort-wasm-simd-threaded.jsep.wasm"],
  ...VOICES.map((v) => [`node_modules/kokoro-js/voices/${v}.bin`, `public/pacer-hd/kokoro/voices/${v}.bin`]),
];
let ok = 0;
for (const [from, to] of jobs) {
  if (!fs.existsSync(from)) { console.warn(`copy-hd-assets: ${from} is missing (run npm install); the HD voice will not load`); continue; }
  fs.mkdirSync(to.replace(/\/[^/]+$/, ""), { recursive: true });
  if (!fs.existsSync(to) || fs.statSync(to).size !== fs.statSync(from).size) fs.copyFileSync(from, to); ok++;
}
console.log(`copy-hd-assets: ${ok}/${jobs.length} files ready in public/pacer-hd`);
