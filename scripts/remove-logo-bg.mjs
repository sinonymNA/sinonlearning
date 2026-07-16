import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, "../public/assets/capsule/logo.png");

const { data, info } = await sharp(logoPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const buf = new Uint8Array(data);

function isBg(idx) {
  if (buf[idx + 3] < 10) return true;
  return buf[idx] > 190 && buf[idx + 1] > 190 && buf[idx + 2] > 190;
}

const visited = new Uint8Array(width * height);
const queue = [];

function enqueue(x, y) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const i = y * width + x;
  if (visited[i]) return;
  const idx = i * channels;
  if (!isBg(idx)) return;
  visited[i] = 1;
  queue.push(i);
}

// Seed from all 4 edges
for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }

let head = 0;
while (head < queue.length) {
  const i = queue[head++];
  const x = i % width;
  const y = Math.floor(i / width);
  const idx = i * channels;
  buf[idx + 3] = 0; // make transparent
  enqueue(x - 1, y);
  enqueue(x + 1, y);
  enqueue(x, y - 1);
  enqueue(x, y + 1);
}

await sharp(Buffer.from(buf), { raw: { width, height, channels } })
  .png()
  .toFile(logoPath);

console.log(`Done. Removed background from logo.png (${width}x${height})`);
