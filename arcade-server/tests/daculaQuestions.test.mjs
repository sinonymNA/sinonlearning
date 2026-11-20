import test from "node:test";
import assert from "node:assert/strict";
import { DACULA_QUESTIONS, questionsByCat } from "../data/daculaQuestions.mjs";
import { importQuestions, parseCsv, validateQuestion, normCategory, coverage, clean } from "../dacula/questionIO.mjs";
import { CAT_IDS } from "../dacula/traced.mjs";

test("bank: 25+ original questions in every category, four distinct answers each, unique ids and unique questions", () => {
  const by = questionsByCat();
  for (const c of CAT_IDS) { assert.ok(by[c].length >= 25, `${c} has ${by[c].length}`); assert.ok(by[c].filter((q) => q.d >= 2).length >= 12, `${c} has enough medium/hard questions for the final`); }
  const ids = new Set(), qs = new Set();
  for (const q of DACULA_QUESTIONS) {
    assert.ok(!ids.has(q.id), "dup id " + q.id); ids.add(q.id);
    const k = q.q.toLowerCase(); assert.ok(!qs.has(k), "dup question " + q.q); qs.add(k);
    const all = [q.a, ...q.w]; assert.equal(all.length, 4); assert.equal(new Set(all.map((x) => x.toLowerCase())).size, 4, q.q);
    assert.ok(q.q.length <= 220 && all.every((x) => x.length <= 80 && x.trim()), q.id);
    assert.ok(q.x && q.d >= 1 && q.d <= 3 && q.src === "original" && q.review);
    assert.ok(!/[<>]/.test(q.q + all.join("")), "no markup in the bank");
  }
});

test("bank: no answer text is included in its own question (the question never gives itself away)", () => {
  for (const q of DACULA_QUESTIONS) {
    const ql = q.q.toLowerCase(), a = q.a.toLowerCase().replace(/^the /, "");
    if (a.length >= 5 && !/^(five|six|nine|eleven|zero|one|two|three|four)$/.test(a)) assert.ok(!new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(ql), `${q.id}: "${q.q}" contains its answer "${q.a}"`);
  }
});

test("csv parser: quotes, commas, escaped quotes, newlines inside quotes, BOM", () => {
  const rows = parseCsv('﻿a,b,c\n"x, y","say ""hi""","line1\nline2"\n');
  assert.deepEqual(rows, [["a", "b", "c"], ["x, y", 'say "hi"', "line1\nline2"]]);
});

const CSV = `category,question,correct,wrong1,wrong2,wrong3,explanation,difficulty
Geography,What is the capital of France?,Paris,Lyon,Marseille,Nice,It is on the Seine,1
Science & Nature,What gas do we breathe in to live?,Oxygen,Helium,Neon,Argon,,2
Sports & Leisure,How many players are on a baseball diamond for the fielding team?,Nine,Seven,Eight,Ten,,3
`;
test("import: valid CSV becomes questions with mapped categories, clamped difficulty and teacher provenance", () => {
  const r = importQuestions(CSV); assert.equal(r.errors.length, 0); assert.equal(r.questions.length, 3);
  assert.deepEqual(r.questions.map((q) => q.cat), ["geo", "science", "sports"]); assert.equal(r.questions[0].src, "teacher"); assert.equal(r.questions[2].d, 3);
});

test("import: JSON arrays work, and validation reports each problem with its row number", () => {
  const json = JSON.stringify([{ category: "History", question: "Who was the first US president?", correct: "George Washington", wrong: ["A", "B", "C"] }, { category: "Space", question: "x", correct: "y", wrong: ["a", "b", "c"] }, { category: "arts", question: "Same answers?", correct: "A", wrong: ["a", "B", "C"] }, { category: "ent", question: "Missing wrong", correct: "A", wrong: ["B", "C"] }]);
  const r = importQuestions(json); assert.equal(r.questions.length, 1);
  assert.deepEqual(r.errors.map((e) => e.row), [2, 3, 4]); assert.match(r.errors[0].message, /category/); assert.match(r.errors[1].message, /different/); assert.match(r.errors[2].message, /three wrong/);
});

test("import: duplicates (within the file and against the existing bank) are reported and skipped", () => {
  const dup = CSV + "Geography,what is the CAPITAL of france?,Paris,Lyon,Marseille,Nice,,1\n";
  const r = importQuestions(dup); assert.equal(r.questions.length, 3); assert.equal(r.duplicates, 1);
  const r2 = importQuestions(CSV, { existing: [{ q: "What is the capital of France?" }] }); assert.equal(r2.questions.length, 2); assert.equal(r2.duplicates, 1);
});

test("import: unsafe text is neutralised, long text is rejected, bad files fail cleanly", () => {
  const evil = importQuestions([{ category: "geo", question: "<script>alert(1)</script>Capital of Spain?", correct: "<b>Madrid</b>", wrong: ["Lisbon", "Rome", "Paris"] }]);
  assert.equal(evil.questions[0].q, "alert(1)Capital of Spain?"); assert.equal(evil.questions[0].a, "Madrid"); assert.ok(!/[<>]/.test(JSON.stringify(evil.questions)));
  assert.match(validateQuestion({ category: "geo", question: "x".repeat(300), correct: "a", wrong: ["b", "c", "d"] }).error, /longer/);
  assert.match(importQuestions("{not json").errors[0].message, /could not read/); assert.match(importQuestions("").errors[0].message, /empty/);
  assert.match(importQuestions("category,question\nGeography,hi").errors[0].message, /missing column/);
  assert.equal(clean("a\u0000b\n c"), "a b c");
});

test("category aliases map teacher-friendly names, and coverage tells a teacher what is missing", () => {
  for (const [n, id] of [["Geography", "geo"], ["science and nature", "science"], ["Arts & Literature", "arts"], ["orange", "sports"], ["Pop Culture", "ent"]]) assert.equal(normCategory(n), id);
  assert.equal(normCategory("math"), null);
  assert.equal(coverage(DACULA_QUESTIONS).ok, true); assert.deepEqual(coverage(importQuestions(CSV).questions, 1).missing.sort(), ["arts", "ent", "history"]);
});
