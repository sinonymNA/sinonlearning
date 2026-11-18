import test from "node:test";
import assert from "node:assert/strict";
import { handleContent } from "../api.mjs";
import { MemoryStore } from "../store.mjs";

const teacher = { id: "t1", role: "teacher", name: "T" };
const base = (generate) => ({ store: new MemoryStore(), user: { ...teacher, id: "t-" + Math.random() }, generate });
const text = "Photosynthesis is how plants turn light, water and carbon dioxide into sugar and oxygen. ".repeat(3);

test("ai_generate sanitises, filters bad items and keeps explanations", async () => {
  const ctx = base(async () => ({
    questions: [
      { q: "What do plants release?", choices: ["Oxygen", "Helium", "Iron"], answer: 0, explain: "Plants release oxygen.", concept: "photosynthesis" },
      { q: "x", choices: ["a", "b"], answer: 0 }, // too short -> dropped
      { q: "Bad answer index here", choices: ["a", "b", "c"], answer: 9 }, // dropped
    ],
    vocab: ["Chlorophyll", "chlorophyll"], drawPrompts: ["leaf"], telephonePrompts: ["A leaf eating sunshine"],
    imposterWords: [{ word: "stomata", related: ["pores", "gas"] }],
  }));
  const d = await handleContent(ctx, { type: "ai_generate", text, have: {} });
  assert.equal(d.items.questions.length, 1);
  assert.equal(d.items.questions[0].explain, "Plants release oxygen.");
  assert.equal(d.items.questions[0].concept, "photosynthesis");
  assert.deepEqual(d.items.vocab, ["chlorophyll"]);
  assert.equal(d.dropped, 2);
});

test("ai_generate needs a teacher, material, a configured AI, and is rate limited", async () => {
  await assert.rejects(handleContent({ ...base(async () => ({})), user: null }, { type: "ai_generate", text, have: {} }), /Teacher/);
  await assert.rejects(handleContent(base(async () => ({})), { type: "ai_generate", text: "short" }), /more material/);
  await assert.rejects(handleContent({ store: new MemoryStore(), user: { ...teacher, id: "t-x" } }, { type: "ai_generate", text, have: {} }), /isn't switched on/);
  const ctx = base(async () => ({ questions: [], vocab: ["leaf"], drawPrompts: [], telephonePrompts: [], imposterWords: [] }));
  for (let i = 0; i < 12; i++) await handleContent(ctx, { type: "ai_generate", text, have: {} });
  await assert.rejects(handleContent(ctx, { type: "ai_generate", text, have: {} }), /a lot this hour/);
});

test("ai_generate drops unsafe items", async () => {
  const ctx = base(async () => ({ questions: [], vocab: ["leaf", "fuck"], drawPrompts: [], telephonePrompts: [], imposterWords: [] }));
  const d = await handleContent(ctx, { type: "ai_generate", text, have: {} });
  assert.deepEqual(d.items.vocab, ["leaf"]);
});

test("ai_generate asks only for the shortfall (fill) or double (big), passes existing items to avoid repeats, and refuses when already full", async () => {
  let seen;
  const ctx = base(async (input) => { seen = input; return { questions: [], vocab: ["leaf"], drawPrompts: [], telephonePrompts: [], imposterWords: [] }; });
  await handleContent(ctx, { type: "ai_generate", text, have: { questions: 50, vocab: 0, drawPrompts: 60, telephonePrompts: 100, imposterWords: 10 }, avoid: { questions: ["Old question?"] } });
  assert.deepEqual(seen.counts, { questions: 10, vocab: 40, drawPrompts: 0, telephonePrompts: 0, imposterWords: 20 });
  assert.deepEqual(seen.avoid.questions, ["Old question?"]);
  await handleContent(ctx, { type: "ai_generate", text, mode: "big", have: { questions: 50, vocab: 0, drawPrompts: 60, telephonePrompts: 100, imposterWords: 10 } });
  assert.deepEqual(seen.counts, { questions: 70, vocab: 80, drawPrompts: 60, telephonePrompts: 0, imposterWords: 50 });
  const full = { questions: 60, vocab: 40, drawPrompts: 60, telephonePrompts: 40, imposterWords: 30 };
  await assert.rejects(handleContent(ctx, { type: "ai_generate", text, have: full }), /plenty/);
});

test("save is forgiving: one bad row never blocks the rest, and the response says what was left out", async () => {
  const t = teacher2();
  const r = await handleContent(t, { type: "save", title: "Unit 5", items: {
    questions: [
      { q: "A fine question here?", choices: ["a", "b", "c"], answer: 1, explain: "x".repeat(900), concept: "c" },
      { q: "Same choices twice?", choices: ["Yes", "yes", "no"], answer: 0 },
      { q: "A fine question here?", choices: ["a", "b", "c"], answer: 1 },
      { q: "Answer out of range?", choices: ["a", "b"], answer: 5 },
    ],
    vocab: ["leaf", "x".repeat(80)], drawPrompts: ["tree"], telephonePrompts: [], imposterWords: [{ word: "STOMATA", related: ["pores", "y".repeat(60)] }],
  } });
  assert.equal(r.dropped, 4);
  assert.ok(r.reasons.length >= 1);
  const saved = await t.store.getSet(r.id);
  assert.equal(saved.items.questions.length, 1);
  assert.equal(saved.items.questions[0].explain, undefined, "over-long explanation is dropped, question kept");
  assert.deepEqual(saved.items.vocab, ["leaf"]);
  assert.deepEqual(saved.items.imposterWords[0].related, ["pores"]);
  await assert.rejects(handleContent(t, { type: "save", title: "Empty", items: { questions: [{ q: "x", choices: ["a"], answer: 0 }] } }), /Nothing could be saved/);
});

test("compatibility reports the recommended amount per game", async () => {
  const { compatibility } = await import("../content.mjs");
  const c = compatibility({ items: { questions: new Array(10).fill(0), vocab: [], drawPrompts: [], telephonePrompts: [], imposterWords: [] } });
  assert.equal(c.last_one_standing.recommended, 60); assert.equal(c.last_one_standing.plenty, false); assert.equal(c.last_one_standing.ok, true);
  assert.equal(c.quick_draw.ok, false);
});

function teacher2() { return { store: new MemoryStore(), user: { id: "t-save", role: "teacher", name: "T" } }; }
