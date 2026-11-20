// Browser smoke test for Abyss themed dives + the daily dive. Usage: node scripts/abyss-theme-e2e.mjs [--url http://localhost:3100] [--shots dir]
import { chromium } from "playwright";
import * as AB from "../arcade-server/abyss.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100"), SH = arg("shots", "/tmp");
const byText=new Map(AB.PROMPTS.map(p=>[p.prompt,p]));
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const errs=[]; const out={};
async function play(url, tag, tier){
  const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2})).newPage();
  p.on("pageerror",e=>errs.push(tag+" "+e.message)); p.on("console",m=>{if(m.type()==="error")errs.push(tag+" "+m.text())});
  await p.goto(url,{waitUntil:"networkidle"});
  let n=0;
  for(let i=0;i<7;i++){
    await p.waitForSelector(".px-prompt",{timeout:15000}); const text=(await p.locator(".px-prompt").innerText()).trim();
    const pr=byText.get(text); if(!pr){ errs.push(tag+" unknown prompt "+text); break; }
    await p.waitForSelector(".px-input",{timeout:15000});
    const ans=pr.tiers[i%2?tier:"shoal"][0].split("=")[0];
    await p.fill(".px-input",ans); await p.click("text=LOCK IN");
    await p.waitForSelector(".px-banner",{timeout:20000}); n++;
    if(i===1) { await p.waitForTimeout(500); await p.screenshot({path:`${SH}/dive-${tag}-reveal.png`}); }
    const hud=await p.locator(".px-stat").first().innerText(); if(i===1) out[tag+"_hud"]=hud.replace(/\\n/g," ");
    if(i<6) await p.click("text=NEXT PROMPT"); else await p.click("text=SEE YOUR DIVE");
  }
  await p.waitForSelector(".px-donecard",{timeout:15000}); await p.waitForTimeout(500); await p.screenshot({path:`${SH}/dive-${tag}-done.png`});
  out[tag]=(await p.locator(".px-donecard").innerText()).replace(/\n+/g," | ").slice(0,160); out[tag+"_n"]=n;
  await p.close();
}
await play(`${BASE}/arcade/abyss/play?mode=theme&theme=music`,"music","trench");
await play(`${BASE}/arcade/abyss/play?mode=daily`,"daily","pearl");
// home sheet
const h=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2})).newPage();
h.on("pageerror",e=>errs.push("home "+e.message));
await h.goto(`${BASE}/arcade/abyss`,{waitUntil:"networkidle"}); await h.waitForSelector("text=THEMED DIVES"); await h.screenshot({path:`${SH}/home.png`});
await h.click("text=THEMED DIVES"); await h.waitForSelector(".th-card"); await h.waitForTimeout(400); await h.screenshot({path:`${SH}/home-themes.png`});
out.cards=await h.locator(".th-card").count();
console.log(JSON.stringify(out,null,1)); console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no console/page errors"); await b.close(); process.exit(errs.length ? 1 : 0);
