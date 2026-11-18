import { BaseGame } from "./base.mjs";
import { chooseSequence, isWord, vocabSequence } from "../dictionary.mjs";
import { fail, partition, pick, randInt, normalizeWord } from "../util.mjs";

const HEARTS = 3, FUSE_MIN = 8000, FUSE_SPREAD = 7000, BOOM_MS = 3200, GAME_MS = 170000, MAX_ROUNDS = 8;
const ASSIST_MS = 700, ASSIST_CAP = 2800;
export const REACTIONS = ["😂", "😱", "🔥", "👏", "🥔"];

export class HotPotato extends BaseGame {
  start() {
    const t = this.room.t();
    this.endsAt = t + this.D(GAME_MS);
    this.vocab = new Set((this.content.items ?? []).map((w) => normalizeWord(w)).filter((w) => w.length >= 3));
    this.vocabList = [...this.vocab];
    this.groups = partition(this.players, { max: 7, floor: 4 }).map((members, i) => ({
      id: i, members, hearts: new Map(members.map((m) => [m, HEARTS])), used: new Set(), round: 0, turn: 0, holder: null, prev: null,
      lastVictim: null, sequence: "", status: "live", boomUntil: 0, boomVictim: null, lastPass: null, reactions: [], passes: 0,
      fuseAt: 0, fuseTotal: 1, bonusMs: 0, heatBias: 0, lastReact: new Map(), winner: null, words: 0,
    }));
    this.byPlayer = new Map();
    for (const g of this.groups) for (const m of g.members) this.byPlayer.set(m, g);
    for (const g of this.groups) this.beginRound(g, t);
  }

  alive(g) { return g.members.filter((m) => this.here(m) && (g.hearts.get(m) ?? 0) > 0); }

  pickHolder(g, avoid) {
    const alive = this.alive(g);
    let pool = alive.filter((m) => this.connected(m) && m !== avoid);
    if (!pool.length) pool = alive.filter((m) => m !== avoid);
    if (!pool.length) pool = alive;
    return pool.length ? pick(pool) : null;
  }

  newSequence(g, avoid) {
    if (this.vocabList.length && randInt(100) < 45) {
      for (let i = 0; i < 6; i++) { const s = vocabSequence(pick(this.vocabList), avoid); if (s) return s; }
    }
    return chooseSequence(g.round, avoid);
  }

  beginRound(g, t) {
    const alive = this.alive(g);
    if (alive.length <= 1 || g.round >= MAX_ROUNDS) return this.finishGroup(g);
    g.round++; g.turn++; g.status = "live"; g.boomVictim = null; g.bonusMs = 0; g.lastPass = null;
    g.holder = this.pickHolder(g, g.lastVictim);
    g.prev = null;
    g.sequence = this.newSequence(g, g.sequence);
    g.fuseTotal = this.D(FUSE_MIN + randInt(FUSE_SPREAD));
    g.fuseAt = t + g.fuseTotal;
    g.heatBias = (randInt(100) - 50) / 400;
    this.room.log("hp_round", { group: g.id, round: g.round, holder: this.nick(g.holder), seq: g.sequence });
  }

  finishGroup(g) {
    if (g.status === "done") return;
    g.status = "done";
    const alive = this.alive(g);
    for (const m of alive) this.add(m, (g.hearts.get(m) ?? 0) * 10 + (alive.length === 1 ? 25 : 0));
    g.winner = alive.length === 1 ? alive[0] : null;
    this.room.log("hp_group_done", { group: g.id, winner: g.winner ? this.nick(g.winner) : null });
  }

  tick(t) {
    for (const g of this.groups) {
      if (g.status === "live") {
        if (!g.holder || !this.here(g.holder) || (g.hearts.get(g.holder) ?? 0) <= 0) { g.holder = this.pickHolder(g, null); if (!g.holder) { this.finishGroup(g); continue; } }
        // disconnected holder: do not freeze the group, hand the potato on after a short grace period
        if (!this.connected(g.holder)) {
          g.offlineSince ??= t;
          if (t - g.offlineSince > this.D(2000)) { this.movePotato(g, g.holder); g.offlineSince = null; }
        } else g.offlineSince = null;
        if (t >= g.fuseAt + g.bonusMs) this.explode(g, t);
      } else if (g.status === "boom" && t >= g.boomUntil) this.beginRound(g, t);
    }
    if (t >= this.endsAt) { for (const g of this.groups) this.finishGroup(g); }
    if (this.groups.every((g) => g.status === "done")) this.done = true;
  }

  explode(g, t) {
    const victim = g.holder;
    const hearts = Math.max(0, (g.hearts.get(victim) ?? 1) - 1);
    g.hearts.set(victim, hearts);
    g.status = "boom"; g.boomVictim = victim; g.lastVictim = victim; g.boomUntil = t + this.D(BOOM_MS);
    for (const m of this.alive(g)) if (m !== victim) this.add(m, 5);
    this.room.log("hp_boom", { group: g.id, victim: this.nick(victim), heartsLeft: hearts });
  }

