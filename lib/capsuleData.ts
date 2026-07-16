// ─── Cap definitions ──────────────────────────────────────────────────────────

export type CapRarity = "common" | "rare" | "epic" | "mythic";

export interface Cap {
  id: string;
  name: string;
  emoji: string;
  rarity: CapRarity;
  bg: string;      // CSS gradient or color for the circle background
  ring: string;    // border/ring color
}

export const CAPS: Cap[] = [
  // Common
  { id: "cap-fox",      name: "Fox",        emoji: "🦊", rarity: "common",  bg: "linear-gradient(135deg,#f97316,#ea580c)", ring: "#fed7aa" },
  { id: "cap-cat",      name: "Cat",        emoji: "🐱", rarity: "common",  bg: "linear-gradient(135deg,#ec4899,#db2777)", ring: "#fbcfe8" },
  { id: "cap-dog",      name: "Dog",        emoji: "🐶", rarity: "common",  bg: "linear-gradient(135deg,#a16207,#92400e)", ring: "#fde68a" },
  { id: "cap-frog",     name: "Frog",       emoji: "🐸", rarity: "common",  bg: "linear-gradient(135deg,#16a34a,#15803d)", ring: "#bbf7d0" },
  { id: "cap-fish",     name: "Fish",       emoji: "🐟", rarity: "common",  bg: "linear-gradient(135deg,#2563eb,#1d4ed8)", ring: "#bfdbfe" },
  { id: "cap-duck",     name: "Duck",       emoji: "🦆", rarity: "common",  bg: "linear-gradient(135deg,#ca8a04,#a16207)", ring: "#fef08a" },
  { id: "cap-owl",      name: "Owl",        emoji: "🦉", rarity: "common",  bg: "linear-gradient(135deg,#0f766e,#0d9488)", ring: "#99f6e4" },
  { id: "cap-bunny",    name: "Bunny",      emoji: "🐰", rarity: "common",  bg: "linear-gradient(135deg,#7c3aed,#6d28d9)", ring: "#ddd6fe" },
  { id: "cap-bear",     name: "Bear",       emoji: "🐻", rarity: "common",  bg: "linear-gradient(135deg,#78350f,#92400e)", ring: "#fde68a" },
  { id: "cap-hamster",  name: "Hamster",    emoji: "🐹", rarity: "common",  bg: "linear-gradient(135deg,#f472b6,#e879f9)", ring: "#fce7f3" },
  // Rare
  { id: "cap-lion",     name: "Lion",       emoji: "🦁", rarity: "rare",    bg: "linear-gradient(135deg,#d97706,#b45309)", ring: "#fcd34d" },
  { id: "cap-shark",    name: "Shark",      emoji: "🦈", rarity: "rare",    bg: "linear-gradient(135deg,#1e3a5f,#1e40af)", ring: "#93c5fd" },
  { id: "cap-penguin",  name: "Penguin",    emoji: "🐧", rarity: "rare",    bg: "linear-gradient(135deg,#1e293b,#334155)", ring: "#94a3b8" },
  { id: "cap-butterfly",name: "Butterfly",  emoji: "🦋", rarity: "rare",    bg: "linear-gradient(135deg,#7c3aed,#a855f7)", ring: "#e9d5ff" },
  { id: "cap-flamingo", name: "Flamingo",   emoji: "🦩", rarity: "rare",    bg: "linear-gradient(135deg,#be185d,#ec4899)", ring: "#fda4af" },
  { id: "cap-koala",    name: "Koala",      emoji: "🐨", rarity: "rare",    bg: "linear-gradient(135deg,#374151,#6b7280)", ring: "#d1d5db" },
  { id: "cap-panda",    name: "Panda",      emoji: "🐼", rarity: "rare",    bg: "linear-gradient(135deg,#111827,#374151)", ring: "#f9fafb" },
  { id: "cap-turtle",   name: "Turtle",     emoji: "🐢", rarity: "rare",    bg: "linear-gradient(135deg,#14532d,#166534)", ring: "#86efac" },
  // Epic
  { id: "cap-dragon",   name: "Dragon",     emoji: "🐉", rarity: "epic",    bg: "linear-gradient(135deg,#4c1d95,#7c3aed,#4f46e5)", ring: "#c4b5fd" },
  { id: "cap-wolf",     name: "Night Wolf", emoji: "🐺", rarity: "epic",    bg: "linear-gradient(135deg,#0f172a,#1e1b4b,#312e81)", ring: "#818cf8" },
  { id: "cap-eagle",    name: "Eagle",      emoji: "🦅", rarity: "epic",    bg: "linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c)", ring: "#fca5a5" },
  { id: "cap-crystal",  name: "Crystal",    emoji: "💎", rarity: "epic",    bg: "linear-gradient(135deg,#0e7490,#0891b2,#22d3ee)", ring: "#a5f3fc" },
  { id: "cap-phoenix",  name: "Phoenix",    emoji: "🔥", rarity: "epic",    bg: "linear-gradient(135deg,#9a3412,#ea580c,#f59e0b)", ring: "#fde68a" },
  // Mythic
  { id: "cap-crown",    name: "Crown",      emoji: "👑", rarity: "mythic",  bg: "linear-gradient(135deg,#854d0e,#ca8a04,#fbbf24,#ca8a04)", ring: "#fde047" },
  { id: "cap-galaxy",   name: "Galaxy",     emoji: "🌌", rarity: "mythic",  bg: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", ring: "#a78bfa" },
  { id: "cap-ghost",    name: "Ghost",      emoji: "👻", rarity: "mythic",  bg: "linear-gradient(135deg,#e2e8f0,#cbd5e1,#94a3b8)", ring: "#ffffff" },
];

export const CAP_MAP = Object.fromEntries(CAPS.map(c => [c.id, c]));

export const STARTER_CAP_ID = "cap-fox";

export const RARITY_LABEL: Record<CapRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  mythic: "Mythic",
};

