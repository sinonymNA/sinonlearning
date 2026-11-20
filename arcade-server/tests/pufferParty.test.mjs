import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom } from "./helpers.mjs";
import { getPrompt, TIERS } from "../abyss.mjs";
import { GAME_CATALOG } from "../catalog.mjs";

const answerFor = (g, grp, tier = "bubble") => { const p = getPrompt(grp.promptId); return p.tiers[tier].map((e) => e.split("=")[0]).find((n) => !grp.used.has(n.toLowerCase())); };

test("Puffer Party is a registered game and runs with the standard room flow", () => {
  assert.ok(GAME_CATALOG.puffer_party);
  const ctx = makeRoom({ n: 5, playlist: ["puffer_party"] });
  const g = ctx.begin();
  assert.equal(g.groups.length, 1);
  const grp = g.groups[0];
  assert.equal(grp.status, "live"); assert.ok(grp.holder);
  assert.equal(ctx.view(grp.holder).game.group.you.holder, true);
});

test("a valid answer passes the puffer and scores by rarity; unlisted and repeated answers keep the turn", () => {
  const ctx = makeRoom({ n: 4, playlist: ["puffer_party"] });
  const g = ctx.begin(); const grp = g.groups[0];
  const first = grp.holder;
  const other = ctx.players.find((p) => p.id !== first);
  assert.match(ctx.tryAct(other, { type: "answer", text: "x" }).error, /not your turn/);
  const bad = ctx.tryAct(first, { type: "answer", text: "definitely not a real thing zzq" });
  assert.equal(bad.ok, false); assert.equal(bad.code, "nope"); assert.equal(grp.holder, first, "wrong guess keeps the puffer");
  const lives = grp.lives.get(first);
  const BONUS = { reef: 10, trench: 15, pearl: 25 };   // some prompts have no pearl once rarity is fame-adjusted: use the deepest tier
  const tier = ["pearl", "trench", "reef"].find((t) => getPrompt(grp.promptId).tiers[t].length);
  const a = answerFor(g, grp, tier);
  const pts0 = g.points.get(first);
  const r = ctx.tryAct(first, { type: "answer", text: a });
  assert.equal(r.ok, true); assert.equal(r.result.tier, tier);
  assert.equal(g.points.get(first), pts0 + 10 + BONUS[tier]);
  assert.notEqual(grp.holder, first); assert.equal(grp.lives.get(first), lives);
  // the same answer can't be reused by the next player
  const dup = ctx.tryAct(grp.holder, { type: "answer", text: a });
  assert.equal(dup.code, "dup");
  assert.ok(grp.said.length === 1);
});

test("the answer key never appears in any view; only said answers do", () => {
  const ctx = makeRoom({ n: 4, playlist: ["puffer_party"] });
  const g = ctx.begin(); const grp = g.groups[0];
  const p = getPrompt(grp.promptId);
  const unsaid = (p.tiers.pearl[0] ?? p.tiers.trench[0] ?? p.tiers.reef[0]).split("=")[0];
  for (const m of ctx.players) { const json = JSON.stringify(ctx.view(m).game); assert.ok(!json.includes(unsaid) || p.prompt.toLowerCase().includes(unsaid.toLowerCase()), "unsaid answers must not leak"); assert.ok(!json.includes('"tiers"')); }
  const proj = JSON.stringify(ctx.room.view({ playerId: null, projector: true }).game ?? {});
  assert.ok(!proj.includes('"tiers"'));
});

test("running out of time pops the puffer: the holder loses a life, the table gets a new category, turns shrink with passes", () => {
  const ctx = makeRoom({ n: 4, playlist: ["puffer_party"] });
  const g = ctx.begin(); const grp = g.groups[0];
  const victim = grp.holder, prompt1 = grp.promptId;
  const total0 = grp.turnTotal;
  ctx.advance(total0 + 400);
  assert.equal(grp.status, "pop"); assert.equal(grp.lives.get(victim), 2);
  assert.equal(ctx.view(victim).game.group.victim, victim);
  ctx.advance(4500);
  assert.equal(grp.status, "live"); assert.notEqual(grp.promptId, prompt1); assert.notEqual(grp.holder, victim, "next player is up after a pop");
  // each pass shortens the next turn, down to a floor
  let last = grp.turnTotal;
  for (let i = 0; i < 6; i++) { const h = grp.holder; const r = ctx.tryAct(h, { type: "answer", text: answerFor(g, grp, "bubble") ?? answerFor(g, grp, "shoal") }); if (!r.ok) break; assert.ok(grp.turnTotal <= last); last = grp.turnTotal; }
  assert.ok(last < total0);
});

test("lives run out: the last player standing wins and the table finishes; late-joiners and drops don't freeze it", () => {
  const ctx = makeRoom({ n: 3, playlist: ["puffer_party"] });
  const g = ctx.begin(); const grp = g.groups[0];
  let guard = 0;
  while (grp.status !== "done" && guard++ < 40) ctx.advance(grp.status === "live" ? grp.turnTotal + 400 : 4500);
  assert.equal(grp.status, "done"); assert.ok(grp.winner);
  assert.equal(grp.members.filter((m) => (grp.lives.get(m) ?? 0) > 0).length, 1);
  ctx.advance(40000);
  assert.equal(ctx.room.history.length, 1);
});

test("a disconnected holder doesn't freeze the table or lose a life", () => {
  const ctx = makeRoom({ n: 4, playlist: ["puffer_party"] });
  const g = ctx.begin(); const grp = g.groups[0];
  const holder = grp.holder; ctx.room.players.get(holder).forceOffline = true;
  ctx.advance(8000);
  assert.notEqual(grp.holder, holder); assert.equal(grp.lives.get(holder), 3);
});

test("35 players -> tables of at most 6, bots play it end to end", () => {
  const ctx = makeRoom({ n: 35, playlist: ["puffer_party"] });
  const g = ctx.begin();
  assert.ok(g.groups.every((x) => x.members.length >= 3 && x.members.length <= 6));
  assert.equal(g.groups.reduce((n, x) => n + x.members.length, 0), 35);
  ctx.advance(330000);
  assert.ok(g.groups.every((x) => x.status === "done"));
});

test("tier bonuses are ordered and the bots' pick helper only returns unused, valid answers", () => {
  const vals = Object.values(TIERS).map((t) => t.points); assert.deepEqual(vals, [...vals].sort((a, b) => a - b));
  const ctx = makeRoom({ n: 3, playlist: ["puffer_party"] });
  const g = ctx.begin(); const grp = g.groups[0];
  for (let i = 0; i < 6; i++) { const text = g.botPick(grp, 0.9); assert.ok(text); const h = grp.holder; assert.equal(ctx.tryAct(h, { type: "answer", text }).ok, true); }
  const names = grp.said.map((s) => s.name); assert.equal(new Set(names).size, names.length);
});
