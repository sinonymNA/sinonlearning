import { BaseGame } from "./base.mjs";
import { PUFFER_PROMPTS, TIERS, getPrompt, matchAnswer, TIER_ORDER } from "../abyss.mjs";
import { fail, partition, pick, shuffle } from "../util.mjs";
import { isClean } from "../moderation.mjs";

// Puffer Party: a category appears, the puffer sits on one player, they must say something that is on the list before
// their turn timer runs out. A valid answer passes the puffer to the next player (and every pass shortens the next
// turn). Run out of time = the puffer pops: you lose a life. Last player alive wins. Uses the same answer bank as Abyss,
// so rarer answers are worth more points.
const LIVES = 3, TURN_START = 14000, TURN_MIN = 7000, TURN_DECAY = 600, POP_MS = 3800, GAME_MS = 300000, GRACE = 150;
const BONUS = { bubble: 0, clever: 2, shoal: 5, reef: 10, trench: 15, pearl: 25 };
export const REACTIONS = ["😂", "😱", "🔥", "👏", "🐡"];

export class PufferParty extends BaseGame {
  start() {
    const t = this.room.t();
    this.endsAt = t + this.D(GAME_MS);
    this.groups = partition(this.players, { max: 6, floor: 3 }).map((members, id) => ({
      id, members, lives: new Map(members.map((m) => [m, LIVES])), round: 0, status: "live", holder: null, turn: 0, passes: 0, promptId: null,
      used: new Map(), said: [], draft: "", turnEndsAt: 0, turnTotal: 0, popUntil: 0, victim: null, winner: null, lastAnswer: null, lastReact: new Map(), reactions: [],
      seen: new Set(), words: 0, offlineSince: null,
    }));
    this.byPlayer = new Map();
    for (const g of this.groups) for (const m of g.members) this.byPlayer.set(m, g);
    this.stats = { best: null, answers: new Map(), pops: new Map() };
    for (const g of this.groups) this.newRound(g, t);
  }

  alive(g) { return g.members.filter((m) => this.here(m) && (g.lives.get(m) ?? 0) > 0); }

  nextAlive(g, from) {
    const order = g.members;
    const start = Math.max(0, order.indexOf(from));
    for (let i = 1; i <= order.length; i++) {
      const m = order[(start + i) % order.length];
      if (this.here(m) && (g.lives.get(m) ?? 0) > 0) return m;
    }
    return null;
  }

  turnLength(g) { return this.D(Math.max(TURN_MIN, TURN_START - g.passes * TURN_DECAY)); }

  pickPrompt(g) {
    let pool = PUFFER_PROMPTS.filter((p) => !g.seen.has(p.id));
    if (!pool.length) { g.seen.clear(); pool = PUFFER_PROMPTS; }
    const p = pick(pool); g.seen.add(p.id); return p;
  }

  newRound(g, t, startAfter = null) {
    const alive = this.alive(g);
    if (alive.length <= 1) return this.finishGroup(g);
    g.round++; g.status = "live"; g.victim = null; g.passes = 0; g.used = new Map(); g.said = []; g.draft = ""; g.lastAnswer = null; g.turn++;
    g.promptId = this.pickPrompt(g).id;
    g.holder = startAfter ? this.nextAlive(g, startAfter) : pick(alive);
    g.turnTotal = this.turnLength(g); g.turnEndsAt = t + g.turnTotal;
    this.room.log("puffer_round", { group: g.id, round: g.round, prompt: getPrompt(g.promptId)?.id, holder: this.nick(g.holder) });
  }

  finishGroup(g) {
    if (g.status === "done") return;
    g.status = "done";
    const alive = this.alive(g);
    for (const m of alive) this.add(m, (g.lives.get(m) ?? 0) * 15 + (alive.length === 1 ? 30 : 0));
    g.winner = alive.length === 1 ? alive[0] : null;
    this.room.log("puffer_group_done", { group: g.id, winner: g.winner ? this.nick(g.winner) : null });
  }