// ─── Chest rewards ────────────────────────────────────────────────────────────

export type ChestResult =
  | { type: "gold"; amount: number; label: string }
  | { type: "steal"; fromId: string; fromName: string; amount: number; label: string }
  | { type: "lose"; amount: number; label: string }
  | { type: "double"; label: string };

export function rollChest(
  playerId: string,
  players: Array<{ id: string; display_name: string; gold: number }>,
): ChestResult {
  const others = players.filter(p => p.id !== playerId && p.gold > 0);
  const r = Math.random();

  if (r < 0.38) {
    const amount = Math.floor(Math.random() * 51) + 30;
    return { type: "gold", amount, label: `+${amount} Gold!` };
  }
  if (r < 0.60) {
    const amount = Math.floor(Math.random() * 71) + 80;
    return { type: "gold", amount, label: `+${amount} Gold!` };
  }
  if (r < 0.70) {
    const amount = Math.floor(Math.random() * 151) + 150;
    return { type: "gold", amount, label: `+${amount} Gold! 🎉` };
  }
  if (r < 0.80) {
    if (!others.length) return { type: "gold", amount: 50, label: "+50 Gold!" };
    const target = others[Math.floor(Math.random() * others.length)];
    const amount = Math.min(75, target.gold);
    return { type: "steal", fromId: target.id, fromName: target.display_name, amount, label: `Robbed ${target.display_name} for ${amount}!` };
  }
  if (r < 0.88) {
    if (!others.length) return { type: "gold", amount: 75, label: "+75 Gold!" };
    const richest = others.reduce((a, b) => a.gold > b.gold ? a : b);
    const amount = Math.min(120, richest.gold);
    return { type: "steal", fromId: richest.id, fromName: richest.display_name, amount, label: `Robbed the leader for ${amount}!` };
  }
  if (r < 0.95) {
    return { type: "lose", amount: 50, label: "Vault Tax! -50 Gold 💀" };
  }
  return { type: "double", label: "DOUBLED! 🔥" };
}

// ─── Cap rolling ──────────────────────────────────────────────────────────────

const RARITY_WEIGHTS: Record<CapRarity, number> = {
  common: 65,
  rare:   25,
  epic:    8,
  mythic:  2,
};

export const CAPSULE_COST = 50; // coins per open

export function rollCap(): Cap {
  const pool: Cap[] = [];
  for (const cap of CAPS) {
    const weight = RARITY_WEIGHTS[cap.rarity];
    for (let i = 0; i < weight; i++) pool.push(cap);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Built-in demo question set ───────────────────────────────────────────────

export interface CapsuleQuestion {
  prompt: string;
  choices: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  timeLimit: number;
}

export const DEMO_QUESTIONS: CapsuleQuestion[] = [
  {
    prompt: "What is the powerhouse of the cell?",
    choices: ["Mitochondria", "Nucleus", "Ribosome", "Golgi apparatus"],
    answer: 0, timeLimit: 20,
  },
  {
    prompt: "Which planet is closest to the Sun?",
    choices: ["Mercury", "Venus", "Earth", "Mars"],
    answer: 0, timeLimit: 20,
  },
  {
    prompt: "What is 7 × 8?",
    choices: ["56", "54", "64", "48"],
    answer: 0, timeLimit: 15,
  },
  {
    prompt: "Who wrote Romeo and Juliet?",
    choices: ["Shakespeare", "Dickens", "Austen", "Chaucer"],
    answer: 0, timeLimit: 20,
  },
  {
    prompt: "What year did World War II end?",
    choices: ["1945", "1944", "1946", "1943"],
    answer: 0, timeLimit: 20,
  },
  {
    prompt: "What is the chemical symbol for gold?",
    choices: ["Au", "Ag", "Fe", "Cu"],
    answer: 0, timeLimit: 20,
  },
  {
    prompt: "Which ocean is the largest?",
    choices: ["Pacific", "Atlantic", "Indian", "Arctic"],
    answer: 0, timeLimit: 20,
  },
  {
    prompt: "What is the square root of 144?",
    choices: ["12", "14", "11", "13"],
    answer: 0, timeLimit: 15,
  },
];
