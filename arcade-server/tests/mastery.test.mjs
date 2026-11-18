import test from "node:test";
import assert from "node:assert/strict";
import { buildPool, newState, nextQuestion, submitAnswer, mapView, classReport, reconcile, statusOf } from "../mastery.mjs";
import { handleMastery, handleContent } from "../api.mjs";
import { MemoryStore } from "../store.mjs";
import { DEFAULT_SET } from "../content.mjs";
import { studentCtx, teacherCtx, guestCtx } from "./helpers.mjs";

const mk = (q, concept, n = 0) => ({ q, choices: [`${q}-A`, `${q}-B`, `${q}-C`, `${q}-D`], answer: n, concept, explain: `Because ${q}` });
const SET = { id: "s1", ownerId: "teacher-1", title: "Test", items: { questions: [
  mk("Photo one?", "Photosynthesis"), mk("Photo two?", "Photosynthesis", 1), mk("Photo three?", "Photosynthesis", 2), mk("Photo four?", "photosynthesis", 3),
  mk("Cell one?", "Cells"), mk("Cell two?", "Cells", 1), mk("Cell three?", "Cells", 2),
] } };

/** Always answers correctly by finding the right shuffled index. */
function solve(pool, state, { correct = true } = {}) {
  const q = nextQuestion(pool, state);
  if (q.done) return q;
  const c = pool.concepts.find((x) => x.name === q.concept);
  const item = c.items.find((i) => i.id === q.id);
  const right = q.choices.indexOf(item.choices[item.answer]);
  const wrong = q.choices.findIndex((_, i) => i !== right);
  return { q, r: submitAnswer(pool, state, correct ? right : wrong) };
}

test("pool groups by concept case-insensitively; unlabelled questions fall into camps", () => {
  const pool = buildPool(SET);
  assert.deepEqual(pool.concepts.map((c) => [c.name, c.items.length]), [["Photosynthesis", 4], ["Cells", 3]]);
  const builtin = buildPool(DEFAULT_SET);
  assert.ok(builtin.concepts.length >= 10 && builtin.concepts.length <= 24 && !builtin.truncated);
  assert.ok(builtin.concepts.some((c) => /^Camp \d+$/.test(c.name)) && builtin.concepts.some((c) => c.name === "Fractions"), "labelled questions get real camps, the rest are grouped");
});

test("three DIFFERENT correct answers secure a camp; repeating one question never counts twice", () => {
  const pool = buildPool({ items: { questions: [mk("Only one?", "Solo")] } });
  const state = newState(pool);
  assert.equal(pool.concepts[0].needed, 1, "a one-question camp needs just that one");
  const pool2 = buildPool(SET); const st = newState(pool2);
  // answer a Photosynthesis question correctly twice with the same id -> streak stays at distinct ids
  const s = st.concepts.Photosynthesis; s.streak = ["q0"];
  nextQuestion(pool2, st); st.pending = { id: "q0", concept: "Photosynthesis", order: [0, 1, 2, 3], recheck: false };
  submitAnswer(pool2, st, 0);
  assert.equal(s.streak.length, 1, "same question twice is still one distinct answer");
  void state;
});

test("full climb: slips trigger catch-up, secured camps need a spaced re-check, summit when all are stamped", () => {
  const pool = buildPool(SET); const state = newState(pool);
  const events = []; let slipDone = false, steps = 0;
  while (!state.summit && steps++ < 80) {
    const wantSlip = !slipDone && steps === 2;
    const out = solve(pool, state, { correct: !wantSlip });
    if (out.done) break;
    events.push(out.r.event);
    if (wantSlip) {
      slipDone = true;
      assert.equal(out.r.event, "slip"); assert.ok(out.r.explain);
      assert.equal(state.catchUp, out.r.concept, "catch-up: next question stays on the same camp");
      const nxt = nextQuestion(pool, state);
      assert.equal(nxt.concept, out.r.concept);
      assert.notEqual(nxt.id, out.q.id, "catch-up is a DIFFERENT question");
      state.pending = null; // discard the peek
    }
  }
  assert.equal(state.summit, true);
  assert.ok(events.includes("secured") && events.includes("stamped") && events.at(-1) === "summit");
  assert.ok(mapView(pool, state).every((c) => c.status === "stamped"));
});

