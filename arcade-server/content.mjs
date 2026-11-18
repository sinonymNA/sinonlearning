import { GameError, shuffle } from "./util.mjs";
import { cleanText } from "./moderation.mjs";
import { EXTRA_DRAW_PROMPTS, EXTRA_TELEPHONE_PROMPTS, EXTRA_IMPOSTER_WORDS, EXTRA_QUESTIONS } from "./data/extraContent.mjs";

/** Content sets: { id, title, items: { questions, vocab, drawPrompts, telephonePrompts, imposterWords } } */
const Q = (q, a, b, c, d, answer) => ({ q, choices: [a, b, c, d], answer });

export const DEFAULT_QUESTIONS = [
  Q("Which planet is known as the Red Planet?", "Venus", "Mars", "Jupiter", "Mercury", 1),
  Q("What is 7 x 8?", "54", "56", "58", "64", 1),
  Q("What gas do plants absorb from the air?", "Oxygen", "Nitrogen", "Carbon dioxide", "Helium", 2),
  Q("Which is the largest ocean on Earth?", "Atlantic", "Indian", "Arctic", "Pacific", 3),
  Q("What is the past tense of 'run'?", "Runned", "Ran", "Running", "Runs", 1),
  Q("How many sides does a hexagon have?", "5", "6", "7", "8", 1),
  Q("Which part of a plant makes food using sunlight?", "Roots", "Stem", "Leaves", "Petals", 2),
  Q("What is the capital of France?", "Rome", "Madrid", "Paris", "Berlin", 2),
  Q("Which word is a synonym for 'happy'?", "Gloomy", "Joyful", "Angry", "Sleepy", 1),
  Q("What is 144 divided by 12?", "10", "11", "12", "14", 2),
  Q("What do bees collect from flowers?", "Nectar", "Sand", "Wax", "Seeds", 0),
  Q("Which continent is Egypt in?", "Asia", "Europe", "Africa", "South America", 2),
  Q("What is the boiling point of water in Celsius?", "50", "90", "100", "212", 2),
  Q("Which of these is a mammal?", "Shark", "Dolphin", "Trout", "Octopus", 1),
  Q("What is the opposite of 'ancient'?", "Old", "Modern", "Broken", "Tiny", 1),
  Q("How many minutes are in two hours?", "100", "110", "120", "140", 2),
  Q("Which force pulls objects toward Earth?", "Friction", "Magnetism", "Gravity", "Wind", 2),
  Q("Who wrote 'Romeo and Juliet'?", "Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen", 1),
  Q("What is the square root of 81?", "7", "8", "9", "11", 2),
  Q("Which is the longest river in Africa?", "Amazon", "Nile", "Thames", "Yangtze", 1),
  Q("A noun names a...", "Action", "Person, place, or thing", "Feeling only", "Speed", 1),
  Q("What is H2O commonly called?", "Salt", "Water", "Acid", "Air", 1),
  Q("How many continents are there?", "5", "6", "7", "8", 2),
  Q("Which shape has three sides?", "Square", "Triangle", "Circle", "Pentagon", 1),
  Q("What is 15% of 200?", "20", "25", "30", "35", 2),
  Q("Which layer of Earth do we live on?", "Core", "Mantle", "Crust", "Atmosphere", 2),
  Q("What is the plural of 'mouse' (the animal)?", "Mouses", "Mice", "Mices", "Mouse", 1),
  Q("Which instrument has 88 keys?", "Guitar", "Violin", "Piano", "Flute", 2),
  Q("What is the freezing point of water in Fahrenheit?", "0", "32", "100", "212", 1),
  Q("Which country has the city of Tokyo?", "China", "Korea", "Japan", "Thailand", 2),
  Q("What do we call animals that eat only plants?", "Carnivores", "Herbivores", "Omnivores", "Predators", 1),
  Q("Which number is prime?", "9", "15", "17", "21", 2),
  Q("What is the main language spoken in Brazil?", "Spanish", "Portuguese", "French", "English", 1),
  Q("What does a thermometer measure?", "Weight", "Speed", "Temperature", "Distance", 2),
  Q("Which is a verb?", "Quickly", "Banana", "Jump", "Purple", 2),
  Q("How many degrees are in a right angle?", "45", "90", "180", "360", 1),
  Q("Which planet has the most famous rings?", "Mars", "Saturn", "Earth", "Neptune", 1),
  Q("What is the largest land animal?", "Giraffe", "Rhino", "African elephant", "Hippo", 2),
  Q("What is 9 + 6 x 2?", "30", "21", "24", "18", 1),
  Q("Which of these is a fraction equal to one half?", "2/3", "3/6", "1/3", "4/5", 1),
  Q("The Statue of Liberty is in which city?", "Boston", "Chicago", "New York", "Miami", 2),
  Q("Which color do you get by mixing blue and yellow paint?", "Purple", "Orange", "Green", "Brown", 2),
  Q("What does 'transparent' mean?", "You can see through it", "Very loud", "Very heavy", "Shiny gold", 0),
  Q("How many legs does a spider have?", "6", "8", "10", "12", 1),
  Q("What is the process of water turning into vapor?", "Condensation", "Evaporation", "Freezing", "Erosion", 1),
  Q("Which ocean is between Africa and Australia?", "Atlantic", "Indian", "Arctic", "Pacific", 1),
  Q("Which sentence uses a capital letter correctly?", "my dog is big", "MY DOG is big.", "My dog is big.", "my Dog is Big!", 2),
  Q("What is 1/4 as a decimal?", "0.14", "0.25", "0.4", "0.75", 1),
  Q("Which animal is a reptile?", "Frog", "Snake", "Whale", "Bat", 1),
  Q("What is the center of an atom called?", "Shell", "Nucleus", "Cell", "Orbit", 1),
  Q("Which is the smallest prime number?", "0", "1", "2", "3", 2),
  Q("A group of wolves is called a...", "Herd", "Pack", "Flock", "School", 1),
  Q("Who was the first President of the United States?", "Abraham Lincoln", "Thomas Jefferson", "George Washington", "John Adams", 2),
  Q("What is the main job of the heart?", "Digest food", "Pump blood", "Think", "Make bones", 1),
  Q("Which word is spelled correctly?", "Recieve", "Receive", "Receeve", "Riceive", 1),
  Q("What is 3 cubed (3 x 3 x 3)?", "9", "18", "27", "81", 2),
  Q("What is the Earth's natural satellite?", "Sun", "Moon", "Mars", "Venus", 1),
  Q("Which is a renewable energy source?", "Coal", "Oil", "Solar", "Natural gas", 2),
  Q("What is the main idea of a paragraph?", "The longest sentence", "What it is mostly about", "The first word", "The title only", 1),
  Q("How many months have 31 days?", "5", "6", "7", "8", 2),
];

