import { BaseGame } from "./base.mjs";
import { cleanText } from "../moderation.mjs";
import { IMPOSTER_FALLBACK_QUESTIONS } from "../content.mjs";
import { fail, normalizeWord, partition, pick, shuffle } from "../util.mjs";

// Exact timings from the product spec (all scaled by the room's timeScale in tests).
export const TIMES = { role: 5000, ask: 10000, answer: 20000, show: 5000, vote: 15000, voteShow: 6000, runoff: 10000, runoffShow: 5000, guess: 10000, final: 9000 };
const OFFLINE_GRACE = 1500;

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const mentionsWord = (text, word) => {
  const w = normalizeWord(word);
  const t = normalizeWord(text);
  return w.length > 0 && t.includes(w);
};
export const censor = (text, word) => text.replace(new RegExp(esc(String(word).trim()).replace(/\s+/g, "\\s*"), "gi"), (m) => "▒".repeat(m.length));

export class Imposter extends BaseGame {
  start() {
    const t = this.room.t();
    const words = shuffle(this.content.items);
    let wi = 0;
    this.fallbackPool = shuffle(IMPOSTER_FALLBACK_QUESTIONS);
    // groups of 4-5 (35 players => seven groups of five)
    this.groups = partition(this.players, { max: 5, floor: 3 }).map((members, id) => {
      const order = shuffle(members);
      const word = words[wi++ % words.length];
      return {
        id, members: order, n: order.length, imposter: pick(order), word: { word: String(word.word).toUpperCase(), related: word.related ?? [] },
        phase: "role", endsAt: t + this.D(TIMES.role), turn: -1, question: null, answers: new Map(), history: [], asked: new Set(),
        votes: new Map(), runoff: null, tally: null, accused: null, tieNote: "", guess: null, guessCorrect: false, outcome: null, scored: false, offlineSince: null,
        fallbackIdx: id,
      };
    });
    this.byPlayer = new Map();
    for (const g of this.groups) for (const m of g.members) this.byPlayer.set(m, g);
    this.hardStop = t + this.D(12 * 60 * 1000);
  }

  live(g) { return g.members.filter((m) => this.here(m) && this.connected(m)); }
  questioner(g) { return g.members[g.turn]; }
  setPhase(g, phase, ms, t) { g.phase = phase; g.endsAt = t + this.D(ms); g.offlineSince = null; }

  fallbackQuestion(g) {
    for (let i = 0; i < this.fallbackPool.length; i++) {
      const q = this.fallbackPool[(g.fallbackIdx++) % this.fallbackPool.length];
      if (!g.asked.has(q.toLowerCase())) return q;
    }
    return this.fallbackPool[0];
  }

  startTurn(g, t) {
    g.turn++;
    if (g.turn >= g.n) return this.startVote(g, t);
    g.question = null; g.answers = new Map();
    this.setPhase(g, "ask", TIMES.ask, t);
    this.room.log("imp_ask", { group: g.id, turn: g.turn + 1, asker: this.nick(this.questioner(g)) });
  }

  openAnswers(g, text, fallback, t) {
    g.question = { text, from: this.questioner(g), fallback };
    g.asked.add(text.toLowerCase());
    this.setPhase(g, "answer", TIMES.answer, t);
  }

  startVote(g, t) { g.votes = new Map(); g.runoff = null; this.setPhase(g, "vote", TIMES.vote, t); this.room.log("imp_vote", { group: g.id }); }

  tally(g, candidates) {
    const counts = new Map();
    for (const [from, to] of g.votes) {
      if (!this.here(from) && !g.members.includes(from)) continue;
      if (candidates && !candidates.includes(to)) continue;
      counts.set(to, (counts.get(to) ?? 0) + 1);
    }
    const max = Math.max(0, ...counts.values());
    const top = [...counts.entries()].filter(([, c]) => c === max && max > 0).map(([id]) => id);
    return { counts: Object.fromEntries(counts), max, top };
  }

  closeVote(g, t) {
    const res = this.tally(g, g.runoff);
    g.tally = { ...res, votes: [...g.votes.entries()].map(([from, to]) => ({ from, to })), runoff: !!g.runoff };
    if (res.top.length === 1) { g.accused = res.top[0]; g.tieNote = ""; }
    else if (res.top.length > 1 && !g.runoff) { g.tieNote = "It's a tie! Runoff vote next."; g.pendingRunoff = res.top; }
    else { g.accused = null; g.tieNote = res.top.length ? "Still tied - nobody is accused." : "Nobody got any votes."; }
    this.setPhase(g, g.runoff ? "runoffShow" : "voteShow", g.runoff ? TIMES.runoffShow : TIMES.voteShow, t);
    this.room.log("imp_votes", { group: g.id, accused: g.accused ? this.nick(g.accused) : null, tie: res.top.length > 1 });
  }

  startGuess(g, t) {
    this.setPhase(g, "guess", TIMES.guess, t);
  }

