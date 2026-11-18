// Daily Puzzle: five quick puzzles, the same for everyone on a given UTC date (pure function of the date).
// Answers never leave the server until a puzzle is solved or its tries are used up.
import { DEFAULT_QUESTIONS, DRAW_PROMPTS } from "./content.mjs";
import { dayKey, hash, rng } from "./shop.mjs";

export const TRIES = 2;
export const PUZZLE_COUNT = 5;
export const COINS_BASE = 5, COINS_PER_SOLVE = 3;

const WORDS = DRAW_PROMPTS.filter((w) => /^[a-z]{5,9}$/.test(w));
const CATEGORIES = {
  fruits: "apple banana cherry grape mango peach pear plum lemon melon",
  vegetables: "carrot broccoli celery onion potato spinach pumpkin radish pepper lettuce",
  animals: "tiger rabbit dolphin camel panda koala horse otter falcon turtle",
  planets: "mercury venus earth mars jupiter saturn uranus neptune",
  colors: "red blue green yellow purple orange pink brown black white",
  instruments: "piano guitar violin trumpet flute drum cello harp banjo tuba",
  shapes: "circle square triangle hexagon pentagon oval diamond octagon",
  vehicles: "bicycle tractor rocket submarine scooter helicopter bus train canoe",
  school: "pencil eraser ruler backpack notebook marker stapler folder scissors desk",
  weather: "rain snow thunder fog hail breeze tornado drizzle sunshine blizzard",
  sports: "soccer tennis hockey baseball volleyball swimming archery rugby golf boxing",
  clothes: "jacket sweater mitten sneaker scarf sandal helmet gloves shirt boots",
};

const pickN = (arr, n, r) => { const a = [...arr]; const out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(r() * a.length), 1)[0]); return out; };
const shuffleSeeded = (arr, r) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9.-]/g, "");

function scramble(r) {
  const word = pickN(WORDS, 1, r)[0];
  let letters = word.split("");
  for (let i = 0; i < 8; i++) { letters = shuffleSeeded(word.split(""), r); if (letters.join("") !== word) break; }
  return { kind: "scramble", type: "text", title: "Unscramble it", prompt: letters.join("").toUpperCase(), hint: `${word.length} letters - something you could draw`, answer: word };
}

function missingVowels(r) {
  const word = pickN(WORDS.filter((w) => w.length >= 6), 1, r)[0];
  return { kind: "vowels", type: "text", title: "Where did the vowels go?", prompt: word.replace(/[aeiou]/g, "_").toUpperCase().split("").join(" "), hint: `${word.length} letters`, answer: word };
}

function sequence(r) {
  const t = Math.floor(r() * 5);
  let terms = [];
  if (t === 0) { const a = 2 + Math.floor(r() * 9), d = 2 + Math.floor(r() * 8); terms = Array.from({ length: 6 }, (_, i) => a + d * i); }
  else if (t === 1) { const a = 1 + Math.floor(r() * 4), m = 2 + Math.floor(r() * 2); terms = Array.from({ length: 6 }, (_, i) => a * m ** i); }
  else if (t === 2) { const s = 1 + Math.floor(r() * 5); terms = Array.from({ length: 6 }, (_, i) => (s + i) ** 2); }
  else if (t === 3) { let a = 1 + Math.floor(r() * 4), b = 2 + Math.floor(r() * 5); terms = [a, b]; for (let i = 2; i < 6; i++) terms.push(terms[i - 1] + terms[i - 2]); }
  else { const a = 3 + Math.floor(r() * 10), x = 2 + Math.floor(r() * 4), y = 5 + Math.floor(r() * 5); terms = [a]; for (let i = 1; i < 6; i++) terms.push(terms[i - 1] + (i % 2 ? x : y)); }
  const answer = terms[5];
  return { kind: "sequence", type: "number", title: "What comes next?", prompt: terms.slice(0, 5).join(", ") + ", ?", hint: "Find the pattern", answer: String(answer) };
}

