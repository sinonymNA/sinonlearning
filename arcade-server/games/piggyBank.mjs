import { BaseGame } from "./base.mjs";
import { fail, pick, randInt, shuffle } from "../util.mjs";

const ROUNDS = 8, READY_MS = 3500, WINDOW_MS = 12000, CHEST_MS = 7500, REVEAL_MS = 4500;
export const CHESTS = ["safe", "spicy", "wild"];

/**
 * Piggy Bank. Nobody is ever eliminated. Every round: everyone answers the same question (correct = coins
 * into your piggy bank + a speed bonus), then everyone picks a chest:
 *   SAFE  - guaranteed coins (maybe a shield)          SPICY - try to steal from a random rival
 *   WILD  - jackpot / steal from the leader / swap banks / oops   (WILD unlocks only if you answered correctly)
 * Shields block one steal or swap. Final bank = game points.
 */
export class PiggyBank extends BaseGame {
  start() {
    this.bank = new Map(this.players.map((p) => [p, 0]));
    this.shield = new Set();
    this.pool = shuffle(this.content.items); this.qi = 0;
    this.round = 0; this.feed = []; this.stats = { bestSteal: null, jackpot: null, stolenFrom: new Map() };
    this.roll = () => randInt(100);        // overridable in tests
    this.nextRound(this.room.t());
  }

  nextRound(t) {
    if (this.round >= ROUNDS) { this.phase = "done"; this.done = true; return; }
    this.round++;
    if (this.qi >= this.pool.length) { this.pool = shuffle(this.content.items); this.qi = 0; }
    const raw = this.pool[this.qi++];
    const order = shuffle(raw.choices.map((_, i) => i));
    this.q = { q: raw.q, choices: order.map((i) => raw.choices[i]), answer: order.indexOf(raw.answer), answers: new Map(), openAt: t + this.D(READY_MS), closeAt: t + this.D(READY_MS + WINDOW_MS) };
    this.picks = new Map(); this.results = new Map(); this.correctSet = new Set();
    this.phase = "ready"; this.phaseEnds = this.q.openAt;
  }

  setBank(pid, v) { this.bank.set(pid, Math.max(0, Math.round(v))); this.points.set(pid, this.bank.get(pid)); }
  gain(pid, n) { this.setBank(pid, (this.bank.get(pid) ?? 0) + n); }
  log(entry) { this.feed.push({ r: this.round, ...entry }); if (this.feed.length > 40) this.feed.shift(); }
  live(pid) { return this.here(pid) && this.players.includes(pid); }

  tick(t) {
    if (this.phase === "ready" && t >= this.q.openAt) { this.phase = "question"; }
    if (this.phase === "question") {
      const everyone = this.players.filter((p) => this.live(p) && this.connected(p));
      if (t >= this.q.closeAt || (everyone.length > 0 && everyone.every((p) => this.q.answers.has(p)))) this.endQuestion(t);
    } else if (this.phase === "chest") {
      const everyone = this.players.filter((p) => this.live(p) && this.connected(p));
      if (t >= this.chestEnds || (everyone.length > 0 && everyone.every((p) => this.picks.has(p)))) this.endChests(t);
    } else if (this.phase === "reveal" && t >= this.phaseEnds) this.nextRound(t);
  }

  endQuestion(t) {
    const window = this.q.closeAt - this.q.openAt;
    for (const [pid, a] of this.q.answers) {
      if (!this.live(pid) || a.choice !== this.q.answer) continue;
      this.correctSet.add(pid);
      this.gain(pid, 100 + Math.round(100 * (1 - a.ms / window)));
    }
    this.phase = "chest"; this.chestEnds = t + this.D(CHEST_MS);
  }

  endChests(t) {
    // anyone who didn't pick gets a random allowed chest so the round never stalls
    for (const pid of shuffle(this.players.filter((p) => this.live(p) && !this.picks.has(p)))) {
      const allowed = this.correctSet.has(pid) ? CHESTS : ["safe", "spicy"];
      this.pickChest(pid, pick(allowed), t, true);
    }
    this.phase = "reveal"; this.phaseEnds = t + this.D(REVEAL_MS);
  }