  pop(g, t) {
    const victim = g.holder;
    const lives = Math.max(0, (g.lives.get(victim) ?? 1) - 1);
    g.lives.set(victim, lives);
    g.status = "pop"; g.victim = victim; g.popUntil = t + this.D(POP_MS); g.draft = "";
    for (const m of this.alive(g)) if (m !== victim) this.add(m, 4);
    this.stats.pops.set(victim, (this.stats.pops.get(victim) ?? 0) + 1);
    this.room.log("puffer_pop", { group: g.id, victim: this.nick(victim), livesLeft: lives });
  }

  tick(t) {
    for (const g of this.groups) {
      if (g.status === "live") {
        if (!g.holder || !this.here(g.holder) || (g.lives.get(g.holder) ?? 0) <= 0) { g.holder = this.nextAlive(g, g.holder ?? g.members[0]); if (!g.holder) { this.finishGroup(g); continue; } }
        // a disconnected holder doesn't freeze the table: the puffer drifts on after a short grace period, no life lost
        if (!this.connected(g.holder)) {
          g.offlineSince ??= t;
          if (t - g.offlineSince > this.D(2500)) { this.advance(g, g.holder, t); g.offlineSince = null; }
        } else g.offlineSince = null;
        if (g.status === "live" && t >= g.turnEndsAt + this.D(GRACE)) this.pop(g, t);
      } else if (g.status === "pop" && t >= g.popUntil) this.newRound(g, t, g.victim);
    }
    if (t >= this.endsAt) for (const g of this.groups) this.finishGroup(g);
    if (this.groups.every((g) => g.status === "done")) this.done = true;
  }

  advance(g, from, t) {
    g.holder = this.nextAlive(g, from);
    g.turn++; g.passes++; g.draft = "";
    g.turnTotal = this.turnLength(g); g.turnEndsAt = t + g.turnTotal;
  }

