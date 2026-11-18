import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SET, compatibility, contentFor, importCsv, sanitizeItems, parseCsv, itemsFromGameShow } from "../content.mjs";
import { handleContent } from "../api.mjs";
import { MemoryStore } from "../store.mjs";
import { teacherCtx, studentCtx, makeRoom } from "./helpers.mjs";

test("built-in content makes every game playable immediately", () => {
  const c = compatibility(DEFAULT_SET);
  for (const [game, v] of Object.entries(c)) assert.ok(v.ok, game);
  assert.ok(DEFAULT_SET.items.questions.length >= 50);
  assert.ok(DEFAULT_SET.items.imposterWords.length >= 25);
});

test("CSV import: quoted cells, answer letters, errors reported per row", () => {
  assert.deepEqual(parseCsv('a,"b,c",d\n"x ""y""",1').map((r) => r.length), [3, 2]);
  const { items, errors } = importCsv("questions", 'question,a,b,c,d,answer\n"What is 2+2?",3,4,5,6,B\n"Capital of France?",Rome,Paris,Oslo,Rio,Paris\nbad row,x');
  assert.equal(items.length, 2);
  assert.equal(items[0].answer, 1);
  assert.equal(items[1].answer, 1);
  assert.equal(errors.length, 1);
  const w = importCsv("imposterWords", "word,related\nVOLCANO,lava;ash;eruption\n");
  assert.deepEqual(w.items[0].related, ["lava", "ash", "eruption"]);
  const v = importCsv("vocab", "word\nphotosynthesis\nchlorophyll\n");
  assert.deepEqual(v.items, ["photosynthesis", "chlorophyll"]);
});

test("content is moderated and validated", () => {
  assert.throws(() => sanitizeItems({ questions: [{ q: "Fuck this question?", choices: ["a", "b"], answer: 0 }] }), /classroom/);
  assert.throws(() => sanitizeItems({ questions: [{ q: "Valid question?", choices: ["a", "a"], answer: 0 }] }), /different/);
  assert.throws(() => sanitizeItems({ questions: [{ q: "Valid question?", choices: ["a", "b"], answer: 5 }] }), /correct/);
});

test("compatibility check and fallback to defaults when a set lacks content for a game", () => {
  const set = { title: "Only vocab", items: { vocab: ["alpha", "beta", "gamma"], questions: [], drawPrompts: [], telephonePrompts: [], imposterWords: [] } };
  const c = compatibility(set);
  assert.equal(c.hot_potato.ok, true);
  assert.equal(c.last_one_standing.ok, false);
  assert.equal(contentFor("last_one_standing", set).items, DEFAULT_SET.items.questions);
  assert.deepEqual(contentFor("hot_potato", set).items, ["alpha", "beta", "gamma"]);
});

test("teacher content API: only teachers, owners only, CSV import, compat", async () => {
  const store = new MemoryStore();
  await assert.rejects(() => handleContent(studentCtx(store), { type: "list" }), /Teacher account/);
  const t = teacherCtx(store, "t1");
  const saved = await handleContent(t, { type: "save", title: "Unit 4", items: { questions: Array.from({ length: 6 }, (_, i) => ({ q: `Question ${i} here?`, choices: ["a", "b", "c"], answer: 1 })) } });
  assert.equal(saved.compatibility.last_one_standing.ok, true);
  assert.equal(saved.compatibility.imposter.ok, false);
  const list = await handleContent(t, { type: "list" });
  assert.equal(list.sets.length, 2);
  await assert.rejects(() => handleContent(teacherCtx(store, "t2"), { type: "get", id: saved.id }), /not found/);
  await assert.rejects(() => handleContent(teacherCtx(store, "t2"), { type: "save", id: saved.id, title: "Hijack", items: { vocab: ["abc"] } }), /Not your/);
  const imp = await handleContent(t, { type: "import_csv", kind: "vocab", text: "word\nalpha\nbeta" });
  assert.equal(imp.items.length, 2);
});