test("a re-check only happens after other camps were visited, and failing it makes the camp fall", () => {
  const pool = buildPool(SET); const state = newState(pool);
  const cell = state.concepts.Cells;
  // secure Photosynthesis first
  let guard = 0;
  while (!state.concepts.Photosynthesis.secured && guard++ < 40) solve(pool, state);
  assert.equal(statusOf(state.concepts.Photosynthesis), "secured");
  // with only two camps the gap is 1: the very next question must be on the OTHER camp, then the re-check comes due
  const first = nextQuestion(pool, state);
  assert.equal(first.concept, "Cells"); assert.equal(first.recheck, false, "no re-check before the gap");
  state.pending = null;
  // now force a re-check and fail it
  state.concepts.Photosynthesis.securedStep = state.step - 5;
  state.catchUp = null;
  const q = nextQuestion(pool, state);
  assert.equal(q.concept, "Photosynthesis"); assert.equal(q.recheck, true);
  const item = pool.concepts[0].items.find((i) => i.id === q.id);
  const wrong = q.choices.findIndex((c) => c !== item.choices[item.answer]);
  const r = submitAnswer(pool, state, wrong);
  assert.equal(r.event, "fell");
  assert.equal(statusOf(state.concepts.Photosynthesis), "wobbly");
  assert.equal(state.concepts.Photosynthesis.streak.length, 0);
  void cell;
});

test("answers are validated: no pending question, bad index, and the pending secret is the only authority", () => {
  const pool = buildPool(SET); const state = newState(pool);
  assert.match(submitAnswer(pool, state, 0).error, /No question/);
  const q = nextQuestion(pool, state);
  assert.match(submitAnswer(pool, state, 9).error, /Pick one/);
  assert.ok(!JSON.stringify(q).includes('"answer"'), "question payload never carries the answer");
  assert.ok(submitAnswer(pool, state, 0).correct !== undefined);
  assert.match(submitAnswer(pool, state, 0).error, /No question/, "same question can't be answered twice");
});

test("reconcile survives teachers editing the set; class report finds the hard camps", () => {
  const pool = buildPool(SET); const state = newState(pool);
  for (let i = 0; i < 6; i++) solve(pool, state);
  const edited = buildPool({ items: { questions: SET.items.questions.slice(0, 5) } });
  const again = reconcile(edited, state);
  assert.ok(Object.keys(again.concepts).every((k) => edited.concepts.some((c) => c.name === k)));
  assert.equal(reconcile(pool, null).step, 0);
  const a = newState(pool), b = newState(pool);
  a.concepts.Cells.wrong = 5; a.concepts.Cells.right = 1; a.concepts.Cells.lastWrong = true;
  b.concepts.Photosynthesis.right = 4; b.concepts.Photosynthesis.wrong = 0;
  const rep = classReport(pool, [a, b]);
  assert.equal(rep.students, 2); assert.deepEqual(rep.hardest, ["Cells"]);
});