  act(pid, a, t) {
    const g = this.byPlayer.get(pid);
    if (!g) fail("You're not at a puffer table.");
    if (a.type === "react") {
      if (!REACTIONS.includes(a.emoji)) fail("Unknown reaction.");
      if (t - (g.lastReact.get(pid) ?? -9999) < this.D(700)) fail("Easy on the reactions!");
      g.lastReact.set(pid, t); g.reactions.push({ from: pid, emoji: a.emoji, at: Math.round(t) }); if (g.reactions.length > 8) g.reactions.shift();
      return { ok: true };
    }
    if (a.type === "draft") {
      if (g.status !== "live" || g.holder !== pid) return { ok: true };
      g.draft = String(a.text ?? "").toLowerCase().replace(/[^a-z0-9' &.-]/g, "").slice(0, 40);
      return { ok: true };
    }
    if (a.type !== "answer") fail("Unknown action.");
    if (g.status !== "live") fail("Wait for the next category!");
    if (g.holder !== pid) fail("It's not your turn.");
    if (a.turn !== undefined && a.turn !== g.turn) fail("The puffer moved on.", "stale");
    if (t >= g.turnEndsAt + this.D(GRACE)) { this.pop(g, t); fail("Too late - it popped!"); }
    const text = String(a.text ?? "").trim().slice(0, 60);
    if (!text) fail("Type something first.");
    const p = getPrompt(g.promptId);
    const m = matchAnswer(p, text);
    if (!m) fail("That's not on the list - try again!", "nope");
    const key = m.name.toLowerCase();
    if (g.used.has(key)) fail("Someone already said that one!", "dup");
    const points = 10 + BONUS[m.tier];
    g.used.set(key, { by: pid, name: m.name, tier: m.tier });
    g.said.push({ by: pid, name: m.name, tier: m.tier, n: g.said.length + 1 });
    g.lastAnswer = { by: pid, name: m.name, tier: m.tier, points, n: g.said.length };
    g.words++;
    this.add(pid, points);
    this.stats.answers.set(pid, (this.stats.answers.get(pid) ?? 0) + 1);
    if (!this.stats.best || TIER_ORDER.indexOf(m.tier) > TIER_ORDER.indexOf(this.stats.best.tier)) this.stats.best = { pid, name: m.name, tier: m.tier };
    const from = pid;
    this.advance(g, pid, t);
    g.lastAnswer.to = g.holder; g.lastAnswer.from = from;
    this.room.log("puffer_pass", { group: g.id, from: this.nick(from), to: this.nick(g.holder), answer: m.name, tier: m.tier });
    return { ok: true, name: m.name, tier: m.tier, points, fuzzy: m.fuzzy };
  }

  /** Bots call this (they stand in for a human's knowledge): pick an unused answer, shallower for weaker bots. */
  botPick(g, skill = 0.5) {
    const p = getPrompt(g.promptId);
    if (!p) return null;
    const order = skill > 0.85 ? [...TIER_ORDER].reverse() : skill > 0.6 ? ["shoal", "reef", "clever", "bubble", "trench", "pearl"] : ["bubble", "clever", "shoal", "reef"];
    for (const tier of order) {
      const options = (p.tiers[tier] ?? []).map((e) => e.split("=")[0].trim()).filter((n) => !g.used.has(n.toLowerCase()));
      if (options.length) return pick(options);
    }
    return null;
  }

  groupView(g, pid) {
    const t = this.room.t();
    const p = getPrompt(g.promptId);
    const left = g.status === "live" ? Math.max(0, Math.round(g.turnEndsAt - t)) : 0;
    return {
      id: g.id, round: g.round, status: g.status, turn: g.turn, holder: g.status === "done" ? null : g.holder, victim: g.victim, winner: g.winner,
      prompt: g.status === "done" ? null : { text: p?.prompt ?? "", cat: p?.cat ?? "" },
      turnMs: g.turnTotal, turnLeft: left, passes: g.passes, maxLives: LIVES,
      members: g.members.map((m) => ({ id: m, lives: g.lives.get(m) ?? 0, nickname: this.nick(m), avatar: this.room.players.get(m)?.avatar, connected: this.connected(m), gone: !this.here(m) })),
      said: g.said.slice(-14).map((s) => ({ ...s })), lastAnswer: g.lastAnswer, reactions: g.reactions.slice(-5),
      draft: g.status === "live" ? (isClean(g.draft) ? g.draft : "•••") : "",
      you: pid ? { holder: g.holder === pid && g.status === "live", lives: g.lives.get(pid) ?? 0, alive: (g.lives.get(pid) ?? 0) > 0 } : undefined,
    };
  }

  view(pid, opts) {
    const out = { kind: "puffer_party", endsIn: Math.max(0, this.endsAt - this.room.t()), reactions: REACTIONS };
    const g = pid ? this.byPlayer.get(pid) : null;
    if (g) out.group = this.groupView(g, pid);
    out.groups = this.groups.map((x) => ({ id: x.id, status: x.status, round: x.round, alive: this.alive(x).length, size: x.members.length, holder: x.status === "live" ? this.nick(x.holder) : null, winner: x.winner ? this.nick(x.winner) : null }));
    if (!pid && opts?.group !== undefined && this.groups[opts.group]) out.group = this.groupView(this.groups[opts.group], null);
    return out;
  }

  awards() {
    const out = [];
    const top = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])[0];
    if (this.stats.best) out.push({ id: "rare", icon: TIERS[this.stats.best.tier].icon, title: "Rare Find", pid: this.stats.best.pid, detail: this.stats.best.name });
    const a = top(this.stats.answers); if (a) out.push({ id: "answers", icon: "🐡", title: "Puffer Pro", pid: a[0], detail: `${a[1]} answers` });
    return out;
  }

  highlights() { return this.groups.filter((g) => g.winner).map((g) => `${this.nick(g.winner)} outlasted table ${g.id + 1}`).slice(0, 5); }
}
