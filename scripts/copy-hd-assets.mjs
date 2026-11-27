// Copies the HD voice runtime (onnx runtime WebAssembly + Piper phonemizer) out of node_modules into public/pacer-hd/, so the site serves them itself
// instead of the browser fetching them from cdnjs and jsdelivr. Runs before dev and build (see package.json); the output is not committed.
import fs from "node:fs";
const jobs = [
  ["node_modules/onnxruntime-web/dist/ort-wasm-simd.wasm", "public/pacer-hd/ort/ort-wasm-simd.wasm"],
  ["node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm", "public/pacer-hd/ort/ort-wasm-simd-threaded.wasm"],
  ["node_modules/@diffusionstudio/piper-wasm/build/piper_phonemize.wasm", "public/pacer-hd/piper_phonemize.wasm"],
  ["node_modules/@diffusionstudio/piper-wasm/build/piper_phonemize.data", "public/pacer-hd/piper_phonemize.data"],
];
let ok = 0;
for (const [from, to] of jobs) {
  if (!fs.existsSync(from)) { console.warn(`copy-hd-assets: ${from} is missing (run npm install); the HD voice will not load`); continue; }
  fs.mkdirSync(to.replace(/\/[^/]+$/, ""), { recursive: true });
  if (!fs.existsSync(to) || fs.statSync(to).size !== fs.statSync(from).size) fs.copyFileSync(from, to); ok++;
}
console.log(`copy-hd-assets: ${ok}/${jobs.length} files ready in public/pacer-hd`);