  act(pid, a, t) {
    if (a.type === "answer") {
      if (this.phase === "ready") fail("Wait for the question to open!");
      if (this.phase !== "question" || t >= this.q.closeAt) fail("Too late for this question.");
      if (this.q.answers.has(pid)) fail("You already answered.");
      const choice = Number(a.choice);
      if (!Number.isInteger(choice) || choice < 0 || choice >= this.q.choices.length) fail("Pick one of the choices.");
      this.q.answers.set(pid, { choice, ms: Math.max(0, Math.round(t - this.q.openAt)) });
      return { ok: true };
    }
    if (a.type === "pick") {
      if (this.phase !== "chest") fail("Chests aren't open right now.");
      if (this.picks.has(pid)) fail("You already opened a chest.");
      if (!CHESTS.includes(a.chest)) fail("Pick a chest.");
      if (a.chest === "wild" && !this.correctSet.has(pid)) fail("The WILD chest is locked - answer correctly to unlock it!");
      return this.pickChest(pid, a.chest, t, false);
    }
    fail("Unknown action.");
  }

  /** Apply a chest. Everything is decided here, on the server. */
  pickChest(pid, kind, t, auto) {
    const right = this.correctSet.has(pid);
    const others = this.players.filter((p) => p !== pid && this.live(p));
    const r = { kind, auto, text: "", delta: 0 };
    const steal = (victim, pct, cap, verb) => {
      if (this.shield.has(victim)) { this.shield.delete(victim); this.log({ kind: "blocked", actor: pid, victim }); return { text: "blocked", delta: 0, victim, blocked: true }; }
      const amt = Math.min(cap, Math.floor((this.bank.get(victim) ?? 0) * pct));
      if (amt < 10) return null;
      this.gain(victim, -amt); this.gain(pid, amt);
      this.stats.stolenFrom.set(victim, (this.stats.stolenFrom.get(victim) ?? 0) + amt);
      if (!this.stats.bestSteal || amt > this.stats.bestSteal.amt) this.stats.bestSteal = { pid, victim, amt };
      this.log({ kind: "steal", actor: pid, victim, amount: amt, verb });
      return { text: "steal", delta: amt, victim };
    };
    const coins = (n, kindLabel = "coins") => { this.gain(pid, n); this.log({ kind: kindLabel, actor: pid, amount: n }); return { text: kindLabel, delta: n }; };
    let out;
    if (kind === "safe") {
      out = coins(right ? 120 : 60);
      if (this.roll() < 30) { this.shield.add(pid); out.shield = true; this.log({ kind: "shield", actor: pid }); }
    } else if (kind === "spicy") {
      const rich = others.filter((p) => (this.bank.get(p) ?? 0) > 0);
      if (this.roll() < 70 && rich.length) out = steal(pick(rich), right ? 0.2 : 0.1, 400, "spicy") ?? coins(40);
      else out = coins(40, "squeal");
    } else {
      const x = this.roll();
      const leader = [...others].sort((a, b) => (this.bank.get(b) ?? 0) - (this.bank.get(a) ?? 0))[0];
      if (x < 10) { out = coins(700, "jackpot"); if (!this.stats.jackpot) this.stats.jackpot = pid; }
      else if (x < 35) out = leader && (this.bank.get(leader) ?? 0) > (this.bank.get(pid) ?? 0) ? (steal(leader, 0.25, 500, "leader") ?? coins(200)) : coins(200);
      else if (x < 50) {
        const richer = others.filter((p) => (this.bank.get(p) ?? 0) > (this.bank.get(pid) ?? 0));
        if (!richer.length) out = coins(200);
        else {
          const v = pick(richer);
          if (this.shield.has(v)) { this.shield.delete(v); this.log({ kind: "blocked", actor: pid, victim: v }); out = { text: "blocked", delta: 0, victim: v, blocked: true }; }
          else { const mine = this.bank.get(pid) ?? 0, theirs = this.bank.get(v) ?? 0; this.setBank(pid, theirs); this.setBank(v, mine); this.log({ kind: "swap", actor: pid, victim: v, amount: theirs - mine }); out = { text: "swap", delta: theirs - mine, victim: v }; }
        }
      } else if (x < 70) { const loss = Math.min(250, Math.floor((this.bank.get(pid) ?? 0) * 0.15)); this.gain(pid, -loss); this.log({ kind: "oops", actor: pid, amount: loss }); out = { text: "oops", delta: -loss }; }
      else out = coins(200);
    }
    Object.assign(r, out); r.kind = kind;
    this.picks.set(pid, kind); this.results.set(pid, r);
    return { ok: true, result: r };
  }

