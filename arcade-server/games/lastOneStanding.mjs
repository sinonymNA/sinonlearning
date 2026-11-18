import { BaseGame } from "./base.mjs";
import { fail, shuffle } from "../util.mjs";

const READY_MS = 3500, WINDOW_MS = 12000, REVEAL_MS = 4800, TIE_MS = 250, MAX_QUESTIONS = 24, MAX_RETRIES = 3;

/** Advancement ladder: 35 -> 20 -> 10 -> 5 -> 2 -> 1. */
export function nextTarget(alive) {
  if (alive > 20) return 20;
  if (alive > 10) return 10;
  if (alive > 5) return 5;
  if (alive > 2) return 2;
  return 1;
}

export class LastOneStanding extends BaseGame {
  start() {
    this.alive = new Set(this.players);
    this.out = new Map(); // pid -> { round, order, correct, ms }
    this.cons = new Map(this.players.map((p) => [p, 0])); // consolation points
    this.pool = shuffle(this.content.items);
    this.qIndex = 0; this.asked = 0; this.round = 1; this.retries = 0; this.winner = null; this.last = null; this.eliminationOrder = 0;
    this.nextQuestion(this.room.t());
  }

  nextQuestion(t) {
    if (this.qIndex >= this.pool.length) { this.pool = shuffle(this.content.items); this.qIndex = 0; }
    const raw = this.pool[this.qIndex++];
    const order = shuffle(raw.choices.map((_, i) => i));
    this.q = { q: raw.q, choices: order.map((i) => raw.choices[i]), answer: order.indexOf(raw.answer), answers: new Map(), openAt: t + this.D(READY_MS), closeAt: t + this.D(READY_MS + WINDOW_MS) };
    this.asked++;
    this.phase = "ready"; this.phaseEnds = this.q.openAt;
    this.room.log("los_question", { n: this.asked, alive: this.alive.size, q: raw.q });
  }

  tick(t) {
    if (this.phase === "ready" && t >= this.q.openAt) { this.phase = "question"; this.phaseEnds = this.q.closeAt; }
    if (this.phase === "question") {
      const everyone = this.players.filter((p) => this.here(p) && this.connected(p));
      const finished = everyone.length > 0 && everyone.every((p) => this.q.answers.has(p));
      if (t >= this.q.closeAt || finished) this.resolve(t);
    } else if (this.phase === "reveal" && t >= this.phaseEnds) {
      if (this.alive.size <= 1 || this.asked >= MAX_QUESTIONS) this.finish();
      else this.nextQuestion(t);
    }
  }

  finish() {
    if (this.alive.size === 1) this.winner = [...this.alive][0];
    if (this.winner) this.add(this.winner, 250);
    this.phase = "done"; this.done = true;
  }

  act(pid, a, t) {
    if (a.type !== "answer") fail("Unknown action.");
    if (this.phase === "ready") fail("Wait for the question to open!");
    if (this.phase !== "question") fail("Too late for this question.");
    if (t >= this.q.closeAt) fail("Too late for this question.");
    if (this.q.answers.has(pid)) fail("You already answered.");
    const choice = Number(a.choice);
    if (!Number.isInteger(choice) || choice < 0 || choice >= this.q.choices.length) fail("Pick one of the choices.");
    this.q.answers.set(pid, { choice, ms: Math.max(0, Math.round(t - this.q.openAt)) });
    return { ok: true };
  }

