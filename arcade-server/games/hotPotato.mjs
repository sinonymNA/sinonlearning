import { BaseGame } from "./base.mjs";
import { chooseSequence, isWord, vocabSequence } from "../dictionary.mjs";
import { fail, partition, pick, randInt, normalizeWord, shuffle } from "../util.mjs";
import { contentFor } from "../content.mjs";
import { isClean } from "../moderation.mjs";

const HEARTS = 3, FUSE_MIN = 18000, FUSE_SPREAD = 12000, BOOM_MS = 4500, GAME_MS = 210000, MAX_ROUNDS = 7;
const ASSIST_MS = 700, ASSIST_CAP = 2800, HOLD_MS = 12000, STALL_FUSE_MS = 2000, STALL_PENALTY = 5, WRONG_FUSE_MS = 1500, WRONG_PENALTY = 2, QUIZ_PTS = 14;
export const REACTIONS = ["😂", "😱", "🔥", "👏", "🥔"];

export class HotPotato extends BaseGame {
  /** Test hook: force every challenge to one kind ("letters" | "starts" | "quiz"). */
  static forceKind = null;

  start() {
    const t = this.room.t();
    this.endsAt = t + this.D(GAME_MS);
    this.vocab = new Set((this.content.items ?? []).map((w) => normalizeWord(w)).filter((w) => w.length >= 3));
    this.vocabList = [...this.vocab];
    this.questions = (contentFor("last_one_standing", this.room.content).items ?? []).filter((q) => q.choices?.length >= 3);
    this.groups = partition(this.players, { max: 7, floor: 4 }).map((members, i) => ({
      id: i, members, hearts: new Map(members.map((m) => [m, HEARTS])), used: new Set(), round: 0, turn: 0, holder: null, prev: null,
      lastVictim: null, sequence: "", status: "live", boomUntil: 0, boomVictim: null, lastPass: null, reactions: [], passes: 0,
      fuseAt: 0, fuseTotal: 1, bonusMs: 0, heatBias: 0, lastReact: new Map(), winner: null, words: 0,
      draft: "", heldSince: 0, boomGuesses: new Map(), boomResults: [], challenge: null, usedQ: new Set(), surpriseAt: 0,
    }));
    this.byPlayer = new Map();
    this.stats = { longest: null, passes: new Map(), boom: new Map(), quick: new Map(), brain: new Map() };
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

  /** Every hand-off gets a fresh challenge so nobody can predict what they'll face: letters / starts-with / a class quiz question. */
  newChallenge(g) {
    const f = HotPotato.forceKind;
    const roll = f === "quiz" ? 99 : f === "starts" ? 50 : f === "letters" ? 0 : randInt(100);
    if (roll >= 65 && this.questions.length >= 5) {
      let pool = this.questions.filter((_, i) => !g.usedQ.has(i));
      if (!pool.length) { g.usedQ.clear(); pool = this.questions; }
      const q = pick(pool); g.usedQ.add(this.questions.indexOf(q));
      const order = shuffle(q.choices.map((c, i) => i));
      g.challenge = { kind: "quiz", q: q.q, choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer), wrong: new Set(), concept: q.concept ?? null };
    } else if (roll >= 45) g.challenge = { kind: "starts" };
    else g.challenge = { kind: "letters" };
  }

