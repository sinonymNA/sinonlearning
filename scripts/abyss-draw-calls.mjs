// Counts canvas draw calls per frame for the Abyss home, the ocean and every themed scene. Run against a PRODUCTION build (npm run build && npx next start -p 3100).
// Budget: a themed scene should stay well under the ocean (~950 fillRect/frame). Usage: node scripts/abyss-draw-calls.mjs [--url http://localhost:3100]
import { chromium } from "playwright";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100");
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
async function count(name,url,wait){
  const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2})).newPage();
  await p.addInitScript(()=>{ const P=CanvasRenderingContext2D.prototype; window.__c={fillRect:0,arc:0,fill:0,fillStyle:0,drawImage:0,stroke:0,frames:0,t:0}; const wrap=(n)=>{const o=P[n]; P[n]=function(...a){window.__c[n]++; return o.apply(this,a)}}; ["fillRect","arc","fill","drawImage","stroke","ellipse"].forEach(n=>{window.__c[n]=0; wrap(n)}); const d=Object.getOwnPropertyDescriptor(P,"fillStyle"); Object.defineProperty(P,"fillStyle",{set(v){window.__c.fillStyle++; d.set.call(this,v)},get(){return d.get.call(this)}}); const raf=window.requestAnimationFrame.bind(window); window.requestAnimationFrame=(f)=>raf((t)=>{window.__c.frames++; f(t)}); });
  await p.goto(BASE+url,{waitUntil:"networkidle"}); await p.waitForSelector(wait,{timeout:20000}); await p.waitForTimeout(1500);
  await p.evaluate(()=>{for(const k in window.__c)window.__c[k]=0}); await p.waitForTimeout(3000);
  const c=await p.evaluate(()=>window.__c); const f=Math.max(1,c.frames);
  console.log(name.padEnd(12),"per frame -> fillRect",Math.round(c.fillRect/f),"fillStyle sets",Math.round(c.fillStyle/f),"arc",Math.round(c.arc/f),"drawImage",Math.round(c.drawImage/f),"frames/3s",c.frames);
  await p.close();
}
await count("abyss home","/arcade/abyss",".px-title");
await count("ocean daily","/arcade/abyss/play?mode=daily",".px-prompt");
for(const th of ["movies","sports","music","tv","games"]) await count(th,`/arcade/abyss/play?mode=theme&theme=${th}`,".px-prompt");
await b.close();