export const DEFAULT_TELEPHONE_PROMPTS = [
  "A cat riding a skateboard", "A dinosaur eating pizza", "An astronaut walking a dog", "A pirate baking cookies",
  "A giant snail racing a car", "A robot learning to dance", "A penguin on a surfboard", "A wizard stuck in an elevator",
  "A ghost at a birthday party", "A shark wearing sunglasses", "A dragon roasting marshmallows", "A frog playing the guitar",
  "A superhero afraid of spiders", "A banana in a space suit", "A monster brushing its teeth", "A turtle winning a marathon",
  "A mermaid in a bathtub", "A cow jumping over a rainbow", "An octopus doing homework", "A knight riding a unicycle",
  "A bear fishing with a spoon", "A snowman on the beach", "A chicken driving a bus", "A unicorn at the dentist",
  "A tiny elephant in a teacup", "An alien ordering tacos", "A hamster running a bakery", "A wolf knitting a sweater",
  "A pancake with legs", "A zombie gardening", "A llama in a rainstorm", "A fox reading a bedtime story",
  "A whale carrying an umbrella", "A king chasing a runaway crown", "A teddy bear on a roller coaster", "A duck in a top hat",
];

const W = (word, related) => ({ word, related });
export const DEFAULT_IMPOSTER_WORDS = [
  W("BEACH", ["sand", "waves", "towel", "sunscreen", "shells", "swimming"]),
  W("SCHOOL", ["teacher", "homework", "recess", "backpack", "desk", "bell"]),
  W("PIZZA", ["cheese", "slice", "oven", "pepperoni", "delivery", "crust"]),
  W("ZOO", ["animals", "cages", "tickets", "monkeys", "feeding", "stripes"]),
  W("SPACE", ["stars", "rocket", "planets", "astronaut", "gravity", "dark"]),
  W("LIBRARY", ["books", "quiet", "shelves", "reading", "card", "whisper"]),
  W("CAMPING", ["tent", "fire", "marshmallows", "forest", "sleeping bag", "stars"]),
  W("HOSPITAL", ["doctor", "nurse", "bed", "medicine", "waiting", "bandage"]),
  W("BIRTHDAY", ["cake", "candles", "presents", "balloons", "party", "singing"]),
  W("SNOW DAY", ["sled", "hot chocolate", "mittens", "snowman", "cold", "cancelled"]),
  W("FARM", ["tractor", "cows", "barn", "hay", "chickens", "crops"]),
  W("AIRPORT", ["plane", "luggage", "tickets", "security", "gate", "pilot"]),
  W("MUSEUM", ["exhibits", "quiet", "paintings", "tour guide", "history", "gift shop"]),
  W("CIRCUS", ["clown", "tent", "acrobat", "popcorn", "tightrope", "lion"]),
  W("SUPERMARKET", ["cart", "aisle", "cashier", "groceries", "checkout", "fruit"]),
  W("PLAYGROUND", ["swings", "slide", "friends", "sandbox", "monkey bars", "recess"]),
  W("MOVIE THEATER", ["popcorn", "screen", "tickets", "dark", "seats", "trailer"]),
  W("RAINFOREST", ["jungle", "monkeys", "humid", "trees", "parrot", "vines"]),
  W("BAKERY", ["bread", "oven", "croissant", "sweet", "flour", "morning"]),
  W("ROLLER COASTER", ["loop", "scream", "line", "seatbelt", "fast", "amusement park"]),
  W("DESERT", ["sand", "camel", "cactus", "hot", "dunes", "oasis"]),
  W("AQUARIUM", ["fish", "tank", "sharks", "glass", "jellyfish", "tunnel"]),
  W("CASTLE", ["knight", "moat", "tower", "king", "dragon", "drawbridge"]),
  W("SOCCER GAME", ["goal", "referee", "team", "kick", "stadium", "cheering"]),
  W("SUBMARINE", ["ocean", "periscope", "deep", "crew", "torpedo", "sonar"]),
  W("THUNDERSTORM", ["lightning", "rain", "thunder", "umbrella", "dark clouds", "puddles"]),
  W("LAUNDROMAT", ["washer", "dryer", "socks", "coins", "soap", "folding"]),
  W("TREEHOUSE", ["ladder", "branches", "secret club", "high", "rope", "leaves"]),
  W("PIRATE SHIP", ["treasure", "sails", "parrot", "map", "plank", "ocean"]),
  W("SCIENCE LAB", ["goggles", "experiment", "beaker", "microscope", "chemicals", "notes"]),
];