  beginRound(g, t) {
    const alive = this.alive(g);
    if (alive.length <= 1 || g.round >= MAX_ROUNDS) return this.finishGroup(g);
    g.round++; g.turn++; g.status = "live"; g.boomVictim = null; g.bonusMs = 0; g.lastPass = null; g.draft = ""; g.boomGuesses = new Map(); g.heldSince = t;
    g.holder = this.pickHolder(g, g.lastVictim);
    g.prev = null;
    g.sequence = this.newSequence(g, g.sequence);
    this.newChallenge(g);
    g.fuseTotal = this.D(FUSE_MIN + randInt(FUSE_SPREAD));
    g.fuseAt = t + g.fuseTotal;
    g.surpriseAt = randInt(100) < 55 ? t + Math.round(g.fuseTotal * (0.35 + randInt(25) / 100)) : 0;
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
        // Hot hands: nobody can sit on the potato. If the holder doesn't pass within HOLD_MS it jumps to someone
        // else, the holder loses points and the fuse gets shorter.
        if (g.status === "live" && g.holder && this.connected(g.holder) && t - g.heldSince >= this.D(HOLD_MS)) this.stall(g, t);
        if (g.status === "live" && g.surpriseAt && t >= g.surpriseAt && t < g.fuseAt - this.D(3000)) this.surprise(g, t);
        if (g.status === "live" && t >= g.fuseAt + g.bonusMs) this.explode(g, t);
      } else if (g.status === "boom" && t >= g.boomUntil) this.beginRound(g, t);
    }
    if (t >= this.endsAt) { for (const g of this.groups) this.finishGroup(g); }
    if (this.groups.every((g) => g.status === "done")) this.done = true;
  }

  stall(g, t) {
    const from = g.holder;
    this.add(from, -STALL_PENALTY);
    g.fuseAt -= this.D(STALL_FUSE_MS);
    const to = this.movePotato(g, from);
    g.draft = ""; g.heldSince = t;
    g.lastPass = { from, to, word: null, stalled: true, n: g.passes };
    this.stats.stalls = (this.stats.stalls ?? 0) + 1;
    this.room.log("hp_stall", { group: g.id, from: this.nick(from), to: this.nick(to) });
  }

  /** Mid-round surprise: the potato jumps on its own (no penalty) so no one can plan to sit on a turn. */
  surprise(g, t) {
    g.surpriseAt = 0;
    const from = g.holder;
    const to = this.movePotato(g, from);
    if (to === from) return;
    g.draft = ""; g.heldSince = t;
    g.lastPass = { from, to, word: null, surprise: true, n: g.passes };
    this.stats.surprises = (this.stats.surprises ?? 0) + 1;
    this.room.log("hp_surprise", { group: g.id, from: this.nick(from), to: this.nick(to) });
  }

  explode(g, t) {
    const victim = g.holder;
    const hearts = Math.max(0, (g.hearts.get(victim) ?? 1) - 1);
    g.hearts.set(victim, hearts);
    g.status = "boom"; g.boomVictim = victim; g.lastVictim = victim; g.boomUntil = t + this.D(BOOM_MS);
    for (const m of this.alive(g)) if (m !== victim) this.add(m, 5);
    g.boomResults = [];
    const end = g.fuseAt + g.bonusMs;
    for (const [pid, at] of g.boomGuesses) {
      const d = Math.max(0, end - at), s = this.room.settings.timeScale;
      const pts = d <= 1000 * s ? 15 : d <= 2500 * s ? 8 : d <= 4500 * s ? 3 : 0;
      if (pts) { this.add(pid, pts); g.boomResults.push({ id: pid, pts }); this.stats.boom.set(pid, (this.stats.boom.get(pid) ?? 0) + pts); }
    }
    g.boomResults.sort((a, b) => b.pts - a.pts);
    g.draft = "";
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
    this.newChallenge(g);
    return choice;
  }

  checkWord(g, raw, { allowVocab = true, ghost = false } = {}) {
    const word = normalizeWord(raw).replace(/[0-9]/g, "");
    const seq = g.sequence.toLowerCase();
    if (word.length < 3) fail("Too short.");
    const starts = g.challenge?.kind === "starts" && !ghost;
    if (starts ? !word.startsWith(seq) : !word.includes(seq)) fail(starts ? `Word must START with ${g.sequence}.` : `Needs the letters ${g.sequence}.`);
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
    if (a.type === "draft") {
      if (g.status !== "live" || g.holder !== pid) return { ok: true };
      g.draft = String(a.text ?? "").toLowerCase().replace(/[^a-z' -]/g, "").slice(0, 24);
      return { ok: true };
    }
    if (a.type === "boom") {
      if (g.status !== "live") fail("Wait for the next potato!");
      if (g.holder === pid) fail("You're holding it - pass it!");
      if (g.boomGuesses.has(pid)) fail("You already made your guess this round.");
      g.boomGuesses.set(pid, t);
      return { ok: true };
    }
    if (a.type === "answer") {
      if (g.status !== "live" || g.holder !== pid) fail("You're not holding the potato.");
      if (a.turn !== undefined && a.turn !== g.turn) fail("Too late - the potato moved.", "stale");
      const c = g.challenge;
      if (c?.kind !== "quiz") fail("This potato wants a word, not an answer.");
      const idx = Number(a.index);
      if (!Number.isInteger(idx) || idx < 0 || idx >= c.choices.length) fail("Pick one of the answers.");
      if (t >= g.fuseAt + g.bonusMs) { this.explode(g, t); fail("Too late - it exploded!"); }
      if (c.wrong.has(idx)) fail("You already tried that one.");
      if (idx !== c.answer) {
        c.wrong.add(idx);
        this.add(pid, -WRONG_PENALTY); g.fuseAt -= this.D(WRONG_FUSE_MS);
        this.stats.missed = (this.stats.missed ?? 0) + 1;
        fail("Not quite! The fuse got shorter - try again.", "wrong");
      }
      const quick = t - g.heldSince <= this.D(4000) ? 5 : 0;
      this.add(pid, QUIZ_PTS + quick);
      this.stats.passes.set(pid, (this.stats.passes.get(pid) ?? 0) + 1);
      this.stats.brain.set(pid, (this.stats.brain.get(pid) ?? 0) + 1);
      const answered = c.q;
      const to = this.movePotato(g, pid);
      g.draft = ""; g.heldSince = t;
      g.lastPass = { from: pid, to, word: null, brain: true, n: g.passes };
      this.room.log("hp_brain", { group: g.id, from: this.nick(pid), to: this.nick(to), q: answered });
      return { ok: true, brain: true, quick: quick > 0 };
    }
    if (a.type !== "word") fail("Unknown action.");
    if (g.status !== "live") fail("Wait for the next potato!");
    if (a.turn !== undefined && a.turn !== g.turn) fail("Too late - the potato moved.", "stale");
    const hearts = g.hearts.get(pid) ?? 0;
    if (hearts > 0) {
      if (g.holder !== pid) fail("You're not holding the potato.");
      if (t >= g.fuseAt + g.bonusMs) { this.explode(g, t); fail("Too late - it exploded!"); }
      if (g.challenge?.kind === "quiz") fail("Brain Pass! Pick the right answer to pass the potato.");
      const word = this.checkWord(g, a.word);
      g.used.add(word); g.words++;
      const bonus = this.vocab.has(word) ? 10 : 0;
      const quick = t - g.heldSince <= this.D(2500) ? 5 : 0;
      this.add(pid, 10 + Math.min(10, Math.floor(word.length / 2)) + bonus + quick);
      if (!this.stats.longest || word.length > this.stats.longest.word.length) this.stats.longest = { pid, word };
      this.stats.passes.set(pid, (this.stats.passes.get(pid) ?? 0) + 1);
      const to = this.movePotato(g, pid);
      g.draft = ""; g.heldSince = t;
      g.lastPass = { from: pid, to, word, n: g.passes };
      this.room.log("hp_pass", { group: g.id, from: this.nick(pid), to: this.nick(to), word });
      return { ok: true, word, vocab: bonus > 0, quick: quick > 0 };
    }
    // eliminated players are "ghosts": valid words cool the fuse a little and earn small points
    if (g.bonusMs >= ASSIST_CAP) fail("The potato can't cool down any more this round.");
    const word = this.checkWord(g, a.word, { ghost: true });
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
      challenge: g.status === "live" && g.challenge ? (g.challenge.kind === "quiz" ? { kind: "quiz", q: g.challenge.q, choices: g.challenge.choices, wrong: [...g.challenge.wrong] } : { kind: g.challenge.kind }) : null,
      lastPass: g.lastPass, reactions: g.reactions.slice(-5), words: g.words,
      holdMs: this.D(HOLD_MS), holdIn: g.status === "live" ? Math.max(0, Math.round(this.D(HOLD_MS) - (this.room.t() - g.heldSince))) : 0,
      draft: g.status === "live" ? (isClean(g.draft) ? g.draft : "•••") : "", boomResults: g.status === "boom" ? g.boomResults.map((r) => ({ ...r, nickname: this.nick(r.id) })) : [],
      you: pid ? { boomGuessed: g.boomGuesses.has(pid), hearts: g.hearts.get(pid) ?? 0, holder: g.holder === pid && g.status === "live", ghost: (g.hearts.get(pid) ?? 0) <= 0, assistLeft: g.bonusMs < ASSIST_CAP } : undefined,
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

  awards() {
    const out = [];
    const top = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])[0];
    if (this.stats.longest) out.push({ id: "wordsmith", icon: "📏", title: "Wordsmith", pid: this.stats.longest.pid, detail: `"${this.stats.longest.word}"` });
    const p = top(this.stats.passes); if (p) out.push({ id: "passer", icon: "🔥", title: "Hot Hands", pid: p[0], detail: `${p[1]} passes` });
    const br = top(this.stats.brain); if (br) out.push({ id: "brain", icon: "🧠", title: "Big Brain", pid: br[0], detail: `${br[1]} brain passes` });
    const b = top(this.stats.boom); if (b) out.push({ id: "boom", icon: "🎯", title: "Fuse Whisperer", pid: b[0], detail: `${b[1]} pts guessing booms` });
    return out;
  }

  highlights() {
    return this.groups.filter((g) => g.winner).map((g) => `${this.nick(g.winner)} survived group ${g.id + 1}`).slice(0, 5);
  }
}
