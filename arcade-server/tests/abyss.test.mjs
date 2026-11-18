import test from "node:test";
import assert from "node:assert/strict";
import * as AB from "../abyss.mjs";
import { handleAbyss, handleEconomy } from "../api.mjs";
import { FISH, ABYSS_PACK_IDS, PACK_IDS, PACKS, packOdds, rollPack, CHARACTERS } from "../characters.mjs";
import { MemoryStore } from "../store.mjs";
import { studentCtx, guestCtx } from "./helpers.mjs";

test("prompt bank: every prompt has all six tiers, no empty/duplicate answers within a tier, and its rule holds for every answer", () => {
  assert.ok(AB.PROMPTS.length >= 20);
  const ids = new Set();
  for (const p of AB.PROMPTS) {
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`); ids.add(p.id);
    for (const t of AB.TIER_ORDER) assert.ok(p.tiers[t]?.length >= 1, `${p.id} has no ${t} answers`);
    const total = AB.TIER_ORDER.reduce((n, t) => n + p.tiers[t].length, 0);
    assert.ok(total >= 15, `${p.id} needs more answers`);
    for (const t of AB.TIER_ORDER) {
      const seen = new Set();
      for (const e of p.tiers[t]) { const name = AB.norm(e.split("=")[0]); assert.ok(name, `${p.id}/${t} empty answer`); assert.ok(!seen.has(name), `${p.id}/${t} repeats ${name}`); seen.add(name); }
    }
    if (p.rule) for (const t of AB.TIER_ORDER) for (const e of p.tiers[t]) for (const form of e.split("=")) {
      const n = AB.norm(form).replace(/ /g, "");
      if (p.rule.startsWith) assert.ok(n.startsWith(p.rule.startsWith), `${p.id}: ${form} must start with ${p.rule.startsWith}`);
      if (p.rule.endsWith) assert.ok(n.endsWith(p.rule.endsWith), `${p.id}: ${form} must end with ${p.rule.endsWith}`);
    }
  }
});

test("matching: aliases, accents, 'the', small typos (incl. swapped letters); ambiguous typos and junk score nothing", () => {
  const p = AB.getPrompt("country-b");
  assert.equal(AB.matchAnswer(p, "Brasil").name, "brazil");
  assert.equal(AB.matchAnswer(p, "  BRUNEI Darussalam ").tier, "clever");
  assert.equal(AB.matchAnswer(p, "The Bahamas").name, "bahamas");
  assert.equal(AB.matchAnswer(p, "burkina fasso").tier, "pearl");
  assert.equal(AB.matchAnswer(p, "Bolivai").name, "bolivia");
  assert.equal(AB.matchAnswer(p, "france"), null);
  assert.equal(AB.matchAnswer(p, "b"), null);
  assert.equal(AB.matchAnswer(p, ""), null);
  assert.equal(AB.matchAnswer(p, "brazi").tier, "bubble");
  assert.equal(AB.matchAnswer(AB.getPrompt("element"), "Aluminium").tier, "shoal");
  assert.equal(AB.matchAnswer(AB.getPrompt("greek-myth"), "ZEUS").points, undefined);
  assert.equal(AB.TIERS.pearl.points, 100); assert.equal(AB.TIERS.bubble.points, 10);
});

test("daily dive: 7 prompts, deterministic per date, varied categories, same for everyone", () => {
  const a = AB.dailyIds("2032-01-01"), b = AB.dailyIds("2032-01-01"), c = AB.dailyIds("2032-01-02");
  assert.deepEqual(a, b); assert.notDeepEqual(a, c);
  assert.equal(a.length, 7); assert.equal(new Set(a).size, 7);
  assert.equal(new Set(a.map((id) => AB.getPrompt(id).cat)).size, 7, "no repeated category within a dive");
});

test("run: scoring, depth, timing and the answer clock", () => {
  const run = AB.newRun("daily", { date: "2032-02-01" });
  assert.ok(AB.submit(run, "x", 1000).error, "must ask for the question first");
  let t = 1_000_000;
  let q = AB.question(run, t);
  assert.equal(q.total, 7); assert.equal(q.msLeft, 25000); assert.ok(!JSON.stringify(q).includes("tiers"));
  const p = AB.getPrompt(run.ids[0]);
  const r = AB.submit(run, p.tiers.reef[0].split("=")[0], t + 5000);
  assert.equal(r.result.points, 60); assert.equal(r.result.tier, "reef"); assert.equal(r.result.depth, 600);
  assert.ok(r.result.examples.every((e) => AB.TIER_ORDER.indexOf(e.tier) > AB.TIER_ORDER.indexOf("reef")));
  // late answer is a miss even if it is the best answer
  t += 40_000; AB.question(run, t);
  const late = AB.submit(run, AB.getPrompt(run.ids[1]).tiers.pearl[0].split("=")[0], t + 29_000);
  assert.equal(late.result.points, 0); assert.equal(late.result.timedOut, true);
  // within grace is fine
  t += 40_000; AB.question(run, t);
  const ok = AB.submit(run, AB.getPrompt(run.ids[2]).tiers.shoal[0].split("=")[0], t + 27_000);
  assert.equal(ok.result.points, 30);
  for (let i = 3; i < 7; i++) { t += 40_000; AB.question(run, t); AB.submit(run, "nonsense zz", t + 100); }
  assert.equal(run.done, true); assert.equal(run.points, 90);
  assert.match(AB.shareText(run, "2032-02-01"), /90\/700 · 900 m deep/);
});

test("unlimited: three misses end the dive, prompts don't repeat, cash-out keeps the points", () => {
  const run = AB.newRun("unlimited", { id: "abc" });
  let t = 5_000_000, hits = 0;
  while (!run.done && hits < 100) {
    const q = AB.question(run, t); const p = AB.getPrompt(run.ids[run.i]);
    assert.ok(q);
    AB.submit(run, hits % 2 === 0 ? p.tiers.bubble[0].split("=")[0] : "zzzz", t + 100); hits++; t += 1000;
  }
  assert.equal(run.done, true); assert.equal(run.lives, 0);
  assert.equal(new Set(run.ids).size, run.ids.length, "no repeats while unseen prompts remain");
  assert.ok(run.points > 0);
});

test("API (signed in): daily dive is server-timed, resumes, awards pearls + streak once, no answers leak", async () => {
  const store = new MemoryStore(); const ctx = { ...studentCtx(store, "diver-1"), now: Date.UTC(2032, 2, 10, 12) };
  const home = await handleAbyss(ctx, { type: "home" });
  assert.equal(home.today, null); assert.equal(home.archive.length, 14);
  let r = await handleAbyss(ctx, { type: "start", mode: "daily" });
  assert.equal(r.question.n, 0);
  assert.ok(!JSON.stringify(r).includes('"tiers"'));
  // refresh mid-dive keeps the same question and clock
  ctx.now += 6000;
  const again = await handleAbyss(ctx, { type: "start", mode: "daily" });
  assert.equal(again.question.startedAt, r.question.startedAt); assert.equal(again.question.msLeft, 19000);
  let last;
  for (let i = 0; i < 7; i++) {
    const ids = AB.dailyIds("2032-03-10");
    const p = AB.getPrompt(ids[i]);
    ctx.now += 2000;
    last = await handleAbyss(ctx, { type: "answer", mode: "daily", answer: p.tiers.shoal[0].split("=")[0] });
    assert.equal(last.result.points, 30);
  }
  assert.equal(last.done, true); assert.equal(last.run.points, 210);
  assert.equal(last.finish.pearls, 42); assert.equal(last.finish.profile.streak, 1);
  await assert.rejects(handleAbyss(ctx, { type: "answer", mode: "daily", answer: "x" }), /over|Start/);
  const done = await handleAbyss(ctx, { type: "start", mode: "daily" });
  assert.equal(done.question, null); assert.ok(done.share);
  const h2 = await handleAbyss(ctx, { type: "home" });
  assert.equal(h2.pearls, 42); assert.equal(h2.profile.dives, 1);
  // next day: streak continues; archive shows yesterday as done
  ctx.now += 86400000;
  const h3 = await handleAbyss(ctx, { type: "home" });
  assert.equal(h3.profile.streak, 1); assert.equal(h3.archive[0].done, true); assert.equal(h3.archive[0].points, 210);
});

test("API: archive only for the last 14 days and gives no pearls or streak; guests play statelessly with a client-held run", async () => {
  const store = new MemoryStore(); const ctx = { ...studentCtx(store, "diver-2"), now: Date.UTC(2032, 4, 20, 9) };
  await assert.rejects(handleAbyss(ctx, { type: "start", mode: "archive", date: "2032-05-20" }), /archive/);
  await assert.rejects(handleAbyss(ctx, { type: "start", mode: "archive", date: "2031-01-01" }), /archive/);
  let r = await handleAbyss(ctx, { type: "start", mode: "archive", date: "2032-05-19" });
  const ids = AB.dailyIds("2032-05-19");
  let last;
  for (let i = 0; i < 7; i++) last = await handleAbyss(ctx, { type: "answer", mode: "archive", date: "2032-05-19", answer: AB.getPrompt(ids[i]).tiers.pearl[0].split("=")[0] });
  assert.equal(last.run.points, 700); assert.equal(last.finish.pearls, 0);
  assert.equal((await handleAbyss(ctx, { type: "home" })).profile.dives, 0);

  const g = { ...guestCtx(store), now: Date.UTC(2032, 4, 20, 9) };
  let gr = await handleAbyss(g, { type: "start", mode: "daily" });
  assert.ok(gr.guestRun);
  const p0 = AB.getPrompt(AB.dailyIds("2032-05-20")[0]);
  const ans = await handleAbyss(g, { type: "answer", mode: "daily", answer: p0.tiers.trench[0].split("=")[0], run: gr.guestRun });
  assert.equal(ans.result.points, 85); assert.ok(ans.guestRun.i === 1);
  await assert.rejects(handleAbyss(g, { type: "fish" }).then((x) => { assert.equal(x.signedIn, false); throw new Error("ok-guest"); }), /ok-guest/);
  await assert.rejects(handleAbyss(g, { type: "open_pack", packId: "abyss_reef", requestId: "abcdefgh1" }), /Sign in/);
});

test("API: unlimited run, cash-out pearls capped per day, and the report endpoint", async () => {
  const store = new MemoryStore(); const ctx = { ...studentCtx(store, "diver-3"), now: Date.UTC(2032, 5, 1, 9) };
  let r = await handleAbyss(ctx, { type: "start", mode: "unlimited" });
  for (let i = 0; i < 6; i++) {
    const p = AB.getPrompt(AB.getPrompt(r.run ? (await store.getMastery("diver-3", "abyss:unlimited")).ids[i] : "")?.id);
    ctx.now += 1000;
    r = await handleAbyss(ctx, { type: "answer", mode: "unlimited", answer: p.tiers.pearl[0].split("=")[0] });
  }
  const c = await handleAbyss(ctx, { type: "cashout", mode: "unlimited" });
  assert.equal(c.finish.pearls, 60); assert.equal(c.run.done, true);
  assert.equal((await handleAbyss(ctx, { type: "cashout", mode: "unlimited" })).finish, null, "cash-out is idempotent");
  assert.equal((await handleAbyss(ctx, { type: "report", promptId: "country-b", answer: "Myanmar" })).ok, true);
  await assert.rejects(handleAbyss(ctx, { type: "report", promptId: "nope", answer: "x" }), /Unknown prompt/);
});

test("fish: separate collection + currency from Party; packs charge pearls; streak fish granted once; select needs ownership", async () => {
  assert.equal(FISH.filter((f) => !f.streak).length, 24);
  assert.ok(FISH.every((f) => f.id.startsWith("f-")) && !CHARACTERS.some((c) => c.id.startsWith("f-")));
  assert.ok(!PACK_IDS.some((id) => id.startsWith("abyss_")), "Party shop never lists fish packs");
  for (const id of ABYSS_PACK_IDS) {
    const o = packOdds(id);
    assert.ok(Math.abs(o.rarities.reduce((n, x) => n + x.percent, 0) - 100) < 0.3);
    for (let i = 0; i < 200; i++) { const f = rollPack(id); assert.ok(f.id.startsWith("f-") && !f.streak); }
  }
  assert.ok(Array.from({ length: 500 }, () => rollPack("abyss_deep")).every((f) => f.rarity !== "common"));
  const store = new MemoryStore(); const ctx = { ...studentCtx(store, "diver-4"), now: Date.UTC(2032, 6, 1, 9) };
  await store.award({ userId: "diver-4", coins: 500, key: "seed", reason: "party coins" });   // Party coins can't buy fish
  await assert.rejects(handleAbyss(ctx, { type: "open_pack", packId: "abyss_reef", requestId: "req-fish-0001" }), /need/);
  await assert.rejects(handleEconomy(ctx, { type: "open_pack", packId: "abyss_reef", requestId: "req-fish-0002" }), /Unknown pack/);
  await store.award({ userId: "abyss:diver-4", coins: 300, key: "seed2", reason: "pearls" });
  const r = await handleAbyss(ctx, { type: "open_pack", packId: "abyss_reef", requestId: "req-fish-0003" });
  assert.equal(r.coins, 200); assert.ok(r.character.id.startsWith("f-"));
  assert.equal((await handleAbyss(ctx, { type: "open_pack", packId: "abyss_reef", requestId: "req-fish-0003" })).repeated, true);
  assert.equal((await store.getWallet("diver-4")).coins, 500, "Party coins untouched");
  assert.equal((await handleEconomy(ctx, { type: "me" })).owned.length, 0, "Party collection untouched");
  const fish = await handleAbyss(ctx, { type: "fish" });
  assert.equal(fish.owned.length, 1); assert.equal(fish.pearls, 200);
  await assert.rejects(handleAbyss(ctx, { type: "select_fish", id: "f-sovereign" }), /don't own/);
  assert.equal((await handleAbyss(ctx, { type: "select_fish", id: r.character.id })).selected, r.character.id);
  // streak milestone grants the fish exactly once
  const profile = { ...AB.newProfile(), streak: 4, lastDone: "2032-06-30", best: 4 };
  await store.saveMastery("diver-4", "abyss:profile", profile);
  const ids = AB.dailyIds("2032-07-01");
  await handleAbyss(ctx, { type: "start", mode: "daily" });
  let last;
  for (let i = 0; i < 7; i++) last = await handleAbyss(ctx, { type: "answer", mode: "daily", answer: AB.getPrompt(ids[i]).tiers.bubble[0].split("=")[0] });
  assert.deepEqual(last.finish.newFish, ["f-pearl-guppy"]);
  assert.ok((await handleAbyss(ctx, { type: "fish" })).owned.some((o) => o.id === "f-pearl-guppy"));
  // deleting the account removes pearls + fish too
  await store.deleteUserData("diver-4");
  assert.equal((await store.getWallet("abyss:diver-4")).coins, 0);
  assert.equal((await store.getCollection("abyss:diver-4")).length, 0);
});