export const IMPOSTER_FALLBACK_QUESTIONS = [
  "What would you bring here?", "Who would you want to come with you here?", "What is something you might hear here?",
  "What is one word that describes this place or thing?", "What would you do first if you were here?",
  "What is something you might see here?", "How would you feel if you were here right now?",
  "What would be the best part?", "What would be the most annoying part?", "What time of day is best for this?",
  "What do you think you would wear here?", "What is the first thing you would tell a friend about it?",
  "What would you eat or drink here?", "Is it better with a lot of people or just a few?", "What is something you'd never do here?",
  "What would your pet think about this?", "What's one thing that could go wrong here?", "How would you explain this to a 5 year old?",
  "What sound would you hear the most?", "Would you rather be here in summer or winter?", "What is something you'd find in your pocket here?",
  "What would a superhero do here?", "What's the funniest thing that could happen here?", "How long could you stay here before getting bored?",
  "What smell comes to mind?", "What's one rule you'd make for this place?", "Who in your family would love this most?", "What would you take a photo of?",
];

/** Fixed multi-word draw prompts (the simple word-splitter above would break these). */
export const DRAW_PROMPTS = [
  "apple", "banana", "pizza", "hamburger", "ice cream", "cupcake", "sandwich", "popcorn", "carrot", "watermelon",
  "cat", "dog", "fish", "bird", "butterfly", "spider", "snake", "elephant", "giraffe", "penguin", "turtle", "shark", "owl", "rabbit",
  "house", "castle", "tent", "igloo", "lighthouse", "bridge", "windmill", "rocket", "airplane", "boat", "bicycle", "train", "school bus", "tractor",
  "sun", "moon", "star", "rainbow", "cloud", "lightning", "volcano", "mountain", "island", "waterfall", "tree", "flower", "cactus",
  "guitar", "drum", "piano", "camera", "clock", "key", "lamp", "umbrella", "backpack", "scissors", "book", "pencil",
  "robot", "dragon", "ghost", "pirate", "wizard", "mermaid", "dinosaur", "crown", "treasure map", "sword",
  "soccer ball", "skateboard", "kite", "balloon", "snowman", "campfire", "birthday cake", "present", "snail", "octopus",
];