test("API: needs sign-in, saves progress per account, one-time summit reward, reset keeps reward flag, double-submit safe", async () => {
  const store = new MemoryStore();
  await store.saveSet({ id: "s1", ownerId: "teacher-1", title: "Test", items: SET.items });
  await assert.rejects(handleMastery(guestCtx(store), { type: "start", setId: "s1" }), /Sign in/);
  const ctx = studentCtx(store, "kid-1");
  await assert.rejects(handleMastery(ctx, { type: "start", setId: "nope" }), /wasn't found/);
  const start = await handleMastery(ctx, { type: "start", setId: "s1" });
  assert.equal(start.concepts.length, 2);
  let reward = 0, guard = 0, last;
  while (guard++ < 120) {
    const n = await handleMastery(ctx, { type: "next", setId: "s1" });
    if (!n.question) break;
    const c = SET.items.questions.find((q) => q.q === n.question.q);
    const right = n.question.choices.indexOf(c.choices[c.answer]);
    // fire the same answer twice at once: only one may land
    const both = await Promise.allSettled([handleMastery(ctx, { type: "answer", setId: "s1", choice: right }), handleMastery(ctx, { type: "answer", setId: "s1", choice: right })]);
    assert.equal(both.filter((x) => x.status === "fulfilled").length, 1, "double submit");
    last = both.find((x) => x.status === "fulfilled").value;
    if (last.reward) reward += last.reward;
    if (last.summit) break;
  }
  assert.equal(last.summit, true); assert.equal(reward, 100);
  assert.equal((await store.getWallet("kid-1")).coins, 100);
  await handleMastery(ctx, { type: "reset", setId: "s1" });
  const again = await handleMastery(ctx, { type: "start", setId: "s1" });
  assert.equal(again.summit, false);
  assert.ok(again.concepts.every((c) => c.status === "unseen"));
  // progress is per account
  const other = await handleMastery(studentCtx(store, "kid-2"), { type: "start", setId: "s1" });
  assert.ok(other.concepts.every((c) => c.status === "unseen"));
});

test("teacher report: owner only; builtin set works for students", async () => {
  const store = new MemoryStore();
  await store.saveSet({ id: "s1", ownerId: "teacher-1", title: "Test", items: SET.items });
  await handleMastery(studentCtx(store, "kid-9"), { type: "next", setId: "s1" });
  await assert.rejects(handleMastery(studentCtx(store, "kid-9"), { type: "report", setId: "s1" }), /Only the teacher/);
  await assert.rejects(handleMastery(teacherCtx(store, "someone-else"), { type: "report", setId: "s1" }), /Only the teacher/);
  const rep = await handleMastery(teacherCtx(store, "teacher-1"), { type: "report", setId: "s1" });
  assert.equal(rep.students, 1);
  const b = await handleMastery(studentCtx(store, "kid-9"), { type: "next", setId: "builtin" });
  assert.ok(b.question);
});

test("AI variants: teacher-only, sanitised, saved on the set and used by the pool", async () => {
  const store = new MemoryStore();
  await store.saveSet({ id: "s1", ownerId: "teacher-1", title: "Test", items: SET.items });
  const gen = async (qs) => qs.map((x) => ({ i: x.i, variants: [
    { q: `${x.q} (variant A)`, choices: ["a1", "a2", "a3", "a4"], answer: 2, explain: "Because reasons." },
    { q: "x", choices: ["only"], answer: 0 }, // dropped
    { q: `${x.q} (variant B)`, choices: ["b1", "b2", "b3"], answer: 0, explain: "Also reasons." },
  ] }));
  await assert.rejects(handleContent({ ...studentCtx(store), generateVariants: gen }, { type: "ai_variants", id: "s1" }), /Teacher/);
  await assert.rejects(handleContent({ ...teacherCtx(store, "other"), generateVariants: gen }, { type: "ai_variants", id: "s1" }), /not found/);
  await assert.rejects(handleContent(teacherCtx(store), { type: "ai_variants", id: "s1" }), /isn't switched on/);
  const r = await handleContent({ ...teacherCtx(store), generateVariants: gen }, { type: "ai_variants", id: "s1" });
  assert.equal(r.added, 14);
  const saved = await store.getSet("s1");
  assert.equal(saved.items.questions[0].variants.length, 2);
  assert.ok(saved.items.questions[0].explain, "keeps explanation");
  const pool = buildPool(saved);
  assert.equal(pool.concepts[0].items.length, 4 * 3);
  const second = await handleContent({ ...teacherCtx(store), generateVariants: gen }, { type: "ai_variants", id: "s1" });
  assert.equal(second.added, 0, "already has variants");
});
