import { BaseGame } from "./base.mjs";
import { appendSegs, newLog } from "../drawing.mjs";
import { editDistance, fail, normalizeWord, partition, shuffle } from "../util.mjs";

const TURN_MS = 30000, REVEAL_MS = 4200, MAX_TURNS = 5;

export class QuickDraw extends BaseGame {
  start() {
    const t = this.room.t();
    this.prompts = shuffle(this.content.items);
    this.pi = 0;
    this.groups = partition(this.players, { max: 7, floor: 3 }).map((members, id) => ({
      id, members, order: shuffle(members), turn: 0, cursor: 0, turns: Math.min(members.length, MAX_TURNS), status: "pause", artist: null, word: "", key: 0,
      log: newLog(), guessed: new Map(), startedAt: 0, endsAt: 0, until: t + this.D(1500), lastGuess: new Map(), tries: new Map(), reveal: [], revealOrder: [], note: "",
    }));
    this.byPlayer = new Map();
    for (const g of this.groups) for (const m of g.members) this.byPlayer.set(m, g);
  }

  nextWord() {
    if (this.pi >= this.prompts.length) { this.prompts = shuffle(this.content.items); this.pi = 0; }
    return String(this.prompts[this.pi++]);
  }

  beginTurn(g, t) {
    if (g.turn >= g.turns) return this.finishGroup(g);
    let artist = null;
    for (let i = 0; i < g.order.length; i++) {
      const cand = g.order[(g.cursor + i) % g.order.length];
      if (this.here(cand) && this.connected(cand)) { artist = cand; g.cursor = (g.cursor + i + 1) % g.order.length; break; }
    }
    if (!artist) return this.finishGroup(g);
    g.turn++;
    g.artist = artist; g.word = this.nextWord(); g.key = g.id * 1000 + g.turn; g.log = newLog();
    g.guessed = new Map(); g.tries = new Map(); g.lastGuess = new Map(); g.status = "draw"; g.startedAt = t; g.endsAt = t + this.D(TURN_MS); g.offlineSince = null; g.note = "";
    g.revealOrder = shuffle([...Array(normalizeWord(g.word).length).keys()]);
    this.room.log("qd_turn", { group: g.id, turn: g.turn, artist: this.nick(artist) });
  }

  finishGroup(g) { g.status = "done"; }

  endTurn(g, t, why = "time") {
    if (g.status !== "draw") return;
    const guessers = g.guessed.size;
    if (guessers) this.add(g.artist, guessers * 30 + (guessers >= g.members.length - 1 ? 25 : 0));
    g.status = "reveal"; g.until = t + this.D(REVEAL_MS); g.note = why === "artist_left" ? "The artist left - no points this round." : guessers === 0 ? "Nobody guessed it!" : "";
    this.room.log("qd_end", { group: g.id, word: g.word, guessers, why });
  }

  tick(t) {
    for (const g of this.groups) {
      if (g.status === "pause" && t >= g.until) this.beginTurn(g, t);
      else if (g.status === "draw") {
        const others = g.members.filter((m) => m !== g.artist && this.here(m) && this.connected(m));
        if (!this.here(g.artist) || !this.connected(g.artist)) { g.offlineSince ??= t; } else g.offlineSince = null;
        if (g.offlineSince !== null && t - g.offlineSince > this.D(6000)) this.endTurn(g, t, "artist_left");
        else if (t >= g.endsAt || (others.length > 0 && others.every((m) => g.guessed.has(m)))) this.endTurn(g, t);
      } else if (g.status === "reveal" && t >= g.until) this.beginTurn(g, t);
    }
    if (this.groups.every((g) => g.status === "done")) this.done = true;
  }