function oddOne(r) {
  const names = Object.keys(CATEGORIES);
  const [a, b] = pickN(names, 2, r);
  const three = pickN(CATEGORIES[a].split(" "), 3, r), odd = pickN(CATEGORIES[b].split(" "), 1, r)[0];
  const choices = shuffleSeeded([...three, odd], r);
  return { kind: "odd", type: "choice", title: "Odd one out", prompt: "Which one does NOT belong?", choices: choices.map((c) => c[0].toUpperCase() + c.slice(1)), answer: String(choices.indexOf(odd)), reveal: `${odd} is not a ${a.replace(/s$/, "")}` };
}

function trivia(r) {
  const pool = DEFAULT_QUESTIONS.filter((q) => q.choices.length === 4);
  const q = pickN(pool, 1, r)[0];
  const order = shuffleSeeded([0, 1, 2, 3], r);
  return { kind: "trivia", type: "choice", title: "Brain snack", prompt: q.q, choices: order.map((i) => q.choices[i]), answer: String(order.indexOf(q.answer)) };
}

export function dailyPuzzles(date = dayKey()) {
  const r = rng(hash(`arcade-daily:${date}`));
  return [scramble(r), sequence(r), oddOne(r), missingVowels(r), trivia(r)];
}

/** What the client may see. */
export function publicPuzzle(p, i) {
  return { n: i, kind: p.kind, type: p.type, title: p.title, prompt: p.prompt, hint: p.hint ?? null, choices: p.choices ?? null };
}

export function checkAnswer(p, answer) {
  if (p.type === "choice") return String(Number(answer)) === p.answer;
  return norm(answer) === norm(p.answer);
}

export const revealText = (p) => (p.type === "choice" ? p.choices[Number(p.answer)] : p.answer.toUpperCase());

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export function newDailyState(date) { return { v: 1, date, results: Array(PUZZLE_COUNT).fill(null), tries: Array(PUZZLE_COUNT).fill(0), done: false, streak: 0, best: 0, lastDone: null, rewarded: false }; }

/** Roll a stored state forward to `date`, keeping the streak only if it is still alive. */
export function stateFor(saved, date) {
  if (!saved || saved.v !== 1) return newDailyState(date);
  if (saved.date === date) return saved;
  const alive = saved.lastDone && daysBetween(saved.lastDone, date) <= 1;
  return { ...newDailyState(date), streak: alive ? saved.streak : 0, best: saved.best ?? 0, lastDone: saved.lastDone };
}

/** Apply a guess to a signed-in player's state. Returns { correct, resolved, reveal?, finished }. */
export function applyGuess(puzzles, state, n, answer, date) {
  if (!Number.isInteger(n) || n < 0 || n >= PUZZLE_COUNT) return { error: "Unknown puzzle." };
  if (state.results[n]) return { error: "You already finished that one." };
  const p = puzzles[n];
  state.tries[n]++;
  const correct = checkAnswer(p, answer);
  let resolved = false, reveal = null;
  if (correct) { state.results[n] = { ok: true, tries: state.tries[n] }; resolved = true; }
  else if (state.tries[n] >= TRIES) { state.results[n] = { ok: false, tries: state.tries[n] }; resolved = true; reveal = p.reveal ?? revealText(p); if (!p.reveal) reveal = revealText(p); }
  let finished = false;
  if (state.results.every(Boolean) && !state.done) {
    state.done = true; finished = true;
    state.streak = (state.lastDone && daysBetween(state.lastDone, date) === 1 ? state.streak : 0) + 1;
    state.best = Math.max(state.best ?? 0, state.streak); state.lastDone = date;
  }
  return { correct, resolved, reveal, finished, triesLeft: Math.max(0, TRIES - state.tries[n]) };
}

export const coinsFor = (state) => COINS_BASE + COINS_PER_SOLVE * state.results.filter((r) => r?.ok).length;
