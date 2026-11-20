import test from "node:test";
import assert from "node:assert/strict";
import * as AB from "../abyss.mjs";
import { handleAbyss } from "../api.mjs";
import { MemoryStore } from "../store.mjs";
import { studentCtx, guestCtx } from "./helpers.mjs";

const A = (c, body) => { c.now += 3000; return handleAbyss(c, body); };
const answerFor = (id, tier) => AB.getPrompt(id).tiers[tier][0].split("=")[0];

test("themes: five themes, each with a healthy bank that is also part of the general Abyss pool", () => {
  assert.deepEqual(AB.THEME_META.map((t) => t.id), ["movies", "sports", "music", "tv", "games"]);
  for (const t of AB.THEME_META) {
    const bank = AB.THEME_PROMPTS.filter((p) => p.theme === t.id);
    assert.ok(bank.length >= 8, `${t.id} has ${bank.length} prompts`);
    for (const p of bank) { assert.ok(AB.PROMPTS.includes(p)); assert.equal(AB.getPrompt(p.id), p); }
    assert.ok(t.name && t.unit && t.c1 && t.c2 && t.blurb);
  }
  const ids = AB.THEME_PROMPTS.map((p) => p.id); assert.equal(new Set(ids).size, ids.length, "ids unique");
  assert.ok(AB.THEME_PROMPTS.length >= 50);
});

test("theme banks: all six tiers filled, no duplicate answers across tiers, and nothing blank", () => {
  for (const p of AB.THEME_PROMPTS) {
    const seen = new Map();
    for (const tier of AB.TIER_ORDER) {
      assert.ok(p.tiers[tier].length >= 1, `${p.id} has ${tier}`);
      for (const e of p.tiers[tier]) for (const f of e.split("=")) {
        const n = AB.norm(f); if (!n) continue;
        const prev = seen.get(n); if (prev && prev !== e) assert.fail(`${p.id}: "${f}" appears in two entries`);
        seen.set(n, e);
      }
    }
  }
});

test("theme run: seven distinct prompts from ONE theme, reproducible per id, different between ids", () => {
  for (const t of AB.THEME_META) {
    const r = AB.newRun("theme", { id: "run-a", theme: t.id });
    assert.equal(r.ids.length, 7); assert.equal(new Set(r.ids).size, 7);
    for (const id of r.ids) assert.equal(AB.getPrompt(id).theme, t.id);
    assert.deepEqual(AB.newRun("theme", { id: "run-a", theme: t.id }).ids, r.ids);
  }
  assert.notDeepEqual(AB.newRun("theme", { id: "run-a", theme: "movies" }).ids, AB.newRun("theme", { id: "run-b", theme: "movies" }).ids);
});

test("theme run: no lives, ends after seven prompts, scores like any dive", () => {
  const run = AB.newRun("theme", { id: "x1", theme: "sports" }); const now = 1_000_000; let t = now;
  assert.equal(run.lives, null);
  for (let i = 0; i < 7; i++) {
    const q = AB.question(run, t); assert.equal(q.total, 7); t = run.qStartedAt + (i % 2 ? AB.TIME_LIMIT_MS : 500);
    const r = AB.submit(run, i % 2 ? "zzzz not an answer" : answerFor(run.ids[i], "shoal"), t, Math.random, { expired: i % 2 === 1 });
    assert.ok(r.result); t += 100;
  }
  assert.equal(run.done, true); assert.ok(run.points > 0 && run.points <= 700);
  assert.equal(AB.publicRun(run).theme, "sports"); assert.match(AB.shareText(run, null), /^Sports Arena/);
});

test("sanitizeRun: unknown themes are refused and prompt ids from other themes are dropped", () => {
  assert.equal(AB.sanitizeRun({ v: 1, mode: "theme", theme: "nope" }), null);
  const r = AB.newRun("theme", { id: "q", theme: "music" });
  const dirty = { ...r, ids: [...r.ids, AB.newRun("theme", { id: "q", theme: "tv" }).ids[0]] };
  assert.ok(AB.sanitizeRun(dirty).ids.every((id) => AB.getPrompt(id).theme === "music"));
});

test("API (signed in): themed dive is server-timed, saved, awards pearls once and keeps a best score per theme", async () => {
  const store = new MemoryStore(); const ctx = { ...studentCtx(store, "diver-theme"), now: Date.UTC(2032, 6, 4, 12) };
  await assert.rejects(handleAbyss(ctx, { type: "start", mode: "theme", theme: "nope" }), /theme/i);
  const home = await handleAbyss(ctx, { type: "home" }); assert.equal(home.themes.length, 5); assert.ok(home.themes.every((t) => t.count >= 8));
  let r = await handleAbyss(ctx, { type: "start", mode: "theme", theme: "movies" });
  assert.equal(r.run.theme, "movies"); assert.equal(r.run.total, 7);
  const resumed = await handleAbyss(ctx, { type: "start", mode: "theme", theme: "movies" });
  assert.equal(resumed.question.n, 0, "resumes the same unfinished run");
  let a, done = false, n = 0;
  while (!done && n++ < 20) {
    const stored = await store.getMastery("diver-theme", "abyss:theme:movies");
    a = await A(ctx, { type: "answer", mode: "theme", theme: "movies", answer: answerFor(stored.ids[stored.i], "reef") }); done = a.done;
  }
  assert.equal(done, true); assert.equal(a.run.points, 7 * 60); assert.ok(a.finish.pearls > 0);
  assert.equal(a.finish.profile.themeBest.movies, 420); assert.equal(a.finish.profile.themeRuns, 1);
  const again = await handleAbyss(ctx, { type: "start", mode: "theme", theme: "movies" });
  assert.equal(again.run.i, 0, "a finished themed run starts a fresh one"); assert.equal(again.run.done, false);
  await assert.rejects(handleAbyss(ctx, { type: "answer", mode: "theme", theme: "sports", answer: "x" }), /Start the dive/);
});

test("API (guest): themed dive uses a client-held run and earns nothing", async () => {
  const ctx = { ...guestCtx(new MemoryStore()), now: Date.UTC(2032, 6, 5, 12) };
  let d = await handleAbyss(ctx, { type: "start", mode: "theme", theme: "tv" });
  assert.ok(d.guestRun); let run = d.guestRun, last;
  for (let i = 0; i < 7; i++) {
    last = await A(ctx, { type: "answer", mode: "theme", theme: "tv", answer: answerFor(run.ids[i], "shoal"), run }); run = last.guestRun;
  }
  assert.equal(last.done, true); assert.equal(last.finish.guest, true);
});

test("theme answers never leak the answer key before a prompt is answered", async () => {
  const store = new MemoryStore(); const ctx = { ...studentCtx(store, "diver-leak"), now: Date.UTC(2032, 6, 6, 12) };
  const r = await handleAbyss(ctx, { type: "start", mode: "theme", theme: "games" });
  const json = JSON.stringify(r); assert.ok(!json.includes("tiers")); assert.ok(!/pikachu/i.test(json) || !/pokemon/i.test(r.question.prompt));
});