  act(pid, a, t) {
    const g = this.byPlayer.get(pid);
    if (!g) fail("You're not in a drawing group.");
    if (a.type === "draw") {
      if (g.status !== "draw" || g.artist !== pid) fail("You are not the artist right now.");
      appendSegs(g.log, a.segs);
      return { ok: true, n: g.log.segs.length };
    }
    if (a.type === "guess") {
      if (g.status !== "draw") fail("No round to guess in right now.");
      if (g.artist === pid) fail("The artist can't guess.");
      if (g.guessed.has(pid)) fail("You already got it!");
      if (t - (g.lastGuess.get(pid) ?? -1e9) < this.D(450)) fail("Slow down a little.");
      const tries = (g.tries.get(pid) ?? 0) + 1;
      if (tries > 40) fail("That's a lot of guesses - wait for the next round.");
      g.tries.set(pid, tries); g.lastGuess.set(pid, t);
      const guess = normalizeWord(String(a.text ?? "").slice(0, 60));
      const word = normalizeWord(g.word);
      if (!guess) fail("Type a guess first.");
      if (guess === word || guess === word + "s" || guess === word + "es" || guess + "s" === word) {
        const frac = Math.min(1, (t - g.startedAt) / (g.endsAt - g.startedAt));
        const pts = 50 + Math.round(50 * (1 - frac));
        g.guessed.set(pid, { ms: Math.round(t - g.startedAt), pts });
        this.add(pid, pts);
        return { ok: true, correct: true, points: pts };
      }
      return { ok: true, correct: false, close: word.length >= 4 && editDistance(guess, word) <= 1 };
    }
    fail("Unknown action.");
  }

  mask(g, t) {
    const word = String(g.word);
    const norm = normalizeWord(word);
    const frac = (t - g.startedAt) / Math.max(1, g.endsAt - g.startedAt);
    const reveal = new Set(frac > 0.75 && norm.length >= 4 ? g.revealOrder.slice(0, 2) : frac > 0.5 && norm.length >= 4 ? g.revealOrder.slice(0, 1) : []);
    let k = 0;
    return [...word].map((ch) => (/[a-z0-9]/i.test(ch) ? (reveal.has(k++) ? ch.toUpperCase() : "_") : "/")).join(" ").replace(/ \/ /g, "   ");
  }

  groupView(g, pid, opts) {
    const t = this.room.t();
    const isArtist = pid && g.artist === pid;
    const showWord = g.status === "reveal" || isArtist;
    const from = opts?.draw && opts.draw.key === g.key ? Math.max(0, opts.draw.from | 0) : 0;
    const wantSegs = !isArtist || !opts?.draw || opts.draw.key !== g.key;
    return {
      id: g.id, status: g.status, turn: g.turn, turns: g.turns, artist: g.artist,
      artistName: g.artist ? this.nick(g.artist) : null, endsIn: Math.max(0, (g.status === "draw" ? g.endsAt : g.until) - t), totalMs: g.endsAt - g.startedAt,
      mask: g.status === "draw" ? this.mask(g, t) : null, word: showWord ? g.word : null, note: g.note,
      members: g.members.map((m) => ({ id: m, nickname: this.nick(m), avatar: this.room.players.get(m)?.avatar, points: this.points.get(m) ?? 0, guessed: g.guessed.has(m), artist: m === g.artist, connected: this.connected(m) })),
      draw: { key: g.key, from, segs: wantSegs ? g.log.segs.slice(from) : [], total: g.log.segs.length },
      you: pid ? { artist: !!isArtist, guessed: g.guessed.has(pid), points: g.guessed.get(pid)?.pts ?? 0 } : undefined,
      guessedCount: g.guessed.size,
    };
  }

  view(pid, opts) {
    const g = pid ? this.byPlayer.get(pid) : null;
    const out = { kind: "quick_draw" };
    if (g) out.group = this.groupView(g, pid, opts);
    else if (opts?.group !== undefined && this.groups[opts.group]) out.group = this.groupView(this.groups[opts.group], null, opts);
    out.groups = this.groups.map((x) => ({ id: x.id, status: x.status, turn: x.turn, turns: x.turns, artist: x.artist ? this.nick(x.artist) : null, guessed: x.guessed.size, size: x.members.length }));
    return out;
  }

  botHint(pid) { const g = this.byPlayer.get(pid); return g?.status === "draw" ? { word: g.word, artist: g.artist === pid } : null; }
  highlights() { return [`${this.groups.length} groups drew ${this.groups.reduce((a, g) => a + g.turns, 0)} masterpieces`]; }
}