// merge the extra libraries into the built-in pools (de-duplicated)
const mergeUnique = (base, extra, key = (x) => String(x).toLowerCase()) => { const seen = new Set(base.map(key)); for (const x of extra) if (!seen.has(key(x))) { seen.add(key(x)); base.push(x); } };
mergeUnique(DRAW_PROMPTS, EXTRA_DRAW_PROMPTS);
mergeUnique(DEFAULT_TELEPHONE_PROMPTS, EXTRA_TELEPHONE_PROMPTS);
mergeUnique(DEFAULT_IMPOSTER_WORDS, EXTRA_IMPOSTER_WORDS, (w) => w.word);
mergeUnique(DEFAULT_QUESTIONS, EXTRA_QUESTIONS, (q) => q.q);

export const DEFAULT_SET = {
  id: "builtin",
  title: "Arcade starter pack",
  builtin: true,
  items: {
    questions: DEFAULT_QUESTIONS,
    vocab: [],
    drawPrompts: DRAW_PROMPTS,
    telephonePrompts: DEFAULT_TELEPHONE_PROMPTS,
    imposterWords: DEFAULT_IMPOSTER_WORDS,
  },
};

/** How much content a game really wants so a full class never sees repeats (minimum is just "it runs"). */
export const RECOMMENDED = { vocab: 40, drawPrompts: 60, questions: 60, telephonePrompts: 40, imposterWords: 30 };
export const CONTENT_KEYS = Object.keys(RECOMMENDED);

export const GAME_NEEDS = {
  hot_potato: { key: "vocab", min: 3, optional: true, label: "vocabulary words" },
  quick_draw: { key: "drawPrompts", min: 3, label: "drawing prompts" },
  last_one_standing: { key: "questions", min: 5, label: "multiple-choice questions" },
  piggy_bank: { key: "questions", min: 5, label: "multiple-choice questions" },
  telephone: { key: "telephonePrompts", min: 3, label: "telephone prompts" },
  imposter: { key: "imposterWords", min: 3, label: "secret words" },
};

export function compatibility(set) {
  const out = {};
  for (const [game, need] of Object.entries(GAME_NEEDS)) {
    const count = set?.items?.[need.key]?.length ?? 0;
    const recommended = RECOMMENDED[need.key];
    out[game] = { ok: need.optional || count >= need.min, count, need: need.min, recommended, plenty: count >= recommended, label: need.label };
  }
  return out;
}

