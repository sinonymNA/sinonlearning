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
  const d = await handleContent(ctx, { type: "ai_generate", text });
  assert.equal(d.items.questions.length, 1);
  assert.equal(d.items.questions[0].explain, "Plants release oxygen.");
  assert.equal(d.items.questions[0].concept, "photosynthesis");
  assert.deepEqual(d.items.vocab, ["chlorophyll"]);
  assert.equal(d.dropped, 2);
});

test("ai_generate needs a teacher, material, a configured AI, and is rate limited", async () => {
  await assert.rejects(handleContent({ ...base(async () => ({})), user: null }, { type: "ai_generate", text }), /Teacher/);
  await assert.rejects(handleContent(base(async () => ({})), { type: "ai_generate", text: "short" }), /more material/);
  await assert.rejects(handleContent({ store: new MemoryStore(), user: { ...teacher, id: "t-x" } }, { type: "ai_generate", text }), /isn't switched on/);
  const ctx = base(async () => ({ questions: [], vocab: ["leaf"], drawPrompts: [], telephonePrompts: [], imposterWords: [] }));
  for (let i = 0; i < 12; i++) await handleContent(ctx, { type: "ai_generate", text });
  await assert.rejects(handleContent(ctx, { type: "ai_generate", text }), /a lot this hour/);
});

test("ai_generate drops unsafe items", async () => {
  const ctx = base(async () => ({ questions: [], vocab: ["leaf", "fuck"], drawPrompts: [], telephonePrompts: [], imposterWords: [] }));
  const d = await handleContent(ctx, { type: "ai_generate", text });
  assert.deepEqual(d.items.vocab, ["leaf"]);
});