  finishGroup(g, t) {
    if (g.scored) return;
    g.scored = true;
    const caught = g.accused === g.imposter;
    const imposterWins = g.guessCorrect || !caught;
    g.outcome = { winner: imposterWins ? "imposter" : "crew", reason: g.guessCorrect ? "guess" : caught ? "caught" : g.accused ? "wrong_accusation" : "no_accusation", caught };
    const firstVotes = g.firstVotes ?? g.votes;
    for (const m of g.members) {
      if (!this.here(m)) continue;
      if (m === g.imposter) { if (imposterWins) this.add(m, g.guessCorrect ? 220 : 180); continue; }
      if (!imposterWins) this.add(m, 100);
      if (firstVotes.get(m) === g.imposter) this.add(m, imposterWins ? 30 : 50);
    }
    this.setPhase(g, "final", TIMES.final, t);
    this.room.log("imp_final", { group: g.id, winner: g.outcome.winner, reason: g.outcome.reason });
  }

  tick(t) {
    for (const g of this.groups) {
      if (g.phase === "finished") continue;
      if (t >= this.hardStop && g.phase !== "final") { this.finishGroup(g, t); continue; }
      const live = this.live(g);
      switch (g.phase) {
        case "role": if (t >= g.endsAt) this.startTurn(g, t); break;
        case "ask": {
          const q = this.questioner(g);
          if (!this.connected(q)) g.offlineSince ??= t; else g.offlineSince = null;
          if (t >= g.endsAt || (g.offlineSince !== null && t - g.offlineSince > this.D(OFFLINE_GRACE))) {
            this.openAnswers(g, this.fallbackQuestion(g), true, t);
            this.room.log("imp_fallback", { group: g.id, asker: this.nick(q) });
          }
          break;
        }
        case "answer":
          if (t >= g.endsAt || (live.length > 0 && live.every((m) => g.answers.has(m))) || live.length === 0) {
            for (const m of g.members) if (this.connected(m) || this.here(m)) { /* missing answers stay absent */ }
            this.snapshotTurn(g);
            this.setPhase(g, "show", TIMES.show, t);
          }
          break;
        case "show": if (t >= g.endsAt) this.startTurn(g, t); break;
        case "vote":
          if (t >= g.endsAt || live.length === 0 || live.every((m) => g.votes.has(m))) { g.firstVotes = new Map(g.votes); this.closeVote(g, t); }
          break;
        case "voteShow":
          if (t >= g.endsAt) {
            if (g.pendingRunoff) { g.runoff = g.pendingRunoff; g.pendingRunoff = null; g.votes = new Map(); this.setPhase(g, "runoff", TIMES.runoff, t); }
            else this.startGuess(g, t);
          }
          break;
        case "runoff":
          if (t >= g.endsAt || live.length === 0 || live.every((m) => g.votes.has(m))) this.closeVote(g, t);
          break;
        case "runoffShow": if (t >= g.endsAt) this.startGuess(g, t); break;
        case "guess":
          if (!this.connected(g.imposter)) g.offlineSince ??= t; else g.offlineSince = null;
          if (t >= g.endsAt || g.guess !== null || (g.offlineSince !== null && t - g.offlineSince > this.D(OFFLINE_GRACE))) this.finishGroup(g, t);
          break;
        case "final": if (t >= g.endsAt) g.phase = "finished"; break;
      }
    }
    if (this.groups.every((g) => g.phase === "finished")) this.done = true;
  }

  snapshotTurn(g) {
    g.history.push({
      turn: g.turn, from: g.question.from, question: g.question.text, fallback: g.question.fallback,
      answers: g.members.map((m) => ({ id: m, text: g.answers.get(m) ?? null })),
    });
  }

  checkText(g, pid, raw, opts) {
    const text = cleanText(raw, opts);
    if (pid !== g.imposter && mentionsWord(text, g.word.word)) fail("Don't type the secret word!");
    return text; // the imposter doesn't know the word; their text is censored on reveal instead of rejected (no probing)
  }