/** Items for a game: teacher set when it is compatible, else the built-in defaults. */
export function contentFor(game, set) {
  const need = GAME_NEEDS[game];
  const own = set?.items?.[need.key];
  if (own && own.length >= need.min) return { items: own, source: set.title ?? "Teacher set" };
  return { items: DEFAULT_SET.items[need.key] ?? [], source: need.optional ? "Dictionary" : DEFAULT_SET.title };
}

// ---------- validation & CSV ----------
export function sanitizeQuestion(raw) {
  const q = cleanText(raw?.q, { min: 5, max: 200, label: "Question" });
  const choices = (raw?.choices ?? []).map((c) => cleanText(c, { min: 1, max: 80, label: "Choice" }));
  if (choices.length < 2 || choices.length > 4) throw new GameError("Questions need 2 to 4 choices.");
  const answer = Number(raw?.answer);
  if (!Number.isInteger(answer) || answer < 0 || answer >= choices.length) throw new GameError("Mark which choice is correct.");
  if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) throw new GameError("Choices must be different.");
  const out = { q, choices, answer };
  // optional remediation metadata (used by Mastery Peak): why the answer is right + which concept it tests
  if (raw?.explain) { try { out.explain = cleanText(raw.explain, { min: 3, max: 300, label: "Explanation" }); } catch { /* drop */ } }
  if (raw?.concept) { try { out.concept = cleanText(raw.concept, { min: 2, max: 60, label: "Concept" }); } catch { /* drop */ } }
  // Mastery Peak sibling questions (same concept, different wording/numbers). One level deep only.
  if (Array.isArray(raw?.variants) && !raw.__variant) {
    const vs = [];
    for (const v of raw.variants.slice(0, 4)) { try { const x = sanitizeQuestion({ ...v, __variant: true }); delete x.concept; vs.push(x); } catch { /* drop bad variant */ } }
    if (vs.length) out.variants = vs;
  }
  return out;
}
const cleanWord = (w, max = 40) => cleanText(w, { min: 1, max, label: "Word" });

export function sanitizeItems(items = {}) {
  const arr = (v) => (Array.isArray(v) ? v : []);
  const out = {
    questions: arr(items.questions).slice(0, 200).map(sanitizeQuestion),
    vocab: [...new Set(arr(items.vocab).slice(0, 300).map((w) => cleanWord(w, 30).toLowerCase()))],
    drawPrompts: [...new Set(arr(items.drawPrompts).slice(0, 300).map((w) => cleanWord(w).toLowerCase()))],
    telephonePrompts: [...new Set(arr(items.telephonePrompts).slice(0, 300).map((w) => cleanWord(w, 80)))],
    imposterWords: arr(items.imposterWords).slice(0, 200).map((w) => ({
      word: cleanWord(w.word, 30).toUpperCase(),
      related: arr(w.related).slice(0, 12).map((r) => cleanWord(r, 30).toLowerCase()),
    })),
  };
  return out;
}

export function parseCsv(text) {
  const rows = []; let row = [], cell = "", quoted = false;
  const src = String(text ?? "").replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === "," || ch === "\t") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  row.push(cell); rows.push(row);
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean));
}

/** kind: questions | vocab | drawPrompts | telephonePrompts | imposterWords. Returns { items, errors }. */
export function importCsv(kind, text) {
  const rows = parseCsv(text);
  const items = [], errors = [];
  rows.forEach((r, i) => {
    const line = i + 1;
    try {
      if (kind === "questions") {
        if (i === 0 && /^question/i.test(r[0])) return;
        const choices = r.slice(1, 5).filter(Boolean);
        const c = (r[5] ?? "").trim();
        let answer = /^[1-4]$/.test(c) ? Number(c) - 1 : /^[a-d]$/i.test(c) ? c.toLowerCase().charCodeAt(0) - 97 : choices.findIndex((x) => x.toLowerCase() === c.toLowerCase());
        items.push(sanitizeQuestion({ q: r[0], choices, answer }));
      } else if (kind === "imposterWords") {
        if (i === 0 && /^word|secret/i.test(r[0])) return;
        items.push({ word: cleanWord(r[0], 30).toUpperCase(), related: (r[1] ?? "").split(/[;|]/).map((x) => x.trim()).filter(Boolean).slice(0, 12) });
      } else {
        if (i === 0 && /^(word|prompt|vocab)/i.test(r[0])) return;
        for (const cell of r) if (cell) items.push(kind === "telephonePrompts" ? cleanWord(cell, 80) : cleanWord(cell).toLowerCase());
      }
    } catch (e) { errors.push(`Row ${line}: ${e.message}`); }
  });
  return { items, errors };
}

