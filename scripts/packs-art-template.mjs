// Writes the current generated art as template sprite sheets (the exact layout the game loads) to public/arcade/packs/template/.
// Usage: node scripts/packs-art-template.mjs [--url http://localhost:3100]
import { chromium } from "playwright"; import fs from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }), p = await b.newPage({ viewport: { width: 1200, height: 800 } });
await p.goto(arg("url", "http://localhost:3100") + "/arcade/packs?art=1", { waitUntil: "networkidle" }); await p.click("[role=tab]:nth-child(6)"); await p.click("text=MAKE SHEETS"); await p.waitForSelector("a[download='cards.png']");
for (const f of ["cards.png", "packs.png"]) { const href = await p.getAttribute(`a[download='${f}']`, "href"); fs.writeFileSync(`public/arcade/packs/template/${f}`, Buffer.from(href.split(",")[1], "base64")); }
await b.close(); console.log("wrote public/arcade/packs/template/{cards,packs}.png");