  act(pid, a, t) {
    const g = this.byPlayer.get(pid);
    if (!g) fail("You're not in an imposter group.");
    switch (a.type) {
      case "question": {
        if (g.phase !== "ask") fail("It's not question time.");
        if (this.questioner(g) !== pid) fail("It isn't your turn to ask.");
        const text = this.checkText(g, pid, a.text, { min: 3, max: 120, label: "Question" });
        if (g.asked.has(text.toLowerCase())) fail("That question was already asked!");
        this.openAnswers(g, text, false, t);
        this.add(pid, 8);
        return { ok: true };
      }
      case "answer": {
        if (g.phase !== "answer") fail("It's not answer time.");
        if (g.answers.has(pid)) fail("You already answered.");
        g.answers.set(pid, this.checkText(g, pid, a.text, { min: 1, max: 80, label: "Answer" }));
        this.add(pid, 8);
        return { ok: true };
      }
      case "vote": {
        if (g.phase !== "vote" && g.phase !== "runoff") fail("Voting isn't open.");
        if (g.votes.has(pid)) fail("You already voted.");
        const target = String(a.target);
        if (target === pid) fail("You can't vote for yourself.");
        if (!g.members.includes(target) || !this.here(target)) fail("Pick someone in your group.");
        if (g.phase === "runoff" && !g.runoff.includes(target)) fail("Vote for one of the tied players.");
        g.votes.set(pid, target);
        return { ok: true };
      }
      case "guess": {
        if (g.phase !== "guess") fail("It's not guessing time.");
        if (pid !== g.imposter) fail("Only the imposter guesses.");
        if (g.guess !== null) fail("You already guessed.");
        const text = cleanText(a.text, { min: 1, max: 40, label: "Guess" });
        g.guess = text;
        const guess = normalizeWord(text), word = normalizeWord(g.word.word);
        g.guessCorrect = guess === word || guess === word + "s" || guess + "s" === word;
        return { ok: true };
      }
      default: fail("Unknown action.");
    }
  }

  /** Reveal-safe text: the imposter's words are censored if they stumbled on the secret. */
  safe(g, text) { return text === null ? null : censor(text, g.word.word); }

  groupView(g, pid, mode) {
    const t = this.room.t();
    const revealed = g.phase === "final" || g.phase === "finished";
    const isImp = pid === g.imposter;
    const showAnswers = g.phase === "show";
    const asker = g.turn >= 0 && g.turn < g.n ? this.questioner(g) : null;
    const out = {
      id: g.id, phase: g.phase, endsIn: Math.max(0, g.endsAt - t), turn: Math.min(g.turn + 1, g.n), turns: g.n,
      members: g.members.map((m) => ({
        id: m, nickname: this.nick(m), avatar: this.room.players.get(m)?.avatar, connected: this.connected(m),
        asker: m === asker && (g.phase === "ask" || g.phase === "answer" || g.phase === "show"),
        answered: g.phase === "answer" ? g.answers.has(m) : undefined,
        voted: g.phase === "vote" || g.phase === "runoff" ? g.votes.has(m) : undefined,
        asked: g.turn > g.members.indexOf(m) || g.phase === "vote" || revealed,
      })),
      questioner: asker,
      question: g.question ? { text: this.safe(g, g.question.text), from: g.question.from, fallback: g.question.fallback } : null,
      answers: showAnswers ? g.members.map((m) => ({ id: m, nickname: this.nick(m), text: g.answers.has(m) ? this.safe(g, g.answers.get(m)) : null })) : null,
      history: g.history.map((h) => ({ turn: h.turn, from: h.from, question: this.safe(g, h.question), answers: h.answers.map((x) => ({ id: x.id, text: this.safe(g, x.text) })) })),
    };
    if (pid) out.you = { id: pid, role: isImp ? "imposter" : "crew", word: isImp ? null : g.word.word, message: isImp ? "YOU ARE THE IMPOSTER." : null, answered: g.answers.has(pid), voted: g.votes.has(pid) };
    if (g.phase === "vote" || g.phase === "runoff") out.vote = { runoff: g.phase === "runoff" ? g.runoff : null, count: g.votes.size };
    if (g.phase === "voteShow" || g.phase === "runoffShow" || g.phase === "guess" || revealed) {
      if (g.tally) out.tally = { counts: g.tally.counts, votes: g.tally.votes, runoff: g.tally.runoff, accused: g.accused, tieNote: g.tieNote };
    }
    if (g.phase === "guess") out.guess = { submitted: g.guess !== null };
    if (revealed) out.final = { imposter: g.imposter, word: g.word.word, accused: g.accused, guess: g.guess, guessCorrect: g.guessCorrect, outcome: g.outcome };
    if (mode === "dev") out.secrets = { imposter: g.imposter, word: g.word.word };
    return out;
  }

  view(pid, opts, mode) {
    const out = { kind: "imposter" };
    out.groups = this.groups.map((g) => ({ id: g.id, phase: g.phase, turn: Math.min(g.turn + 1, g.n), turns: g.n, size: g.n, winner: g.phase === "final" || g.phase === "finished" ? g.outcome?.winner : null }));
    const g = pid ? this.byPlayer.get(pid) : (opts?.group !== undefined ? this.groups[opts.group] : null);
    if (g) out.group = this.groupView(g, pid, mode);
    return out;
  }

  botHint(pid) {
    const g = this.byPlayer.get(pid);
    if (!g) return null;
    return { imposter: g.imposter === pid, word: g.imposter === pid ? null : g.word.word, related: g.imposter === pid ? [] : g.word.related };
  }

  highlights() {
    const wins = this.groups.filter((g) => g.outcome?.winner === "imposter").length;
    return [`${this.groups.length - wins} of ${this.groups.length} groups caught their imposter`];
  }
}