  skip() { if (this.phase === "question" || this.phase === "ready") { this.q.openAt = Math.min(this.q.openAt, this.room.t()); this.q.closeAt = this.room.t(); this.phase = "question"; } else if (this.phase === "chest") this.chestEnds = this.room.t(); else { this.phase = "done"; this.done = true; } }

  botHint() { return this.q?.answer; }

  view(pid, opts, mode) {
    const t = this.room.t(), q = this.q;
    const openIn = Math.max(0, q.openAt - t);
    const showQ = this.phase !== "ready" || openIn <= 2200;
    const reveal = this.phase === "reveal" || this.phase === "done";
    const ranked = [...this.bank.entries()].filter(([p]) => this.here(p)).sort((a, b) => b[1] - a[1]);
    const out = {
      kind: "piggy_bank", phase: this.phase, round: this.round, rounds: ROUNDS,
      openIn: Math.round(openIn), closeIn: Math.round(Math.max(0, q.closeAt - t)), windowMs: q.closeAt - q.openAt, chestIn: this.phase === "chest" ? Math.round(Math.max(0, this.chestEnds - t)) : 0, chestMs: this.D(CHEST_MS),
      answeredCount: q.answers.size, pickedCount: this.picks.size, total: this.players.length,
      question: showQ ? { q: q.q, choices: q.choices } : null,
      players: ranked.map(([id, bank], i) => ({ id, bank, rank: i + 1, nickname: this.nick(id), avatar: this.room.players.get(id)?.avatar, shield: this.shield.has(id), picked: this.phase === "chest" ? this.picks.has(id) : undefined })),
      feed: this.feed.slice(-8).map((f) => ({ ...f })),
    };
    if (reveal || mode === "dev") out.correct = q.answer;
    if (this.phase === "chest" || reveal) out.question = { q: q.q, choices: q.choices };
    if (pid) {
      const a = q.answers.get(pid), res = this.results.get(pid);
      out.you = { bank: this.bank.get(pid) ?? 0, answered: !!a, choice: a?.choice ?? null, correct: this.phase !== "ready" && this.phase !== "question" && a ? a.choice === q.answer : null, canWild: this.correctSet.has(pid), picked: this.picks.get(pid) ?? null, result: res ?? null, shield: this.shield.has(pid), rank: ranked.findIndex(([p]) => p === pid) + 1 };
    }
    return out;
  }

  awards() {
    const out = [];
    if (this.stats.bestSteal) out.push({ id: "heist", icon: "🕶️", title: "Biggest Heist", pid: this.stats.bestSteal.pid, detail: `stole ${this.stats.bestSteal.amt} coins` });
    if (this.stats.jackpot) out.push({ id: "jackpot", icon: "🎰", title: "Jackpot!", pid: this.stats.jackpot, detail: "hit the 700-coin jackpot" });
    const v = [...this.stats.stolenFrom.entries()].sort((a, b) => b[1] - a[1])[0];
    if (v) out.push({ id: "victim", icon: "😭", title: "Most Robbed", pid: v[0], detail: `lost ${v[1]} coins to thieves` });
    return out;
  }

  highlights() { const top = [...this.bank.entries()].sort((a, b) => b[1] - a[1])[0]; return top ? [`${this.nick(top[0])} filled their piggy with ${top[1]} coins`] : []; }
}
