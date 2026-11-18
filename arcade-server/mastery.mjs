// Mastery Peak engine: pure functions, no I/O. See ARCADE_MASTERY_PEAK.md for the design.
//
// A concept is a "camp" on the mountain. States (derived, see statusOf):
//   unseen   - never asked
//   climbing - being asked, no recent slip
//   wobbly   - the last answer on it was wrong (a slip, or a fall from a secured camp)
//   secured  - `needed` DIFFERENT questions answered correctly in a row
//   stamped  - secured AND later passed a spaced re-check (after other camps were visited)
// The summit means every camp is stamped. Repeating one memorised question never counts twice.

import { shuffle } from "./util.mjs";

export const MAX_CONCEPTS = 24;
export const NEEDED = 3;
export const GAP = 3;

const clean = (s) => String(s ?? "").trim().replace(/\s+/g, " ").slice(0, 40);

/** Group a content set's questions into concepts and flatten variants into the pool. */
export function buildPool(set) {
  const questions = set?.items?.questions ?? [];
  const byName = new Map();           // lower-case concept -> { name, items }
  const unlabelled = [];
  questions.forEach((q, i) => {
    const base = { id: `q${i}`, q: q.q, choices: q.choices, answer: q.answer, explain: q.explain ?? null };
    const items = [base, ...(q.variants ?? []).map((v, j) => ({ id: `q${i}.v${j}`, q: v.q, choices: v.choices, answer: v.answer, explain: v.explain ?? q.explain ?? null }))];
    const name = clean(q.concept);
    if (!name) { unlabelled.push(...items.map((it) => ({ ...it, group: i }))); return; }
    const key = name.toLowerCase();
    if (!byName.has(key)) byName.set(key, { name, items: [] });
    byName.get(key).items.push(...items);
  });
  // Questions without a concept label are grouped into "Camp N" - at least 4 base questions per camp, and few enough
  // camps to fit on the mountain. (Labelled sets - e.g. from the AI builder - give much more meaningful camps.)
  const baseCount = new Set(unlabelled.map((u) => u.group)).size;
  const per = Math.max(4, Math.ceil(baseCount / 8));
  const groups = new Map();
  for (const it of unlabelled) { const k = Math.floor(it.group / per); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
  let n = 1;
  for (const items of groups.values()) { byName.set(`camp ${n}`, { name: `Camp ${n}`, items: items.map(({ group, ...rest }) => { void group; return rest; }) }); n++; }
  const concepts = [...byName.values()].slice(0, MAX_CONCEPTS).map((c) => ({ ...c, needed: Math.min(NEEDED, c.items.length) }));
  return { concepts, truncated: byName.size > MAX_CONCEPTS };
}

export function newState(pool) {
  return {
    v: 1, step: 0, pending: null, catchUp: null, last: null, summit: false, summitAt: 0, rewarded: false,
    concepts: Object.fromEntries(pool.concepts.map((c) => [c.name, { right: 0, wrong: 0, streak: [], seen: [], lastWrong: false, secured: false, securedStep: 0, stamped: false, lastStep: -1 }])),
  };
}

/** Make sure saved progress lines up with the (possibly edited) set. */
export function reconcile(pool, state) {
  if (!state || state.v !== 1) return newState(pool);
  const fresh = newState(pool);
  for (const c of pool.concepts) {
    const cur = state.concepts?.[c.name];
    if (!cur) continue;
    const ids = new Set(c.items.map((i) => i.id));
    fresh.concepts[c.name] = { ...fresh.concepts[c.name], ...cur, streak: cur.streak.filter((x) => ids.has(x)), seen: cur.seen.filter((x) => ids.has(x)) };
    if (fresh.concepts[c.name].secured && fresh.concepts[c.name].streak.length < c.needed && !fresh.concepts[c.name].stamped) fresh.concepts[c.name].secured = false;
  }
  const pend = state.pending && pool.concepts.find((c) => c.name === state.pending.concept)?.items.some((i) => i.id === state.pending.id) ? state.pending : null;
  return { ...fresh, step: state.step ?? 0, pending: pend, catchUp: state.catchUp && fresh.concepts[state.catchUp] ? state.catchUp : null, last: state.last ?? null, summit: !!state.summit, summitAt: state.summitAt ?? 0, rewarded: !!state.rewarded };
}

export function statusOf(c) {
  if (c.stamped) return "stamped";
  if (c.secured) return "secured";
  if (c.lastWrong) return "wobbly";
  if (c.right + c.wrong === 0) return "unseen";
  return "climbing";
}

export function mapView(pool, state) {
  return pool.concepts.map((c) => {
    const s = state.concepts[c.name];
    return { name: c.name, status: statusOf(s), right: s.right, wrong: s.wrong, streak: s.streak.length, needed: c.needed, total: c.items.length };
  });
}

const allStamped = (pool, state) => pool.concepts.length > 0 && pool.concepts.every((c) => state.concepts[c.name].stamped);

function pickItem(c, s, avoidId) {
  const pool = c.items;
  const fresh = pool.filter((i) => !s.seen.includes(i.id) && i.id !== avoidId);
  if (fresh.length) return fresh[0];
  const notStreak = pool.filter((i) => !s.streak.includes(i.id) && i.id !== avoidId);
  if (notStreak.length) return notStreak[0];
  const other = pool.filter((i) => i.id !== avoidId);
  return (other.length ? other : pool)[0];
}

/** Choose the next camp: catch-up after a slip > spaced re-check > wobbly > least recently visited unfinished camp. */
function pickConcept(pool, state) {
  const open = pool.concepts.filter((c) => !state.concepts[c.name].stamped);
  if (!open.length) return null;
  if (state.catchUp) { const c = open.find((x) => x.name === state.catchUp); if (c) return c; }
  const gap = Math.min(GAP, pool.concepts.length - 1);
  const due = open.filter((c) => { const s = state.concepts[c.name]; return s.secured && state.step - s.securedStep >= gap; });
  if (due.length) return due.sort((a, b) => state.concepts[a.name].securedStep - state.concepts[b.name].securedStep)[0];
  // everything left is waiting out its gap: nudge time forward so a lone secured camp can be re-checked
  const climbing = open.filter((c) => !state.concepts[c.name].secured);
  const lastName = state.last?.concept;
  const rank = (c) => { const s = state.concepts[c.name]; return (s.lastWrong ? 0 : s.right + s.wrong === 0 ? 1 : 2) * 1e6 + s.lastStep; };
  const pool2 = climbing.length ? climbing : open;
  const sorted = [...pool2].sort((a, b) => rank(a) - rank(b));
  return sorted.find((c) => c.name !== lastName) ?? sorted[0];
}

/** Returns { done:true } at the summit, otherwise the question to show. Mutates `state.pending` (server-side secret). */
export function nextQuestion(pool, state, rng = Math.random) {
  if (allStamped(pool, state)) { state.summit = true; return { done: true }; }
  let c = pickConcept(pool, state);
  if (!c) return { done: true };
  const s = state.concepts[c.name];
  // a secured camp is waiting out its gap but nothing else is open: just re-check it now
  const item = pickItem(c, s, state.last?.id);
  const order = shuffle(item.choices.map((_, i) => i), rng);
  state.pending = { id: item.id, concept: c.name, order, recheck: s.secured && !s.stamped };
  return {
    done: false, concept: c.name, recheck: state.pending.recheck, id: item.id, q: item.q,
    choices: order.map((i) => item.choices[i]), status: statusOf(s), streak: s.streak.length, needed: c.needed,
  };
}

/** choice = index into the SHUFFLED choices that were sent to the student. */
export function submitAnswer(pool, state, choice) {
  const p = state.pending;
  if (!p) return { error: "No question is waiting." };
  const c = pool.concepts.find((x) => x.name === p.concept);
  const item = c?.items.find((i) => i.id === p.id);
  if (!item) { state.pending = null; return { error: "That question changed. Try again." }; }
  const idx = Number(choice);
  if (!Number.isInteger(idx) || idx < 0 || idx >= p.order.length) return { error: "Pick one of the answers." };
  const s = state.concepts[c.name];
  const correct = p.order[idx] === item.answer;
  const correctText = item.choices[item.answer];
  state.pending = null; state.step++;
  s.lastStep = state.step;
  if (!s.seen.includes(item.id)) s.seen.push(item.id);
  state.last = { id: item.id, concept: c.name };
  let event = "ok";
  if (correct) {
    s.right++; s.lastWrong = false; state.catchUp = null;
    if (p.recheck) { s.stamped = true; event = "stamped"; }
    else {
      if (!s.streak.includes(item.id)) s.streak.push(item.id);
      if (s.streak.length >= c.needed) { s.secured = true; s.securedStep = state.step; event = "secured"; }
    }
  } else {
    s.wrong++; s.lastWrong = true; s.streak = [];
    if (s.secured) { event = "fell"; s.secured = false; s.stamped = false; } else event = "slip";
    state.catchUp = c.name;          // "catch yourself": next question is a different one on the same camp
  }
  let summit = false;
  if (allStamped(pool, state) && !state.summit) { state.summit = true; state.summitAt = state.step; summit = true; event = "summit"; }
  return {
    correct, event, summit, concept: c.name, correctIndex: p.order.indexOf(item.answer), correctText,
    explain: item.explain ?? null,
    status: statusOf(s), streak: s.streak.length, needed: c.needed,
  };
}

/** Teacher report: how many students are in each state per camp, hardest camps first. */
export function classReport(pool, states) {
  const rows = pool.concepts.map((c) => {
    const counts = { unseen: 0, climbing: 0, wobbly: 0, secured: 0, stamped: 0 };
    let right = 0, wrong = 0;
    for (const st of states) {
      const s = st.concepts?.[c.name];
      if (!s) { counts.unseen++; continue; }
      counts[statusOf(s)]++; right += s.right; wrong += s.wrong;
    }
    return { name: c.name, counts, accuracy: right + wrong ? Math.round((right / (right + wrong)) * 100) : null, attempts: right + wrong, questions: c.items.length };
  });
  const hardest = [...rows].filter((r) => r.attempts >= 3 && r.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3).map((r) => r.name);
  return { students: states.length, summited: states.filter((s) => s.summit).length, concepts: rows, hardest };
}
