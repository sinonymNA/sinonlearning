#!/usr/bin/env node
/**
 * Arcade network load test: N independent HTTP clients (default 35) against a RUNNING server.
 * Each client is its own async "device": it joins with its own credentials, polls its private state at
 * a realistic interval and plays by reading its own view and sending actions over HTTP. This is a real
 * network test (separate process, real sockets) - it is NOT 35 objects in one browser.
 *
 * Usage:
 *   ARCADE_DEV_AUTH=1 npm run dev          # in one terminal (dev-only test identity)
 *   node scripts/arcade-load-test.mjs --url http://localhost:3000 --clients 35 --games all
 *
 * Options: --url, --clients, --games hot_potato,quick_draw,...|all, --poll-ms 900, --max-seconds 900, --teacher-id
 * Teacher identity: the dev-only cookie `arcade_dev_auth` (needs a server started with ARCADE_DEV_AUTH=1
 * and NODE_ENV != production), or pass --cookie "margins_session=..." for a real teacher session.
 */
import { performance } from "node:perf_hooks";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith("--") ? [...acc, [a.slice(2), arr[i + 1]?.startsWith("--") || arr[i + 1] === undefined ? "true" : arr[i + 1]]] : acc), []));
const BASE = (args.url ?? "http://localhost:3000").replace(/\/$/, "");
const CLIENTS = Number(args.clients ?? 35);
const ALL = ["hot_potato", "last_one_standing", "quick_draw", "telephone", "imposter"];
const GAMES = !args.games || args.games === "all" ? ALL : String(args.games).split(",");
const POLL = Number(args["poll-ms"] ?? 900);
const MAX_MS = Number(args["max-seconds"] ?? 900) * 1000;
const cookie = args.cookie ?? `arcade_dev_auth=${encodeURIComponent(`teacher:${args["teacher-id"] ?? "loadtest-teacher"}:Load Test`)}`;

// Dictionary for the Hot Potato clients (read from the engine's data file).
const here = dirname(fileURLToPath(import.meta.url));
const wordsSrc = readFileSync(join(here, "../arcade-server/data/words.mjs"), "utf8");
const WORDS = wordsSrc.slice(wordsSrc.indexOf('"') + 1, wordsSrc.lastIndexOf('"')).split(" ");
const wordsFor = (seq) => WORDS.filter((w) => w.length <= 9 && w.length > seq.length && w.includes(seq.toLowerCase())).slice(0, 300);

const stats = { requests: 0, errors: 0, httpErrors: {}, latencies: [], actions: 0, rejected: 0 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (a) => a[Math.floor(Math.random() * a.length)];

async function call(body, { teacher = false, ip } = {}) {
  const t0 = performance.now();
  stats.requests++;
  try {
    const res = await fetch(`${BASE}/api/arcade`, { method: "POST", headers: { "content-type": "application/json", ...(teacher ? { cookie } : {}), "x-forwarded-for": ip ?? "10.1.1.1" }, body: JSON.stringify(body) });
    stats.latencies.push(performance.now() - t0);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { stats.httpErrors[res.status] = (stats.httpErrors[res.status] ?? 0) + 1; const e = new Error(json.error ?? `HTTP ${res.status}`); e.status = res.status; throw e; }
    return json;
  } catch (e) { if (!e.status) stats.errors++; throw e; }
}

class Client {
  constructor(i, code) { this.i = i; this.code = code; this.cursor = {}; this.acted = new Set(); this.doodle = 0; }
  async join() {
    const d = await call({ type: "join", code: this.code, nickname: `Load${String(this.i).padStart(2, "0")}`, avatar: "rk-moon" }, { ip: `10.2.${Math.floor(this.i / 250)}.${this.i % 250}` });
    this.id = d.playerId; this.token = d.token;
  }
  async poll() {
    const d = await call({ type: "poll", code: this.code, playerId: this.id, token: this.token, opts: this.cursor }, { ip: `10.2.0.${this.i}` });
    this.view = d.view; return d.view;
  }
  async act(action, key) {
    if (key) { if (this.acted.has(key)) return; this.acted.add(key); }
    stats.actions++;
    try { const d = await call({ type: "act", code: this.code, playerId: this.id, token: this.token, action, opts: this.cursor }, { ip: `10.2.0.${this.i}` }); this.view = d.view; }
    catch { stats.rejected++; }
  }
  async step() {
    const v = await this.poll();
    const g = v.game; if (v.phase !== "playing" || !g) return;
    switch (g.kind) {
      case "hot_potato": {
        const grp = g.group; if (!grp || grp.status !== "live") return;
        if (grp.you?.holder) { await sleep(300 + Math.random() * 1500); const w = pick(wordsFor(grp.sequence)); if (w) await this.act({ type: "word", word: w, turn: grp.turn }, `hp${grp.id}:${grp.turn}`); }
        break;
      }
      case "last_one_standing": {
        if (g.phase !== "question" || g.you?.answered || !g.question) return;
        await sleep(200 + Math.random() * 3500); await this.act({ type: "answer", choice: Math.floor(Math.random() * g.question.choices.length) }, `los${g.asked}`);
        break;
      }
      case "quick_draw": {
        const grp = g.group; if (!grp || grp.status !== "draw") return;
        if (grp.draw) this.cursor = { draw: { key: grp.draw.key, from: grp.draw.from + grp.draw.segs.length } };
        if (grp.you?.artist) { const k = `qd${grp.key ?? grp.draw.key}`; if (!this.acted.has(k)) { this.acted.add(k); for (let n = 0; n < 4; n++) { await this.act({ type: "draw", segs: [{ k: n + 1, t: 0, c: n, w: 1, p: [100 + n * 90, 100, 300 + n * 40, 400, 500 + n * 60, 150] }] }); await sleep(600); } } }
        else if (!grp.you?.guessed) { await sleep(500 + Math.random() * 4000); await this.act({ type: "guess", text: pick(["cat", "house", "tree", "sun", "dog"]) }); }
        break;
      }
      case "telephone": {
        const grp = g.group; if (!grp) return;
        if (grp.status === "vote" && g.vote && !g.vote.voted) { const opts = g.vote.options.filter((o) => !o.mine); await this.act({ type: "vote", chain: pick(opts).ci }, `tv${grp.id}`); return; }
        const task = g.task; if (!task || task.done) return;
        const key = task.key;
        if (task.kind === "draw") { if (!this.acted.has(key)) { this.acted.add(key); await this.act({ type: "draw", segs: [{ k: 1, t: 0, c: 2, w: 1, p: [50, 50, 400, 300, 700, 90] }, { k: 2, t: 0, c: 4, w: 2, p: [100, 500, 600, 520] }] }); await sleep(1000 + Math.random() * 4000); await this.act({ type: "done" }); } }
        else { await sleep(500 + Math.random() * 3000); await this.act({ type: "describe", text: pick(["a funny blob", "two triangles", "a sleepy cloud"]) }, key); }
        break;
      }
      case "imposter": {
        const grp = g.group; if (!grp) return;
        const k = `${grp.phase}:${grp.turn}:${grp.vote?.runoff?.length ?? 0}`;
        if (grp.phase === "ask" && grp.questioner === this.id) { await sleep(500 + Math.random() * 3000); await this.act({ type: "question", text: pick(["What would you bring here?", "What might you hear here?", "Who would you invite?"]) }, k); }
        else if (grp.phase === "answer" && !grp.you?.answered) { await sleep(500 + Math.random() * 6000); await this.act({ type: "answer", text: pick(["probably snacks", "a towel", "good vibes", "my friend"]) }, k); }
        else if ((grp.phase === "vote" || grp.phase === "runoff") && !grp.you?.voted) { const pool = (grp.vote.runoff ?? grp.members.map((m) => m.id)).filter((id) => id !== this.id); await sleep(500 + Math.random() * 4000); await this.act({ type: "vote", target: pick(pool) }, k); }
        else if (grp.phase === "guess" && grp.you?.role === "imposter") await this.act({ type: "guess", text: pick(["beach", "school", "pizza"]) }, k);
        break;
      }
    }
  }
  async run(stopAt) { while (performance.now() < stopAt && !this.stop) { try { await this.step(); } catch (e) { if (e.status === 401 || e.status === 404) return; } await sleep(POLL * (0.85 + Math.random() * 0.3)); } }
}

const pct = (arr, p) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };

async function main() {
  console.log(`Arcade load test: ${CLIENTS} independent clients -> ${BASE}  games=${GAMES.join(",")}`);
  const created = await call({ type: "create", playlist: GAMES }, { teacher: true });
  const code = created.code; console.log(`room ${code} created by teacher`);
  const clients = Array.from({ length: CLIENTS }, (_, i) => new Client(i, code));
  await Promise.all(clients.map((c) => c.join()));
  const lobby = await call({ type: "poll", code, host: true }, { teacher: true });
  console.log(`joined: ${lobby.view.players.length}/${CLIENTS} players in lobby`);
  if (lobby.view.players.length !== CLIENTS) throw new Error("not all clients joined");
  const deadline = performance.now() + MAX_MS;
  const loops = clients.map((c) => c.run(deadline));
  await call({ type: "host", code, cmd: "start" }, { teacher: true });
  const seen = new Set(); const started = performance.now(); let final = null;
  while (performance.now() < deadline) {
    await sleep(2000);
    const s = (await call({ type: "poll", code, host: true }, { teacher: true })).view;
    const tag = `${s.phase}:${s.gameIndex}`;
    if (!seen.has(tag)) { seen.add(tag); console.log(`[${((performance.now() - started) / 1000).toFixed(0)}s] ${s.phase}${s.gameId ? " " + s.gameId : ""}  (${s.players.filter((p) => p.connected).length} connected)`); }
    if (s.phase === "final" || s.phase === "ended") { final = s; break; }
  }
  clients.forEach((c) => { c.stop = true; });
  await Promise.allSettled(loops);
  const ok = !!final && final.history?.length === GAMES.length;
  console.log("\n===== RESULT =====");
  console.log(`session completed: ${ok ? "YES" : "NO"}  games played: ${final?.history?.length ?? 0}/${GAMES.length}  duration: ${((performance.now() - started) / 1000).toFixed(0)}s`);
  console.log(`clients: ${CLIENTS}  requests: ${stats.requests}  network errors: ${stats.errors}  http errors: ${JSON.stringify(stats.httpErrors)}`);
  console.log(`client actions sent: ${stats.actions}  (server-rejected as invalid/late: ${stats.rejected})`);
  console.log(`latency ms  p50 ${pct(stats.latencies, 50).toFixed(0)}  p95 ${pct(stats.latencies, 95).toFixed(0)}  p99 ${pct(stats.latencies, 99).toFixed(0)}  max ${Math.max(...stats.latencies).toFixed(0)}`);
  if (final) console.log("top 3:", final.leaderboard.sort((a, b) => b.total - a.total).slice(0, 3).map((p) => `${p.nickname}:${p.total}`).join("  "));
  process.exit(ok && stats.errors === 0 ? 0 : 1);
}
main().catch((e) => { console.error("LOAD TEST FAILED:", e.message); process.exit(1); });