  /** Random transfer: never the previous holder while someone else is eligible, never the sender. */
  movePotato(g, from) {
    const pool = this.alive(g).filter((m) => m !== from);
    const connected = pool.filter((m) => this.connected(m));
    const eligible = connected.filter((m) => m !== g.prev);
    const choice = eligible.length ? pick(eligible) : connected.length ? pick(connected) : pool.length ? pick(pool) : from;
    g.prev = from; g.holder = choice; g.turn++; g.passes++;
    g.sequence = this.newSequence(g, g.sequence);
    return choice;
  }

  checkWord(g, raw, { allowVocab = true } = {}) {
    const word = normalizeWord(raw).replace(/[0-9]/g, "");
    const seq = g.sequence.toLowerCase();
    if (word.length < 3) fail("Too short.");
    if (!word.includes(seq)) fail(`Needs the letters ${g.sequence}.`);
    if (word === seq) fail("Use a longer word.");
    if (!isWord(word) && !(allowVocab && this.vocab.has(word))) fail("That's not in the dictionary.");
    if (g.used.has(word)) fail("Someone already used that word!");
    return word;
  }

  act(pid, a, t) {
    const g = this.byPlayer.get(pid);
    if (!g) fail("You're not in a potato group.");
    if (a.type === "react") {
      if (!REACTIONS.includes(a.emoji)) fail("Unknown reaction.");
      if (t - (g.lastReact.get(pid) ?? -9999) < this.D(700)) fail("Easy on the reactions!");
      g.lastReact.set(pid, t);
      g.reactions.push({ from: pid, emoji: a.emoji, at: Math.round(t) });
      if (g.reactions.length > 8) g.reactions.shift();
      return { ok: true };
    }
    if (a.type !== "word") fail("Unknown action.");
    if (g.status !== "live") fail("Wait for the next potato!");
    if (a.turn !== undefined && a.turn !== g.turn) fail("Too late - the potato moved.", "stale");
    const hearts = g.hearts.get(pid) ?? 0;
    if (hearts > 0) {
      if (g.holder !== pid) fail("You're not holding the potato.");
      if (t >= g.fuseAt + g.bonusMs) { this.explode(g, t); fail("Too late - it exploded!"); }
      const word = this.checkWord(g, a.word);
      g.used.add(word); g.words++;
      const bonus = this.vocab.has(word) ? 10 : 0;
      this.add(pid, 10 + Math.min(10, Math.floor(word.length / 2)) + bonus);
      const to = this.movePotato(g, pid);
      g.lastPass = { from: pid, to, word, n: g.passes };
      this.room.log("hp_pass", { group: g.id, from: this.nick(pid), to: this.nick(to), word });
      return { ok: true, word, vocab: bonus > 0 };
    }
    // eliminated players are "ghosts": valid words cool the fuse a little and earn small points
    if (g.bonusMs >= ASSIST_CAP) fail("The potato can't cool down any more this round.");
    const word = this.checkWord(g, a.word);
    g.used.add(word); g.bonusMs += this.D(ASSIST_MS);
    this.add(pid, 4);
    return { ok: true, word, assist: true };
  }

  heat(g, t) {
    if (g.status !== "live") return g.status === "boom" ? 4 : 0;
    const frac = (g.fuseAt + g.bonusMs - t) / (g.fuseTotal + g.bonusMs) + g.heatBias;
    return frac > 0.55 ? 0 : frac > 0.3 ? 1 : frac > 0.12 ? 2 : 3;
  }

  groupView(g, pid) {
    const t = this.room.t();
    return {
      id: g.id, round: g.round, maxRounds: MAX_ROUNDS, status: g.status, turn: g.turn, sequence: g.status === "live" ? g.sequence : null,
      holder: g.holder, heat: this.heat(g, t), boomVictim: g.boomVictim, winner: g.winner,
      members: g.members.map((m) => ({ id: m, hearts: g.hearts.get(m) ?? 0, nickname: this.nick(m), avatar: this.room.players.get(m)?.avatar, connected: this.connected(m), gone: !this.here(m) })),
      lastPass: g.lastPass, reactions: g.reactions.slice(-5), words: g.words,
      you: pid ? { hearts: g.hearts.get(pid) ?? 0, holder: g.holder === pid && g.status === "live", ghost: (g.hearts.get(pid) ?? 0) <= 0, assistLeft: g.bonusMs < ASSIST_CAP } : undefined,
    };
  }

  view(pid, opts) {
    const out = { kind: "hot_potato", endsIn: Math.max(0, this.endsAt - this.room.t()), reactions: REACTIONS };
    const g = pid ? this.byPlayer.get(pid) : null;
    if (g) out.group = this.groupView(g, pid);
    out.groups = this.groups.map((x) => ({ id: x.id, status: x.status, round: x.round, alive: this.alive(x).length, size: x.members.length, holder: x.status === "live" ? this.nick(x.holder) : null, winner: x.winner ? this.nick(x.winner) : null, heat: this.heat(x, this.room.t()) }));
    if (!pid && opts?.group !== undefined && this.groups[opts.group]) out.group = this.groupView(this.groups[opts.group], null);
    return out;
  }

  highlights() {
    return this.groups.filter((g) => g.winner).map((g) => `${this.nick(g.winner)} survived group ${g.id + 1}`).slice(0, 5);
  }
}
