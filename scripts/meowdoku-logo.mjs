// Writes the Meowdoku logo (pixel art drawn in code, 384x384) to public/arcade/meowdoku-logo.png. Needs the app running.
// Usage: node scripts/meowdoku-logo.mjs [--url http://localhost:3100]
import { chromium } from "playwright"; import fs from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }), p = await b.newPage();
await p.goto(arg("url", "http://localhost:3100") + "/arcade/meowdoku?logo=1", { waitUntil: "networkidle" }); await p.waitForSelector("a[download='meowdoku-logo.png']");
const href = await p.getAttribute("a[download='meowdoku-logo.png']", "href"); fs.writeFileSync("public/arcade/meowdoku-logo.png", Buffer.from(href.split(",")[1], "base64")); await b.close(); console.log("wrote public/arcade/meowdoku-logo.png");
