import { BaseGame } from "./base.mjs";
import { BOARD, CATEGORIES, CAT_IDS } from "../dacula/traced.mjs";
import { buildGraph, reachable, shortestPath, stillConnected } from "../dacula/graph.mjs";
import { DACULA_QUESTIONS } from "../data/daculaQuestions.mjs";
import { validateQuestion } from "../dacula/questionIO.mjs";
import { fail, partition } from "../util.mjs";

// DACULA DASH: a Trivial-Pursuit-style race around a stylised, hand-traced map of Dacula, Georgia.
// Roll, choose a route along real roads, answer for the colour wedge at each landmark, then race back to school and win the final question.
// Everything that matters is decided HERE (dice, reachable squares, answers, wedges, timers); clients only send intentions.
export const GRAPH = buildGraph(BOARD);
export const CHECKPOINTS = GRAPH.checkpoints;
const catName = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));

export const DD = {
  SESSION_MS: 20 * 60 * 1000, HOME_AT: 0.75, INTRO_MS: 4500, ROLL_MS: 12000, CHOOSE_MS: 22000, QUESTION_MS: 15000, RESULT_MS: 2600,
  MOVE_BASE: 500, MOVE_PER_STEP: 330, DIE: 6, MAX_BOOST: 2, OFFLINE_MS: 4000, BLOCK_ROUNDS: 2, BOARD_MAX: 6,
  POINTS: { correct: 10, wedge: 100, win: 300, place: [100, 50, 25] },
};
const mulberry = (seed) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const shuffleWith = (rnd, arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** One independent match (a class is split into boards of at most six players). */
export class Match {
  constructor(game, id, members, seed) {
    this.game = game; this.id = id; this.members = members; this.rnd = mulberry(seed);
    this.p = new Map(members.map((m, i) => [m, { pos: GRAPH.schoolNode, wedges: [], wedgeAt: {}, tokens: 0, green: 0, correct: 0, wrong: 0, steps: 0, color: i, lastWedgeAt: 0 }]));
    this.order = shuffleWith(this.rnd, members); this.idx = -1; this.cur = null; this.turnNo = 0;
    this.phase = "intro"; this.phaseEnds = 0; this.phaseStart = 0; this.roll = null; this.options = null; this.q = null; this.result = null; this.moving = null;
    this.blocked = []; this.feed = []; this.used = new Set(); this.winner = null; this.over = false; this.final = null; this.bell = false; this.offlineSince = null; this.startedAt = 0; this.endsAt = 0;
  }
  get cfg() { return this.game.cfg; }
  nick(id) { return this.game.nick(id); }
  say(text, kind = "info") { this.feed.push({ text, kind, turn: this.turnNo }); if (this.feed.length > 12) this.feed.shift(); }
  blockedKeys() { return this.blocked.map((b) => b.k); }
  setPhase(ph, t, ms) { this.phase = ph; this.phaseStart = t; this.phaseEnds = ms ? t + ms : 0; }

  begin(t) { this.startedAt = t; this.endsAt = t + this.cfg.sessionMs; this.say("The bell rings. Race to collect all six wedges!", "bell"); this.nextTurn(t); }

  here(id) { return this.game.here(id); }
  active() { return this.order.filter((id) => this.here(id)); }

  nextTurn(t) {
    if (this.over) return;
    const alive = this.active(); if (!alive.length) return this.finish(t, "empty");
    for (let i = 1; i <= this.order.length + 1; i++) { this.idx = (this.idx + 1) % this.order.length; if (this.here(this.order[this.idx])) break; }
    this.cur = this.order[this.idx]; this.turnNo++; this.offlineSince = null;
    this.blocked = this.blocked.filter((b) => b.until > this.turnNo);
    this.roll = null; this.options = null; this.q = null; this.result = null; this.moving = null;
    this.setPhase("roll", t, this.cfg.rollMs);
  }

  // ---- movement ------------------------------------------------------------------------------------------------
  /** Nodes where stopping early is allowed: this player's unclaimed checkpoints, and the school once all six wedges are held. */
  stopSet(pid) {
    const me = this.p.get(pid), s = new Set();
    for (const c of CHECKPOINTS) if (!me.wedges.includes(c.cat)) s.add(c.node);
    if (me.wedges.length === 6) s.add(GRAPH.schoolNode);
    return s;
  }
  /** Where a player is trying to get to: nearest unclaimed checkpoint, or school with all six. */
  targets(pid) { const me = this.p.get(pid); return me.wedges.length === 6 ? [GRAPH.schoolNode] : CHECKPOINTS.filter((c) => !me.wedges.includes(c.cat)).map((c) => c.node); }
  needsRetry(pid) { const me = this.p.get(pid); const cp = CHECKPOINTS.find((c) => c.node === me.pos); return (cp && !me.wedges.includes(cp.cat)) || (me.pos === GRAPH.schoolNode && me.wedges.length === 6); }

  doRoll(pid, a, t) {
    if (this.phase !== "roll" || pid !== this.cur) fail("It's not your turn to roll.");
    if (a.turn !== undefined && a.turn !== this.turnNo) fail("That turn already moved on.", "stale");
    const me = this.p.get(pid);
    const die = 1 + Math.floor(this.rnd() * DD.DIE);
    const boost = Math.max(0, Math.min(DD.MAX_BOOST, Math.floor(Number(a.boost) || 0), me.tokens));
    me.tokens -= boost; const green = me.green; me.green = 0;
    const steps = die + boost + green;
    const opts = reachable(GRAPH, me.pos, steps, { blocked: this.blockedKeys(), stopEarly: this.stopSet(pid) });
    if (this.needsRetry(pid)) opts.set(me.pos, [me.pos]);            // stay put and try the question again next time
    this.roll = { die, boost, green, steps };
    this.game.room.log("dacula_roll", { player: this.nick(pid), die, steps });
    if (!opts.size) { this.say(`${this.nick(pid)} rolled ${steps} but every road is closed!`); this.result = { pid, msg: "Road closed. Turn skipped." }; this.setPhase("result", t, this.cfg.resultMs); this.q = null; return; }
    this.options = opts; this.setPhase("choose", t, this.cfg.chooseMs);
  }

  doMove(pid, a, t) {
    if (this.phase !== "choose" || pid !== this.cur) fail("You can't move right now.");
    if (a.turn !== undefined && a.turn !== this.turnNo) fail("That turn already moved on.", "stale");
    const to = Math.floor(Number(a.to)); const path = this.options?.get(to);
    if (!path) fail("You can't get there with that roll.", "bad-move");
    this.applyMove(pid, path, t);
  }
  applyMove(pid, path, t) {
    const me = this.p.get(pid);
    me.pos = path.at(-1); me.steps += path.length - 1;
    const dur = path.length > 1 ? this.game.D(DD.MOVE_BASE + DD.MOVE_PER_STEP * (path.length - 1)) : this.game.D(500);
    this.moving = { pid, path, at: t, dur }; this.options = null; this.setPhase("moving", t, dur);
  }
  /** Best option by remaining distance to a target (used for idle/disconnected players and bots). */
  bestMove(pid) {
    if (!this.options) return null;
    const goals = this.targets(pid); let best = null;
    for (const [dest, path] of this.options) {
      let d = Infinity; for (const g of goals) { const sp = shortestPath(GRAPH, dest, g, this.blockedKeys()); if (sp) d = Math.min(d, sp.steps); }
      const score = d * 10 - path.length + (this.rnd() * 0.5); if (!best || score < best.score) best = { dest, path, score };
    }
    return best;
  }

  // ---- landing -------------------------------------------------------------------------------------------------
  landing(pid, t) {
    const me = this.p.get(pid), node = GRAPH.nodes[me.pos];
    const cp = CHECKPOINTS.find((c) => c.node === me.pos);
    if (cp && !me.wedges.includes(cp.cat)) return this.ask({ type: "checkpoint", cat: cp.cat, cp }, pid, t);
    if (me.pos === GRAPH.schoolNode && me.wedges.length === 6) return this.ask({ type: "final" }, pid, t);
    if (node.flavor === "question") return this.ask({ type: "bonus", cat: node.cat }, pid, t);
    if (node.flavor === "event") {
      const r = this.rnd();
      if (r < 0.34) { me.green = 2; this.say(`GREEN LIGHT! ${this.nick(pid)} gets +2 on the next roll.`, "event"); return this.endWithMessage(pid, "GREEN LIGHT! +2 on your next roll", t); }
      if (r < 0.67) return this.ask({ type: "shortcut", cat: CAT_IDS[Math.floor(this.rnd() * 6)] }, pid, t);
      const safe = GRAPH.edges.filter((e) => !e.blocked && !this.blocked.some((b) => b.k === e.k) && e.a !== GRAPH.schoolNode && e.b !== GRAPH.schoolNode && stillConnected(GRAPH, [...this.blockedKeys(), e.k]));
      if (this.blocked.length >= 1 || !safe.length) { me.green = 2; this.say(`GREEN LIGHT! ${this.nick(pid)} gets +2 on the next roll.`, "event"); return this.endWithMessage(pid, "GREEN LIGHT! +2 on your next roll", t); }
      const e = safe[Math.floor(this.rnd() * safe.length)];
      this.blocked.push({ k: e.k, until: this.turnNo + this.order.length * DD.BLOCK_ROUNDS, name: e.name });
      this.say(`ROAD CONSTRUCTION on ${e.name}! Take another route for a couple of rounds.`, "event");
      return this.endWithMessage(pid, `ROAD CONSTRUCTION on ${e.name}`, t);
    }
    const rivals = this.active().filter((o) => o !== pid && this.p.get(o).pos === me.pos && me.pos !== GRAPH.schoolNode);
    if (rivals.length) { this.say(`TRIVIA DUEL! ${this.nick(pid)} meets ${this.nick(rivals[0])}.`, "event"); return this.ask({ type: "duel", cat: CAT_IDS[Math.floor(this.rnd() * 6)], rival: rivals[0] }, pid, t); }
    return this.endWithMessage(pid, null, t);
  }
  endWithMessage(pid, msg, t) { this.q = null; this.result = { pid, msg }; this.setPhase("result", t, msg ? this.cfg.resultMs : 700); }

  // ---- questions -----------------------------------------------------------------------------------------------
  pickQuestion(kind) {
    const bank = this.game.bank;
    let pool = bank.filter((q) => !this.used.has(q.id) && (kind.type === "final" ? q.d >= 2 : kind.cat ? q.cat === kind.cat : true));
    if (!pool.length) { for (const q of bank) if (kind.cat ? q.cat === kind.cat : true) this.used.delete(q.id); pool = bank.filter((q) => (kind.type === "final" ? q.d >= 2 : kind.cat ? q.cat === kind.cat : true)); }
    if (!pool.length) pool = bank;
    // normal questions lean easy-to-medium; checkpoints a little harder; the final is medium/hard
    const want = kind.type === "final" ? 3 : kind.type === "checkpoint" ? 2 : 1;
    pool = pool.map((q) => ({ q, w: 1 + (q.d === want ? 2 : Math.abs(q.d - want) === 1 ? 1 : 0) }));
    let r = this.rnd() * pool.reduce((s, x) => s + x.w, 0); for (const x of pool) { r -= x.w; if (r <= 0) return x.q; }
    return pool[0].q;
  }
  ask(kind, pid, t) {
    const q = this.pickQuestion(kind); this.used.add(q.id);
    const choices = shuffleWith(this.rnd, [q.a, ...q.w]);
    const cat = kind.type === "final" ? q.cat : kind.cat;
    this.q = { kind: kind.type, cat, pid, text: q.q, choices, correct: choices.indexOf(q.a), expl: q.x ?? "", id: q.id, rival: kind.rival ?? null, endsAt: t + this.game.D(this.cfg.qMs), total: this.game.D(this.cfg.qMs), cp: kind.cp?.landmarkName ?? null };
    this.result = null; this.setPhase("question", t, this.cfg.qMs);
  }
  doAnswer(pid, a, t) {
    if (this.phase !== "question" || pid !== this.cur) fail("There's no question for you right now.");
    if (a.turn !== undefined && a.turn !== this.turnNo) fail("That question already closed.", "stale");
    if (t >= this.q.endsAt + this.game.D(250)) { this.resolve(pid, null, t); fail("Too late!", "late"); }
    const i = Math.floor(Number(a.index)); if (!Number.isInteger(i) || i < 0 || i > 3) fail("Pick one of the four answers.");
    this.resolve(pid, i, t);
  }
  resolve(pid, idx, t) {
    const me = this.p.get(pid), q = this.q, ok = idx === q.correct, add = (n) => this.game.add(pid, n);
    const award = {};
    if (ok) {
      me.correct++; add(DD.POINTS.correct);
      if (q.kind === "checkpoint") {
        me.wedges.push(q.cat); me.wedgeAt[q.cat] = t; me.lastWedgeAt = t; add(DD.POINTS.wedge); award.wedge = q.cat;
        this.say(`${this.nick(pid)} collected the ${catName[q.cat].toUpperCase()} wedge at ${q.cp}!`, "wedge");
        if (me.wedges.length === 6) this.say(`${this.nick(pid)} has ALL SIX wedges! Back to school!`, "wedge");
      } else if (q.kind === "final") { this.win(pid, t); award.win = true; }
      else {
        const lead = Math.max(...this.active().map((o) => this.p.get(o).wedges.length)); const catchUp = lead - me.wedges.length >= 2 ? 1 : 0;
        const n = (q.kind === "shortcut" ? 2 : 1) + catchUp; me.tokens += n; award.tokens = n; award.catchUp = !!catchUp;
        this.say(`${this.nick(pid)} earned ${n} bonus move${n > 1 ? "s" : ""}.`, "token");
      }
    } else { me.wrong++; if (q.kind === "checkpoint") this.say(`${this.nick(pid)} missed the ${catName[q.cat]} question. Try again next turn!`, "miss"); }
    this.result = { pid, correct: ok, picked: idx, answer: q.correct, expl: q.expl, kind: q.kind, cat: q.cat, award };
    this.game.room.log("dacula_answer", { player: this.nick(pid), kind: q.kind, correct: ok });
    this.setPhase("result", t, this.cfg.resultMs);
  }

  // ---- the end -------------------------------------------------------------------------------------------------
  win(pid, t) { this.winner = pid; this.game.add(pid, DD.POINTS.win); this.say(`${this.nick(pid)} wins DACULA DASH!`, "win"); this.final = { reason: "finished", at: t }; }
  /** Ranking: winner, then wedges, then correct answers ("challenge points"), then distance (spaces) back to school, then earliest final wedge. */
  rankings() {
    const rows = this.members.filter((m) => this.game.here(m) || this.p.get(m).wedges.length || this.p.get(m).correct).map((id) => {
      const me = this.p.get(id), back = shortestPath(GRAPH, me.pos, GRAPH.schoolNode, this.blockedKeys());
      return { id, win: id === this.winner, wedges: me.wedges.length, correct: me.correct, back: back ? back.steps : 99, backMetres: back ? back.metres : 9999, lastWedgeAt: me.wedgeAt && me.wedges.length ? me.lastWedgeAt : Infinity };
    });
    const cmp = (a, b) => (b.win - a.win) || (b.wedges - a.wedges) || (b.correct - a.correct) || (a.back - b.back) || (a.lastWedgeAt - b.lastWedgeAt);
    rows.sort(cmp);
    rows.forEach((r, i) => { r.rank = i && cmp(rows[i - 1], r) === 0 ? rows[i - 1].rank : i + 1; });
    return rows;
  }
  finish(t, reason) {
    if (this.over) return; this.over = true; this.setPhase("over", t, 0);
    this.final = { reason, at: t }; this.table = this.rankings();
    if (reason !== "finished") { this.say("TIME! The school bell rings: final standings by wedges.", "bell"); this.table.forEach((r) => { if (r.rank <= 3) this.game.add(r.id, DD.POINTS.place[r.rank - 1]); }); }
    else this.table.forEach((r) => { if (!r.win && r.rank <= 3) this.game.add(r.id, DD.POINTS.place[Math.min(2, r.rank - 1)] / 2); });
    this.game.room.log("dacula_end", { board: this.id, reason, winner: this.winner ? this.nick(this.winner) : null });
  }

  // ---- clock ---------------------------------------------------------------------------------------------------
  tick(t) {
    if (this.over) return;
    if (this.phase === "intro") { if (t >= this.phaseEnds) this.begin(t); return; }
    if (t >= this.endsAt && this.phase !== "question") return this.finish(t, "time");
    if (t >= this.endsAt + this.game.D(2500)) return this.finish(t, "time");
    if (!this.bell && t - this.startedAt >= this.cfg.sessionMs * DD.HOME_AT) { this.bell = true; this.say("HOME STRETCH! The bell rings: head for the school!", "bell"); }
    const cur = this.cur;
    if (cur && !this.here(cur) && this.phase !== "result" && this.phase !== "moving") { this.say(`${this.nick(cur)} left the game.`); return this.nextTurn(t); }
    const off = cur && this.here(cur) && !this.game.connected(cur);
    if (off) this.offlineSince ??= t; else this.offlineSince = null;
    const gone = off && t - this.offlineSince > this.game.D(DD.OFFLINE_MS);
    switch (this.phase) {
      case "roll": if (gone || t >= this.phaseEnds) this.doRoll(cur, {}, t); break;
      case "choose": if (gone || t >= this.phaseEnds) { const b = this.bestMove(cur); if (b) this.applyMove(cur, b.path, t); else this.nextTurn(t); } break;
      case "moving": if (t >= this.phaseEnds) this.landing(cur, t); break;
      case "question": if (gone || t >= this.q.endsAt + this.game.D(300)) this.resolve(cur, null, t); break;
      case "result": if (t >= this.phaseEnds) { if (this.winner) this.finish(t, "finished"); else this.nextTurn(t); } break;
    }
  }

  // ---- what clients see ----------------------------------------------------------------------------------------
  viewFor(pid, t) {
    const left = (x) => Math.max(0, Math.round(x - t));
    const names = (k) => { const e = GRAPH.edges.find((x) => x.k === k); return e ? e.name : ""; };
    const q = this.q ? { kind: this.q.kind, cat: this.q.cat, text: this.q.text, choices: this.q.choices, left: this.phase === "question" ? left(this.q.endsAt) : 0, total: this.q.total, cp: this.q.cp, rival: this.q.rival ? this.nick(this.q.rival) : null, mine: this.q.pid === pid } : null;
    const result = this.result ? { ...this.result, ...(this.result.correct !== undefined ? { right: this.q?.choices?.[this.result.answer], explanation: this.result.expl } : {}) } : null;
    if (result) { delete result.expl; }
    return {
      id: this.id, phase: this.phase, turn: this.turnNo, cur: this.cur, order: this.order, over: this.over, winner: this.winner,
      sessionLeft: this.over ? 0 : this.startedAt ? left(this.endsAt) : this.cfg.sessionMs, sessionTotal: this.cfg.sessionMs, homeStretch: this.bell, phaseLeft: this.phaseEnds ? left(this.phaseEnds) : 0, phaseTotal: this.phaseEnds ? this.phaseEnds - this.phaseStart : 0,
      players: this.members.map((id) => { const me = this.p.get(id); return { id, nickname: this.nick(id), avatar: this.game.room.players.get(id)?.avatar, color: me.color, pos: me.pos, wedges: [...me.wedges], tokens: me.tokens, green: me.green, correct: me.correct, steps: me.steps, connected: this.game.connected(id), gone: !this.here(id) }; }),
      roll: this.roll, moving: this.moving ? { pid: this.moving.pid, path: this.moving.path, elapsed: left(this.moving.at + this.moving.dur) === 0 ? this.moving.dur : t - this.moving.at, dur: this.moving.dur } : null,
      options: pid === this.cur && this.phase === "choose" && this.options ? [...this.options].map(([to, path]) => ({ to, path })) : null,
      blocked: this.blocked.map((b) => ({ k: b.k, name: names(b.k) })), q, result, feed: this.feed.slice(-8),
      table: this.over ? this.table : null, final: this.final,
      you: pid ? { cur: pid === this.cur, tokens: this.p.get(pid)?.tokens ?? 0, wedges: [...(this.p.get(pid)?.wedges ?? [])], retry: this.p.has(pid) ? this.needsRetry(pid) : false } : null,
    };
  }
}

export class DaculaDash extends BaseGame {
  start() {
    const o = this.room.settings?.dacula ?? {};
    const mins = Math.max(2, Math.min(40, Number(o.minutes) || 20));
    this.cfg = { sessionMs: this.D(mins * 60000), rollMs: this.D(DD.ROLL_MS), chooseMs: this.D(DD.CHOOSE_MS), qMs: Math.max(5000, Math.min(60000, (Number(o.questionSeconds) || 15) * 1000)), resultMs: this.D(DD.RESULT_MS) };
    const custom = (this.content?.items ?? []).map((q, i) => validateQuestion(q, i)).filter((r) => r.q).map((r) => r.q);
    this.bank = [...DACULA_QUESTIONS, ...custom];
    const seed = Number(this.room.settings?.seed) || ((Math.random() * 2 ** 32) >>> 0);
    const t = this.room.t();
    this.boards = partition(this.players, { max: DD.BOARD_MAX, floor: 2 }).map((members, i) => new Match(this, i, members, seed + i * 7919));
    this.byPlayer = new Map(); for (const b of this.boards) for (const m of b.members) this.byPlayer.set(m, b);
    for (const b of this.boards) b.setPhase("intro", t, this.D(DD.INTRO_MS));
  }
  tick(t) {
    for (const b of this.boards) b.tick(t);
    if (this.boards.every((b) => b.over)) this.done = true;
  }
  act(pid, a, t) {
    const b = this.byPlayer.get(pid); if (!b) fail("You're watching this match.");
    if (b.over) fail("This match is over.");
    switch (a.type) {
      case "roll": b.doRoll(pid, a, t); break;
      case "move": b.doMove(pid, a, t); break;
      case "answer": b.doAnswer(pid, a, t); break;
      default: fail("Unknown action.");
    }
    return { ok: true };
  }
  /** Teacher "skip": move on from the current player of every board that is waiting on someone. */
  skip() { const t = this.room.t(); for (const b of this.boards) if (!b.over && b.phase !== "intro") { b.say(`${b.nick(b.cur)}'s turn was skipped.`); b.nextTurn(t); } }
  view(pid, opts) {
    const t = this.room.t();
    const out = { kind: "dacula_dash", cfg: { qSeconds: Math.round(this.cfg.qMs / 1000) } };
    const b = pid ? this.byPlayer.get(pid) : this.boards[Math.max(0, Math.min(this.boards.length - 1, Number(opts?.group) || 0))];
    if (b) out.board = b.viewFor(pid, t);
    out.boards = this.boards.map((x) => ({ id: x.id, size: x.members.length, phase: x.phase, over: x.over, leader: this.leader(x), turn: x.turnNo }));
    return out;
  }
  leader(b) { const r = b.rankings()[0]; return r ? { nickname: this.nick(r.id), wedges: r.wedges } : null; }
  awards() {
    const out = []; const all = this.boards.flatMap((b) => b.members.map((id) => ({ id, ...b.p.get(id) })));
    const top = (f) => all.slice().sort((a, b) => f(b) - f(a))[0];
    const w = top((x) => x.wedges.length); if (w?.wedges.length) out.push({ id: "wedges", icon: "🏅", title: "Wedge Collector", pid: w.id, detail: `${w.wedges.length} wedges` });
    const c = top((x) => x.correct); if (c?.correct) out.push({ id: "brain", icon: "🧠", title: "Trivia Titan", pid: c.id, detail: `${c.correct} correct` });
    const s = top((x) => x.steps); if (s?.steps) out.push({ id: "road", icon: "🚗", title: "Road Warrior", pid: s.id, detail: `${s.steps} spaces` });
    return out;
  }
  highlights() { return this.boards.map((b) => (b.winner ? `${this.nick(b.winner)} won board ${b.id + 1}` : `Board ${b.id + 1}: ${this.leader(b)?.nickname ?? "?"} led with ${this.leader(b)?.wedges ?? 0} wedges`)).slice(0, 5); }
}