  resolve(t) {
    const q = this.q;
    const window = q.closeAt - q.openAt;
    const aliveList = [...this.alive];
    const correct = aliveList.map((pid) => ({ pid, a: q.answers.get(pid) })).filter((r) => r.a && r.a.choice === q.answer).sort((x, y) => x.a.ms - y.a.ms);
    const target = nextTarget(aliveList.length);
    const finale = aliveList.length === 2;
    let advance = [], tie = false, retry = null;

    if (correct.length === 0) retry = "Nobody got it right - new question!";
    else if (finale) {
      if (correct.length === 2 && correct[1].a.ms - correct[0].a.ms < TIE_MS) { retry = "Dead heat! Sudden-death question..."; tie = true; }
      else advance = [correct[0]];
    } else if (correct.length < 2 && this.retries < MAX_RETRIES) retry = "Only one correct answer - new question!";
    else if (correct.length <= target) advance = correct;
    else if (correct[target].a.ms - correct[target - 1].a.ms >= TIE_MS) advance = correct.slice(0, target);
    else {
      // Tie window: players whose answers landed within TIE_MS of each other around the cut line are
      // indistinguishable, so the server draws among them at random.
      let lo = target - 1, hi = target;
      while (lo > 0 && correct[lo].a.ms - correct[lo - 1].a.ms < TIE_MS) lo--;
      while (hi < correct.length - 1 && correct[hi + 1].a.ms - correct[hi].a.ms < TIE_MS) hi++;
      advance = [...correct.slice(0, lo), ...shuffle(correct.slice(lo, hi + 1)).slice(0, target - lo)];
      tie = true;
    }

    // consolation round: eliminated players score separately
    const counts = q.choices.map(() => 0);
    for (const a of q.answers.values()) counts[a.choice]++;
    for (const [pid, a] of q.answers) {
      if (this.alive.has(pid) || !this.here(pid)) continue;
      if (a.choice === q.answer) { const pts = 12 + Math.round(18 * (1 - a.ms / window)); this.cons.set(pid, (this.cons.get(pid) ?? 0) + pts); this.add(pid, pts); }
    }
    for (const pid of aliveList) if (q.answers.has(pid)) this.add(pid, 5);

    this.last = { correct: q.answer, counts, advanced: [], eliminated: [], tie, retry, finale, nobody: correct.length === 0, answered: q.answers.size };
    if (retry) { this.retries++; this.room.log("los_retry", { retry }); }
    else {
      this.retries = 0;
      const keep = new Set(advance.map((r) => r.pid));
      for (const r of advance) this.add(r.pid, 100 + Math.round(60 * (1 - r.a.ms / window)));
      const cut = aliveList.filter((p) => !keep.has(p)).sort((x, y) => {
        const ax = q.answers.get(x), ay = q.answers.get(y);
        const cx = ax?.choice === q.answer ? 1 : 0, cy = ay?.choice === q.answer ? 1 : 0;
        return cy - cx || (ax?.ms ?? 1e9) - (ay?.ms ?? 1e9);
      });
      cut.forEach((pid) => {
        const a = q.answers.get(pid);
        if (a?.choice === q.answer) this.add(pid, 20);
        this.alive.delete(pid);
        this.out.set(pid, { round: this.round, order: this.eliminationOrder++, correct: a?.choice === q.answer });
      });
      this.last.advanced = [...keep]; this.last.eliminated = cut;
      this.round++;
      this.room.log("los_round", { advanced: keep.size, eliminated: cut.length, tie });
    }
    this.phase = "reveal"; this.phaseEnds = t + this.D(REVEAL_MS);
  }

  /** placements 1..n: survivors first, then by round eliminated (later = better). */
  placements() {
    const rows = this.players.filter((p) => this.here(p)).map((pid) => ({ pid, out: this.out.get(pid) }));
    rows.sort((a, b) => (a.out ? 1 : 0) - (b.out ? 1 : 0) || (b.out?.round ?? 0) - (a.out?.round ?? 0) || (b.out?.order ?? 0) - (a.out?.order ?? 0));
    return rows.map((r, i) => ({ id: r.pid, place: i + 1 }));
  }

  skip() { if (this.phase === "question" || this.phase === "ready") { this.q.openAt = Math.min(this.q.openAt, this.room.t()); this.q.closeAt = this.room.t(); this.phase = "question"; } else this.finish(); }

  botHint() { return this.q?.answer; }

  view(pid, opts, mode) {
    const t = this.room.t();
    const q = this.q;
    const openIn = Math.max(0, q.openAt - t);
    const showQ = this.phase !== "ready" || openIn <= 2200; // preload shortly before open so everyone has it
    const out = {
      kind: "last_one_standing", phase: this.phase, round: this.round, asked: this.asked, aliveCount: this.alive.size, total: this.players.length,
      target: this.alive.size > 1 ? nextTarget(this.alive.size) : 1, finale: this.alive.size === 2,
      openIn: Math.round(openIn), closeIn: Math.round(Math.max(0, q.closeAt - t)), windowMs: q.closeAt - q.openAt,
      answeredCount: q.answers.size,
      question: showQ ? { q: q.q, choices: q.choices } : null,
      players: this.players.filter((p) => this.here(p)).map((p) => ({ id: p, alive: this.alive.has(p), nickname: this.nick(p), avatar: this.room.players.get(p)?.avatar, place: undefined })),
      winner: this.winner, lastRound: this.last,
      consolation: [...this.cons.entries()].filter(([p, s]) => s > 0 && this.here(p)).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, score]) => ({ id, nickname: this.nick(id), score })),
    };
    if (this.phase === "reveal" || this.phase === "done") out.question = { q: q.q, choices: q.choices };
    if (this.phase === "reveal" || this.phase === "done" || mode === "dev") out.correct = q.answer;
    if (pid) {
      const a = q.answers.get(pid);
      out.you = { alive: this.alive.has(pid), answered: !!a, choice: a?.choice ?? null, correct: this.phase === "reveal" && a ? a.choice === q.answer : null, place: this.phase === "done" ? this.placements().find((p) => p.id === pid)?.place : null };
    }
    if (this.phase === "done") out.placements = this.placements();
    return out;
  }

  highlights() {
    const lines = [];
    if (this.winner) lines.push(`${this.nick(this.winner)} is the last one standing!`);
    const c = [...this.cons.entries()].sort((a, b) => b[1] - a[1])[0];
    if (c && c[1] > 0) lines.push(`${this.nick(c[0])} won the consolation round (${c[1]} pts)`);
    return lines;
  }
}