test("a game uses the teacher's set when compatible (Last One Standing)", () => {
  const set = { title: "T", items: { questions: Array.from({ length: 6 }, (_, i) => ({ q: `Teacher question ${i}?`, choices: ["a", "b"], answer: 0 })) } };
  const ctx = makeRoom({ n: 3, playlist: ["last_one_standing"], content: set });
  const g = ctx.begin();
  assert.match(g.q.q, /Teacher question/);
});

test("existing Game Shows are reused: Race -> questions, Memory -> vocab/prompts/secret words, Grid rejected", async () => {
  const race = itemsFromGameShow({ type: "race", data: { questions: [{ question: "What is 2 + 2?", choices: ["3", "4", "5", "6"], correctIndex: 1 }] } });
  assert.equal(race.questions[0].answer, 1);
  const mem = itemsFromGameShow({ type: "memory", data: { pairs: [{ term: "Mitochondria", definition: "The powerhouse producing cellular energy" }] } });
  assert.deepEqual(mem.vocab, ["Mitochondria"]);
  assert.equal(mem.imposterWords[0].word, "MITOCHONDRIA");
  assert.ok(mem.imposterWords[0].related.includes("powerhouse"));
  assert.throws(() => itemsFromGameShow({ type: "grid", data: {} }), /free-response/);
  const ctx = { ...teacherCtx(new MemoryStore(), "t1"), gameShows: { getById: async () => ({ title: "Cells", payload: { type: "memory", data: { pairs: [{ term: "Nucleus", definition: "Control center of the cell" }, { term: "Ribosome", definition: "Makes proteins" }, { term: "Vacuole", definition: "Stores water and nutrients" }] } } }) } };
  const res = await handleContent(ctx, { type: "import_game_show", id: "https://x.test/play/game-shows/123e4567-e89b-42d3-a456-426614174000" });
  assert.equal(res.title, "Cells");
  assert.equal(res.compatibility.hot_potato.ok, true);
  assert.equal(res.compatibility.imposter.ok, true);
  await assert.rejects(() => handleContent(ctx, { type: "import_game_show", id: "not an id" }), /play link or ID/);
});

import { DEFAULT_SET as BUILTIN, RECOMMENDED as REC, sanitizeLoose as loose } from "../content.mjs";
import { PROMPTS as ABYSS_BANK } from "../abyss.mjs";

test("built-in banks meet the recommended size for every game and contain only valid, clean items", () => {
  const it = BUILTIN.items;
  assert.ok(it.questions.length >= REC.questions * 4, `questions ${it.questions.length}`);
  assert.ok(it.drawPrompts.length >= REC.drawPrompts * 8, `draw ${it.drawPrompts.length}`);
  assert.ok(it.telephonePrompts.length >= REC.telephonePrompts * 4, `telephone ${it.telephonePrompts.length}`);
  assert.ok(it.imposterWords.length >= REC.imposterWords * 3, `imposter ${it.imposterWords.length}`);
  const { dropped } = loose(it);
  assert.equal(dropped, 0, "nothing in the built-in banks may be rejected by our own validator");
  assert.equal(new Set(it.drawPrompts.map((x) => x.toLowerCase())).size, it.drawPrompts.length, "no duplicate draw prompts");
  assert.equal(new Set(it.questions.map((q) => q.q.toLowerCase())).size, it.questions.length, "no duplicate questions");
  assert.ok(it.questions.every((q) => q.answer >= 0 && q.answer < q.choices.length));
  const positions = new Set(it.questions.map((q) => q.answer));
  assert.ok(positions.size >= 4, "correct answers are spread across positions");
});

test("Abyss bank size", () => {
  assert.ok(ABYSS_BANK.length >= 55, `${ABYSS_BANK.length} prompts`);
  assert.ok(new Set(ABYSS_BANK.map((p) => p.cat)).size >= 12, "enough categories for varied daily dives");
});
