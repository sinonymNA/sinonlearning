import { BaseGame } from "./base.mjs";
import { appendSegs, hasInk, newLog, compact } from "../drawing.mjs";
import { cleanText } from "../moderation.mjs";
import { fail, partition, shuffle } from "../util.mjs";

const STAGE_MS = [75000, 25000, 75000];
const STEP_MS = [2000, 3500, 2500, 3500, 1500]; // prompt, drawing 1, description, drawing 2, hold
const VOTE_MS = 10000, VOTE_REVEAL_MS = 4500, INTRO_STAGE_MS = 1800;

/**
 * Chains: chain c starts with member c. At stage s, member i works on chain (i + s) % n.
 * With n >= 3 nobody ever receives their own chain again (chain i is touched by i, i-1, i-2).
 */
export class Telephone extends BaseGame {
  start() {
    const t = this.room.t();
    const prompts = shuffle(this.content.items);
    let pi = 0;
    this.groups = partition(this.players, { max: 7, floor: 3 }).map((raw, id) => {
      const members = shuffle(raw);
      return {
        id, members, n: members.length, stage: 0, endsAt: t + this.D(STAGE_MS[0]), status: "stage", // stage | reveal | vote | voteReveal | done
        chains: members.map((owner) => ({ owner, prompt: String(prompts[pi++ % prompts.length]), d1: newLog(), desc: null, d2: newLog(), descBy: null, d2By: null })),
        submitted: [new Set(), new Set(), new Set()], ri: 0, step: 0, stepEndsAt: 0, votes: new Map(), voteResult: null, funniest: null,
      };
    });
    this.byPlayer = new Map();
    for (const g of this.groups) g.members.forEach((m, i) => this.byPlayer.set(m, { g, i }));
  }

  chainIndex(g, i, stage) { return (i + stage) % g.n; }

  tick(t) {
    for (const g of this.groups) {
      if (g.status === "stage") {
        const live = g.members.filter((m) => this.here(m) && this.connected(m));
        const allDone = live.length > 0 && live.every((m) => g.submitted[g.stage].has(m));
        if (t >= g.endsAt || allDone) this.endStage(g, t);
      } else if (g.status === "reveal") {
        if (t >= g.stepEndsAt) this.advanceReveal(g, t);
      } else if (g.status === "vote") {
        const live = g.members.filter((m) => this.here(m) && this.connected(m));
        if (t >= g.endsAt || (live.length > 0 && live.every((m) => g.votes.has(m)))) this.closeVote(g, t);
      } else if (g.status === "voteReveal" && t >= g.endsAt) g.status = "done";
    }
    if (this.groups.every((g) => g.status === "done")) this.done = true;
  }

  endStage(g, t) {
    // score + fill in whatever was missing so the chain keeps going
    g.members.forEach((m, i) => {
      const c = g.chains[this.chainIndex(g, i, g.stage)];
      if (g.stage === 0 && hasInk(c.d1)) this.add(m, 40);
      if (g.stage === 1) { if (c.desc) this.add(m, 40); else { c.desc = "(no description - time ran out)"; c.descBy = m; c.missing = true; } }
      if (g.stage === 2 && hasInk(c.d2)) this.add(m, 40);
    });
    g.stage++;
    if (g.stage <= 2) { g.endsAt = t + this.D(STAGE_MS[g.stage]) + this.D(INTRO_STAGE_MS); g.stageStart = t; this.room.log("tel_stage", { group: g.id, stage: g.stage }); }
    else { g.status = "reveal"; g.ri = 0; g.step = 0; g.stepEndsAt = t + this.D(STEP_MS[0]); this.room.log("tel_reveal", { group: g.id }); }
  }

  advanceReveal(g, t) {
    g.step++;
    if (g.step >= STEP_MS.length) { g.ri++; g.step = 0; }
    if (g.ri >= g.n) { g.status = "vote"; g.endsAt = t + this.D(VOTE_MS); return; }
    g.stepEndsAt = t + this.D(STEP_MS[g.step]);
  }

  closeVote(g, t) {
    const counts = new Array(g.n).fill(0);
    for (const c of g.votes.values()) counts[c]++;
    const max = Math.max(0, ...counts);
    g.voteResult = counts;
    g.funniest = max > 0 ? counts.flatMap((c, i) => (c === max ? [i] : [])) : [];
    for (const ci of g.funniest) {
      const chain = g.chains[ci];
      for (const m of new Set([chain.owner, chain.descBy, chain.d2By])) if (m) this.add(m, 50);
    }
    g.status = "voteReveal"; g.endsAt = t + this.D(VOTE_REVEAL_MS);
  }