export const shuffled = shuffle;

/**
 * Convert an existing Game Show payload (lib/gameShowTypes.ts) into arcade content so teachers reuse the
 * question banks they already built: Race -> multiple choice, Memory -> vocab/draw prompts/secret words,
 * Wheel -> telephone prompts. Grid and Feud are free-response formats and are not convertible.
 */
export function itemsFromGameShow(payload) {
  const d = payload?.data ?? {};
  const out = { questions: [], vocab: [], drawPrompts: [], telephonePrompts: [], imposterWords: [] };
  const short = (t, n) => String(t ?? "").trim().slice(0, n);
  switch (payload?.type) {
    case "race":
      out.questions = (d.questions ?? []).map((q) => ({ q: short(q.question, 200), choices: (q.choices ?? []).slice(0, 4).map((c) => short(c, 80)), answer: q.correctIndex }));
      break;
    case "memory":
      for (const p of d.pairs ?? []) {
        const term = short(p.term, 30);
        if (!term) continue;
        out.vocab.push(term);
        if (term.split(/\s+/).length <= 2) out.drawPrompts.push(term);
        const related = String(p.definition ?? "").split(/[^A-Za-z']+/).filter((w) => w.length > 4).slice(0, 6);
        out.imposterWords.push({ word: term.toUpperCase(), related });
      }
      break;
    case "wheel":
      out.telephonePrompts = (d.rounds ?? []).map((r) => short(r.phrase, 80)).filter(Boolean);
      break;
    default:
      throw new GameError("Only Race, Memory and Wheel game shows can be converted (Grid and Feud are free-response).");
  }
  return out;
}

/** Like sanitizeItems but drops individual bad items instead of throwing. Returns { items, dropped, reasons }. */
export function sanitizeLoose(items = {}) {
  const arr = (v) => (Array.isArray(v) ? v : []);
  let dropped = 0; const reasons = new Map();
  const each = (list, f, cap, label) => arr(list).slice(0, cap).flatMap((x) => {
    try { return [f(x)]; } catch (e) { dropped++; const r = `${label}: ${e.message}`; reasons.set(r, (reasons.get(r) ?? 0) + 1); return []; }
  });
  const seenQ = new Set();
  const questions = each(items.questions, sanitizeQuestion, 400, "question").filter((q) => { const k = q.q.toLowerCase(); if (seenQ.has(k)) { dropped++; return false; } seenQ.add(k); return true; });
  const out = {
    questions,
    vocab: [...new Set(each(items.vocab, (w) => cleanWord(w, 30).toLowerCase(), 400, "vocab word"))],
    drawPrompts: [...new Set(each(items.drawPrompts, (w) => cleanWord(w).toLowerCase(), 400, "drawing prompt"))],
    telephonePrompts: [...new Set(each(items.telephonePrompts, (w) => cleanWord(w, 80), 400, "telephone prompt"))],
    imposterWords: each(items.imposterWords, (w) => ({ word: cleanWord(w.word, 30).toUpperCase(), related: arr(w.related).slice(0, 12).flatMap((r) => { try { return [cleanWord(r, 30).toLowerCase()]; } catch { return []; } }) }), 300, "secret word"),
  };
  return { items: out, dropped, reasons: [...reasons.entries()].slice(0, 4).map(([r, n]) => `${r} (${n}x)`) };
}
