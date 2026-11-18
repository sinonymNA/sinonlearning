#!/usr/bin/env node
/**
 * Integration test against REAL Margins accounts + PostgreSQL (no dev-auth shortcut).
 *   DATABASE_URL=postgres://... ARCADE_DEV_EMAILS=teacher.lab@example.com npx next dev -p 3100
 *   DATABASE_URL=postgres://... node scripts/arcade-e2e-accounts.mjs --url http://localhost:3100
 * Verifies: teacher-only hosting, student/guest rejection, developer-lab gating, persistent content sets,
 * server-side coin awards, atomic duplicate-safe pack opening (incl. concurrent identical requests),
 * collection persistence, and delete-my-data.
 */
import pg from "pg";

const BASE = process.argv.includes("--url") ? process.argv[process.argv.indexOf("--url") + 1] : "http://localhost:3100";
const fails = []; const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fails.push(msg); };
const stamp = Date.now();

async function signup(role, email) {
  const r = await fetch(`${BASE}/api/margins/auth/signup`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: "correct-horse-1", name: `${role} ${stamp}`, role }) });
  const j = await r.json(); if (!r.ok) throw new Error(`signup ${role}: ${j.error}`);
  return { cookie: r.headers.getSetCookie().map((c) => c.split(";")[0]).join("; "), user: j.user };
}
async function call(path, body, who) {
  const r = await fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/json", ...(who ? { cookie: who.cookie } : {}) }, body: JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}

const teacher = await signup("teacher", `teacher.${stamp}@example.com`);
const labTeacher = await signup("teacher", "teacher.lab@example.com").catch(async () => { const r = await fetch(`${BASE}/api/margins/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "teacher.lab@example.com", password: "correct-horse-1" }) }); return { cookie: r.headers.getSetCookie().map((c) => c.split(";")[0]).join("; "), user: (await r.json()).user }; });
const student = await signup("student", `student.${stamp}@example.com`);
console.log("accounts created through the real Margins signup route");

// --- hosting authorization ---
check((await call("/api/arcade", { type: "create", playlist: ["hot_potato"] })).status === 403, "guest cannot host (403)");
check((await call("/api/arcade", { type: "create", playlist: ["hot_potato"] }, student)).status === 403, "student cannot host (403)");
const created = await call("/api/arcade", { type: "create", playlist: ["last_one_standing"] }, teacher);
check(created.status === 200 && created.json.code?.length === 6, `teacher can host (code ${created.json.code})`);
const code = created.json.code;
check((await call("/api/arcade", { type: "host", code, cmd: "start" }, student)).status === 403, "student cannot control the room");
check((await call("/api/arcade", { type: "host", code, cmd: "start" }, labTeacher)).status === 403, "another teacher cannot control the room");
check((await call("/api/arcade", { type: "poll", code, host: true })).status === 403, "guest cannot open the host view");

// --- developer lab gating ---
check((await call("/api/arcade/dev", { type: "create" }, teacher)).status === 403, "ordinary teacher is not a developer (ARCADE_DEV_EMAILS set)");
check((await call("/api/arcade/dev", { type: "create" }, student)).status === 403, "student blocked from developer lab");
check((await call("/api/arcade/dev", { type: "create" })).status === 403, "guest blocked from developer lab");
const lab = await call("/api/arcade/dev", { type: "create", playlist: ["hot_potato"], bots: 5, timeScale: 0.1 }, labTeacher);
check(lab.status === 200, "listed developer can create a test room");

// --- persistent teacher content ---
const q = Array.from({ length: 6 }, (_, i) => ({ q: `Persistent question ${i}?`, choices: ["a", "b", "c"], answer: 1 }));
const saved = await call("/api/arcade/content", { type: "save", title: "Unit 9", items: { questions: q } }, teacher);
check(saved.status === 200 && saved.json.compatibility.last_one_standing.ok, "content set saved to PostgreSQL and compatible with Last One Standing");
check((await call("/api/arcade/content", { type: "get", id: saved.json.id }, labTeacher)).status === 404, "other teachers cannot read it");
check((await call("/api/arcade/content", { type: "list" }, student)).status === 403, "students cannot manage content");
const withSet = await call("/api/arcade", { type: "create", playlist: ["last_one_standing"], contentSetId: saved.json.id }, teacher);
check(withSet.status === 200, "room created with the teacher's content set");

// --- coins: awarded by the server when a signed-in student plays ---
const join = await call("/api/arcade", { type: "join", code: lab.json.code, nickname: "SignedKid" }, student);
check(join.status === 200 && join.json.playerId, "signed-in student joins a room (identity linked server-side)");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL }); await db.connect();
const me0 = await call("/api/arcade/economy", { type: "me" }, student);
check(me0.json.signedIn && me0.json.coins === 0, "wallet starts at 0 coins");
// finish a real game: lab room (5 bots + student) is a "test" room that still pays real players
await call("/api/arcade/dev", { type: "host", code: lab.json.code, cmd: "start" }, labTeacher);
for (let i = 0; i < 400; i++) { const s = await call("/api/arcade/dev", { type: "state", code: lab.json.code }, labTeacher); if (s.json.view.phase === "results" || s.json.view.phase === "final") break; await new Promise((r) => setTimeout(r, 1000)); }
const me1 = await call("/api/arcade/economy", { type: "me" }, student);
check(me1.json.coins >= 10, `student earned coins from playing (${me1.json.coins})`);
const guestJoin = await call("/api/arcade", { type: "join", code: lab.json.code, nickname: "GuestKid" });
check(guestJoin.status === 200 || guestJoin.status === 400, "guest join path works");

// --- packs ---
check((await call("/api/arcade/economy", { type: "open_pack", requestId: "guest-request-0001" })).status === 403, "guest cannot open packs");
check((await call("/api/arcade/economy", { type: "open_pack", requestId: "req-poor-000001" }, student)).status === 400, "insufficient coins rejected");
await db.query(`UPDATE arcade_wallets SET coins = coins + 450 WHERE user_id = $1`, [student.user.id]); // seed so packs can be tested
const before = (await call("/api/arcade/economy", { type: "me" }, student)).json.coins;
const [a, b] = await Promise.all([call("/api/arcade/economy", { type: "open_pack", requestId: "req-concurrent-1" }, student), call("/api/arcade/economy", { type: "open_pack", requestId: "req-concurrent-1" }, student)]);
check(a.status === 200 && b.status === 200 && a.json.character.id === b.json.character.id, "two simultaneous identical requests return the same character");
const afterOne = (await call("/api/arcade/economy", { type: "me" }, student)).json.coins;
check(before - afterOne === 150, `...and charge exactly 150 coins once (${before} -> ${afterOne})`);
const again = await call("/api/arcade/economy", { type: "open_pack", requestId: "req-concurrent-1" }, student);
check(again.json.repeated === true && (await call("/api/arcade/economy", { type: "me" }, student)).json.coins === afterOne, "retrying the same request id never charges twice");
await call("/api/arcade/economy", { type: "open_pack", requestId: "req-second-0002" }, student);
const me2 = await call("/api/arcade/economy", { type: "me" }, student);
check(me2.json.owned.reduce((n, c) => n + c.count, 0) === 2, "collection persisted in PostgreSQL (2 characters)");
const { rows } = await db.query(`SELECT count(*)::int AS n FROM arcade_pack_opens WHERE user_id = $1`, [student.user.id]);
check(rows[0].n === 2, "exactly two pack-open records exist");
const owned = me2.json.owned[0].id;
const joinOwned = await call("/api/arcade", { type: "join", code: withSet.json.code, nickname: "Fancy", avatar: owned }, student);
check(joinOwned.json.avatar === owned, "an owned collectible can be used as an avatar");
const joinFake = await call("/api/arcade", { type: "join", code: withSet.json.code, nickname: "Faker", avatar: "c-ember" }, guestJoin.status === 200 ? undefined : undefined);
check(joinFake.json.avatar === "rk-sun", "guests cannot use unowned collectibles");

// --- deletion control ---
await call("/api/arcade/economy", { type: "delete_my_data" }, student);
const me3 = await call("/api/arcade/economy", { type: "me" }, student);
check(me3.json.coins === 0 && me3.json.owned.length === 0, "delete-my-data wipes coins and collection");
await db.end();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASSED");
process.exit(fails.length ? 1 : 0);