  act(pid, a, t) {
    const rec = this.byPlayer.get(pid);
    if (!rec) fail("You're not in a telephone group.");
    const { g, i } = rec;
    if (a.type === "vote") {
      if (g.status !== "vote") fail("Voting isn't open.");
      const ci = Number(a.chain);
      if (!Number.isInteger(ci) || ci < 0 || ci >= g.n) fail("Pick a chain.");
      if (g.chains[ci].owner === pid) fail("You can't vote for your own chain.");
      if (g.votes.has(pid)) fail("You already voted.");
      g.votes.set(pid, ci); this.add(pid, 10);
      return { ok: true };
    }
    if (g.status !== "stage") fail("Hang tight - this stage is over.");
    if (t >= g.endsAt) fail("Time's up for this stage.");
    if (t < (g.stageStart ?? 0) + this.D(INTRO_STAGE_MS) && g.stage > 0) { /* allow early typing */ }
    const chain = g.chains[this.chainIndex(g, i, g.stage)];
    if (a.type === "draw") {
      if (g.stage === 1) fail("This stage is for describing.");
      if (g.submitted[g.stage].has(pid)) fail("You already submitted.");
      const log = g.stage === 0 ? chain.d1 : chain.d2;
      appendSegs(log, a.segs);
      if (g.stage === 2) chain.d2By = pid; else chain.d1By = pid;
      return { ok: true, n: log.segs.length };
    }
    if (a.type === "describe") {
      if (g.stage !== 1) fail("This stage is for drawing.");
      if (chain.desc) fail("You already described this drawing.");
      chain.desc = cleanText(a.text, { min: 2, max: 100, label: "Description" });
      chain.descBy = pid; g.submitted[1].add(pid);
      return { ok: true };
    }
    if (a.type === "done") {
      if (g.stage === 1 && !chain.desc) fail("Type your description first.");
      g.submitted[g.stage].add(pid); return { ok: true };
    }
    fail("Unknown action.");
  }

  revealPayload(g, opts) {
    const have = Math.max(0, Number(opts?.tel?.ci) || 0), st = Number.isInteger(opts?.tel?.st) ? opts.tel.st : -1;
    const out = [];
    for (let ci = have; ci <= Math.min(g.ri, g.n - 1); ci++) {
      const c = g.chains[ci];
      const upto = ci < g.ri ? 4 : g.step;
      const from = ci === have ? st + 1 : 0;
      const e = { ci, owner: this.nick(c.owner), upto };
      if (from <= 0 && upto >= 0) e.prompt = c.prompt;
      if (from <= 1 && upto >= 1) e.d1 = compact(c.d1);
      if (from <= 2 && upto >= 2) { e.desc = c.desc; e.descBy = this.nick(c.descBy); }
      if (from <= 3 && upto >= 3) e.d2 = compact(c.d2);
      out.push(e);
    }
    return out;
  }

  view(pid, opts) {
    const t = this.room.t();
    const out = { kind: "telephone", stageMs: STAGE_MS };
    const rec = pid ? this.byPlayer.get(pid) : null;
    out.groups = this.groups.map((x) => ({ id: x.id, status: x.status, stage: x.stage, ri: x.ri, size: x.n }));
    const g = rec?.g ?? (opts?.group !== undefined ? this.groups[opts.group] : null);
    if (!g) return out;
    out.group = { id: g.id, status: g.status, stage: g.stage, n: g.n, endsIn: Math.max(0, g.endsAt - t), stageTotal: STAGE_MS[Math.min(2, g.stage)], submitted: g.status === "stage" ? g.submitted[g.stage].size : g.n, size: g.n };
    if (g.status === "stage" && rec) {
      const ci = this.chainIndex(g, rec.i, g.stage), chain = g.chains[ci];
      const done = g.submitted[g.stage].has(pid);
      const task = { stage: g.stage, done };
      if (g.stage === 0) { task.kind = "draw"; task.prompt = chain.prompt; task.key = `t${g.id}:0`; task.existing = chain.d1.segs.length; }
      else if (g.stage === 1) { task.kind = "describe"; task.key = `t${g.id}:1:${ci}`; task.submitted = chain.desc ?? null; task.src = opts?.tel?.src === task.key ? null : compact(chain.d1); }
      else { task.kind = "draw"; task.prompt = null; task.description = chain.desc; task.key = `t${g.id}:2`; task.existing = chain.d2.segs.length; }
      out.task = task;
    }
    if (g.status === "reveal" || g.status === "vote" || g.status === "voteReveal" || g.status === "done") {
      out.reveal = { ri: Math.min(g.ri, g.n - 1), step: g.step, stepMs: STEP_MS, stepIn: Math.max(0, g.stepEndsAt - t), chains: g.status === "reveal" ? this.revealPayload(g, opts) : [] };
      if (g.status !== "reveal") out.reveal.ri = g.n;
    }
    if (g.status === "vote" || g.status === "voteReveal" || g.status === "done") {
      out.vote = {
        options: g.chains.map((c, ci) => ({ ci, owner: this.nick(c.owner), prompt: c.prompt, desc: c.desc, ownerId: c.owner, mine: c.owner === pid })),
        voted: pid ? g.votes.has(pid) : null, counts: g.status === "vote" ? null : g.voteResult, funniest: g.status === "vote" ? null : g.funniest, votedCount: g.votes.size,
      };
    }
    return out;
  }

  botHint(pid) {
    const rec = this.byPlayer.get(pid);
    if (!rec) return null;
    const { g, i } = rec;
    const chain = g.chains[this.chainIndex(g, i, g.stage)];
    return { stage: g.stage, status: g.status, prompt: chain.prompt };
  }

  awards() {
    const out = [];
    for (const g of this.groups) for (const ci of g.funniest ?? []) {
      const c = g.chains[ci]; const votes = g.voteResult?.[ci] ?? 0;
      if (votes > 0 && out.length < 3) out.push({ id: `funny${g.id}`, icon: "😂", title: "Funniest Chain", pid: c.owner, detail: `"${c.prompt}" (${votes} votes)` });
    }
    return out;
  }

  highlights() { return [`${this.groups.reduce((a, g) => a + g.n, 0)} chains were telephoned`]; }
}
