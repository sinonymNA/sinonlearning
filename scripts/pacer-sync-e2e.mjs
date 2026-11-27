// Account-sync check for Pacer. Needs the app running WITH a database:
//   DATABASE_URL=postgres://postgres:pw@localhost:54329/sinon npx next start -p 3100
// Usage: node scripts/pacer-sync-e2e.mjs [--url http://localhost:3100]
// Real signup/login, a phone context uploads a book, an iPad context resumes it; API edge cases checked over HTTP.
import { chromium, request } from "playwright";
import fs from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const URL_ = arg("url", "http://localhost:3100"), PAGE = URL_ + "/pacer";
const errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const stamp = Date.now(), email = `sync${stamp}@example.com`, other = `other${stamp}@example.com`, pw = "correct-horse-1";
const WORDS = "river stone morning window quiet garden bridge lantern harvest silver paper candle mountain whisper ladder meadow".split(" ");
const text = "Syncbook Title\n\n" + Array.from({ length: 30 }, (_, p) => Array.from({ length: 60 }, (_, i) => WORDS[(p * 5 + i * 3) % WORDS.length]).join(" ") + ".").join("\n\n");
fs.mkdirSync("/tmp/pacer-sync", { recursive: true }); fs.writeFileSync("/tmp/pacer-sync/syncbook.txt", text);

const signup = async (ctx, em) => ctx.request.post(URL_ + "/api/margins/auth/signup", { data: { email: em, password: pw, name: "Sync Tester", role: "student" }, headers: { origin: URL_ } });
const login = async (ctx, em) => ctx.request.post(URL_ + "/api/margins/auth/login", { data: { email: em, password: pw }, headers: { origin: URL_ } });

// signed out
{
  const ctx = await browser.newContext(), p = await ctx.newPage();
  const lib = await (await ctx.request.get(URL_ + "/api/pacer/library")).json();
  check(lib.user === null && lib.sync === true, "signed out: library says no user, sync available");
  check((await ctx.request.put(URL_ + "/api/pacer/progress", { data: { id: "abc", pos: 1, wpm: 200, at: Date.now() }, headers: { origin: URL_ } })).status() === 401, "signed out: progress write is 401");
  await p.goto(PAGE, { waitUntil: "networkidle" }); check(await p.locator(".pc-sync").count() === 1, "signed out: sign-in banner is shown");
  await ctx.close();
}
// phone: sign up, upload
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }), pp = await phone.newPage();
check((await signup(phone, email)).ok(), "phone: signup works");
await pp.goto(PAGE, { waitUntil: "networkidle" }); await pp.waitForSelector(".pc-sync.on");
check(await pp.locator(".pc-sync.on").innerText().then((t) => /Sync Tester/.test(t)), "phone: account bar shows the name");
await pp.setInputFiles("input[type=file]", "/tmp/pacer-sync/syncbook.txt"); await pp.waitForSelector(".pc-page .w", { timeout: 20000 });
await pp.waitForTimeout(1200);
await pp.click("[aria-label='Back to the library']"); await pp.waitForSelector(".pc-books");
check(/Synced/.test(await pp.locator(".pc-st").first().innerText()), "phone: book shows Synced after opening");
const meta = (await (await phone.request.get(URL_ + "/api/pacer/library")).json()).books;
check(meta.length === 1 && meta[0].words > 1500, "server: one book stored with word count");
const id = meta[0].id;
// move progress on the server directly (newest wins)
const t1 = Date.now() + 1000;
check((await (await phone.request.put(URL_ + "/api/pacer/progress", { data: { id, pos: 900, wpm: 420, at: t1 }, headers: { origin: URL_ } })).json()).applied === true, "progress: newer write applies");
check((await (await phone.request.put(URL_ + "/api/pacer/progress", { data: { id, pos: 10, wpm: 200, at: t1 - 500 }, headers: { origin: URL_ } })).json()).applied === false, "progress: older write is ignored");
check((await phone.request.put(URL_ + "/api/pacer/progress", { data: { id, pos: 5, wpm: 200, at: Date.now() + 5000 }, headers: { origin: "https://evil.example" } })).status() === 403, "cross-origin write is refused");
// iPad: fresh device, login, see + open book
const ipad = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true }), ip = await ipad.newPage();
check((await login(ipad, email)).ok(), "ipad: login works");
await ip.goto(PAGE, { waitUntil: "networkidle" }); await ip.waitForSelector(".pc-book");
const row = await ip.locator(".pc-book").first().innerText();
check(/syncbook/i.test(row) && /420 wpm/.test(row), "ipad: book appears with synced speed " + JSON.stringify(row));
check(/tap to download/.test(row), "ipad: marked as in-account, not yet on device");
await ip.click(".pc-book"); await ip.waitForSelector(".pc-page .w", { timeout: 20000 });
const scrub = Number(await ip.locator("input[type=range]").first().inputValue().catch(() => -1));
check(scrub >= 880 && scrub <= 920, `ipad: resumes at synced position (got ${scrub})`);
// other user cannot see/read
const o = await browser.newContext(); await signup(o, other);
check(((await (await o.request.get(URL_ + "/api/pacer/library")).json()).books || []).length === 0, "other user: library is empty");
check((await o.request.get(URL_ + `/api/pacer/books/${id}`)).status() === 404, "other user: book is 404");
check((await (await o.request.delete(URL_ + `/api/pacer/books/${id}`, { headers: { origin: URL_ } })).json()).ok === false, "other user: delete does nothing");
check(((await (await phone.request.get(URL_ + "/api/pacer/library")).json()).books).length === 1, "other user: book survived the delete attempt");
// bad upload
check((await phone.request.put(URL_ + "/api/pacer/books/zzz1", { data: { id: "zzz1", title: "x", chapters: "nope" }, headers: { origin: URL_ } })).status() >= 400, "bad book JSON is rejected");
// delete from account
check((await phone.request.delete(URL_ + `/api/pacer/books/${id}`, { headers: { origin: URL_ } })).ok(), "delete from account works");
check(((await (await phone.request.get(URL_ + "/api/pacer/library")).json()).books).length === 0, "library empty after delete");
// state sync
const st = await phone.request.put(URL_ + "/api/pacer/state", { data: { settings: { wpm: 333 }, sessions: [], at: Date.now() }, headers: { origin: URL_ } });
check(st.ok(), "state: settings saved");
await browser.close(); await (await request.newContext()).dispose();
console.log(ok.length + " ok"); if (errors.length) { console.log(errors.join("\n")); process.exit(1); } console.log("all passed");
