export type CapRarity = "common" | "rare" | "epic" | "mythic";
export type CapSet = "classic" | "space" | "brainrot" | "caroline";

export interface Cap {
  id: string;
  name: string;
  emoji: string;
  rarity: CapRarity;
  set: CapSet;
  bg: string;
  ring: string;
}

export interface CapsuleSet {
  id: string;
  name: string;
  description: string;
  cost: number;
  ballIcon: string;
  ballClosed: string;
  ballTop: string;
  ballBottom: string;
  glowColor: string;
  accentColor: string;
  available: boolean;
}

export const CAPSULE_SETS: CapsuleSet[] = [
  {
    id: "classic",
    name: "Classic",
    description: "The original collection. Common to mythic.",
    cost: 50,
    ballIcon: "/assets/capsule/store/ball-classic-icon.png",
    ballClosed: "/assets/capsule/classic-ball-closed.png",
    ballTop: "/assets/capsule/classic-ball-top.png",
    ballBottom: "/assets/capsule/classic-ball-bottom.png",
    glowColor: "rgba(239,68,68,0.55)",
    accentColor: "#ef4444",
    available: true,
  },
  {
    id: "space",
    name: "Space",
    description: "8 cosmic caps from across the galaxy.",
    cost: 50,
    ballIcon: "/assets/capsule/space-ball-closed.png",
    ballClosed: "/assets/capsule/space-ball-closed.png",
    ballTop: "/assets/capsule/space-ball-top.png",
    ballBottom: "/assets/capsule/space-ball-bottom.png",
    glowColor: "rgba(168,85,247,0.55)",
    accentColor: "#a855f7",
    available: true,
  },
  {
    id: "brainrot",
    name: "Italian Brainrot",
    description: "9 unhinged Italian meme characters. Molto pazzo.",
    cost: 50,
    ballIcon: "/assets/capsule/brainrot-ball-closed.png",
    ballClosed: "/assets/capsule/brainrot-ball-closed.png",
    ballTop: "/assets/capsule/brainrot-ball-top.png",
    ballBottom: "/assets/capsule/brainrot-ball-bottom.png",
    glowColor: "rgba(22,163,74,0.55)",
    accentColor: "#22c55e",
    available: true,
  },
  {
    id: "caroline",
    name: "Caroline's Emotions",
    description: "9 expressive caps from happy to sassy.",
    cost: 50,
    ballIcon: "/assets/capsule/caroline-ball-closed.png",
    ballClosed: "/assets/capsule/caroline-ball-closed.png",
    ballTop: "/assets/capsule/caroline-ball-top.png",
    ballBottom: "/assets/capsule/caroline-ball-bottom.png",
    glowColor: "rgba(251,191,36,0.55)",
    accentColor: "#fbbf24",
    available: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Coming soon. A new wave of rare caps.",
    cost: 100,
    ballIcon: "/assets/capsule/store/ball-premium-icon.png",
    ballClosed: "/assets/capsule/store/ball-premium-icon.png",
    ballTop: "/assets/capsule/store/ball-premium-icon.png",
    ballBottom: "/assets/capsule/store/ball-premium-icon.png",
    glowColor: "rgba(59,130,246,0.55)",
    accentColor: "#3b82f6",
    available: false,
  },
  {
    id: "legendary",
    name: "Legendary",
    description: "Coming soon. The rarest caps in existence.",
    cost: 200,
    ballIcon: "/assets/capsule/store/ball-legendary-icon.png",
    ballClosed: "/assets/capsule/store/ball-legendary-icon.png",
    ballTop: "/assets/capsule/store/ball-legendary-icon.png",
    ballBottom: "/assets/capsule/store/ball-legendary-icon.png",
    glowColor: "rgba(234,179,8,0.55)",
    accentColor: "#eab308",
    available: false,
  },
];

export const CAPS: Cap[] = [
  { id: "cap-fox", name: "Fox", emoji: "\uD83E\uDD8A", rarity: "common", set: "classic", bg: "linear-gradient(135deg,#f97316,#ea580c)", ring: "#fed7aa" },
  { id: "cap-cat", name: "Cat", emoji: "\uD83D\uDC31", rarity: "common", set: "classic", bg: "linear-gradient(135deg,#ec4899,#db2777)", ring: "#fbcfe8" },
  { id: "cap-dog", name: "Dog", emoji: "\uD83D\uDC36", rarity: "common", set: "classic", bg: "linear-gradient(135deg,#a16207,#92400e)", ring: "#fde68a" },
  { id: "cap-frog", name: "Frog", emoji: "\uD83D\uDC38", rarity: "common", set: "classic", bg: "linear-gradient(135deg,#16a34a,#15803d)", ring: "#bbf7d0" },
  { id: "cap-fish", name: "Fish", emoji: "\uD83D\uDC1F", rarity: "common", set: "classic", bg: "linear-gradient(135deg,#2563eb,#1d4ed8)", ring: "#bfdbfe" },
  { id: "cap-duck", name: "Duck", emoji: "\uD83E\uDD86", rarity: "common", set: "classic", bg: "linear-gradient(135deg,#ca8a04,#a16207)", ring: "#fef08a" },
  { id: "cap-owl", name: "Owl", emoji: "\uD83E\uDD89", rarity: "common", set: "classic", bg: "linear-gradient(135deg,#0f766e,#0d9488)", ring: "#99f6e4" },
  { id: "cap-bunny", name: "Bunny", emoji: "\uD83D\uDC30", rarity: "common", set: "classic", bg: "linear-gradient(135deg,#7c3aed,#6d28d9)", ring: "#ddd6fe" },
  { id: "cap-bear", name: "Bear", emoji: "\uD83D\uDC3B", rarity: "common", set: "classic", bg: "linear-gradient(135deg,#78350f,#92400e)", ring: "#fde68a" },
  { id: "cap-hamster", name: "Hamster", emoji: "\uD83D\uDC39", rarity: "common", set: "classic", bg: "linear-gradient(135deg,#f472b6,#e879f9)", ring: "#fce7f3" },
  { id: "cap-lion", name: "Lion", emoji: "\uD83E\uDD81", rarity: "rare", set: "classic", bg: "linear-gradient(135deg,#d97706,#b45309)", ring: "#fcd34d" },
  { id: "cap-shark", name: "Shark", emoji: "\uD83E\uDD88", rarity: "rare", set: "classic", bg: "linear-gradient(135deg,#1e3a5f,#1e40af)", ring: "#93c5fd" },
  { id: "cap-penguin", name: "Penguin", emoji: "\uD83D\uDC27", rarity: "rare", set: "classic", bg: "linear-gradient(135deg,#1e293b,#334155)", ring: "#94a3b8" },
  { id: "cap-butterfly", name: "Butterfly", emoji: "\uD83E\uDD8B", rarity: "rare", set: "classic", bg: "linear-gradient(135deg,#7c3aed,#a855f7)", ring: "#e9d5ff" },
  { id: "cap-flamingo", name: "Flamingo", emoji: "\uD83E\uDDA9", rarity: "rare", set: "classic", bg: "linear-gradient(135deg,#be185d,#ec4899)", ring: "#fda4af" },
  { id: "cap-koala", name: "Koala", emoji: "\uD83D\uDC28", rarity: "rare", set: "classic", bg: "linear-gradient(135deg,#374151,#6b7280)", ring: "#d1d5db" },
  { id: "cap-panda", name: "Panda", emoji: "\uD83D\uDC3C", rarity: "rare", set: "classic", bg: "linear-gradient(135deg,#111827,#374151)", ring: "#f9fafb" },
  { id: "cap-turtle", name: "Turtle", emoji: "\uD83D\uDC22", rarity: "rare", set: "classic", bg: "linear-gradient(135deg,#14532d,#166534)", ring: "#86efac" },
  { id: "cap-dragon", name: "Dragon", emoji: "\uD83D\uDC09", rarity: "epic", set: "classic", bg: "linear-gradient(135deg,#4c1d95,#7c3aed,#4f46e5)", ring: "#c4b5fd" },
  { id: "cap-wolf", name: "Night Wolf", emoji: "\uD83D\uDC3A", rarity: "epic", set: "classic", bg: "linear-gradient(135deg,#0f172a,#1e1b4b,#312e81)", ring: "#818cf8" },
  { id: "cap-eagle", name: "Eagle", emoji: "\uD83E\uDD85", rarity: "epic", set: "classic", bg: "linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c)", ring: "#fca5a5" },
  { id: "cap-crystal", name: "Crystal", emoji: "\uD83D\uDC8E", rarity: "epic", set: "classic", bg: "linear-gradient(135deg,#0e7490,#0891b2,#22d3ee)", ring: "#a5f3fc" },
  { id: "cap-phoenix", name: "Phoenix", emoji: "\uD83D\uDD25", rarity: "epic", set: "classic", bg: "linear-gradient(135deg,#9a3412,#ea580c,#f59e0b)", ring: "#fde68a" },
  { id: "cap-crown", name: "Crown", emoji: "\uD83D\uDC51", rarity: "mythic", set: "classic", bg: "linear-gradient(135deg,#854d0e,#ca8a04,#fbbf24,#ca8a04)", ring: "#fde047" },
  { id: "cap-galaxy", name: "Galaxy", emoji: "\uD83C\uDF0C", rarity: "mythic", set: "classic", bg: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", ring: "#a78bfa" },
  { id: "cap-ghost", name: "Ghost", emoji: "\uD83D\uDC7B", rarity: "mythic", set: "classic", bg: "linear-gradient(135deg,#e2e8f0,#cbd5e1,#94a3b8)", ring: "#ffffff" },

  { id: "cap-cappuccina", name: "Ballerina Cappuccina", emoji: "\u2615", rarity: "common", set: "brainrot", bg: "linear-gradient(135deg,#f9a8d4,#ec4899)", ring: "#fce7f3" },
  { id: "cap-chimpanzini", name: "Chimpanzini Bananini", emoji: "\uD83C\uDF4C", rarity: "common", set: "brainrot", bg: "linear-gradient(135deg,#fde047,#ca8a04)", ring: "#fef9c3" },
  { id: "cap-burbaloni", name: "Burbaloni Luliloli", emoji: "\uD83E\uDD66", rarity: "common", set: "brainrot", bg: "linear-gradient(135deg,#d97706,#b45309)", ring: "#fde68a" },
  { id: "cap-frigocamelo", name: "Frigo Camelo", emoji: "\uD83D\uDC2A", rarity: "rare", set: "brainrot", bg: "linear-gradient(135deg,#38bdf8,#0284c7)", ring: "#bae6fd" },
  { id: "cap-brrbrr", name: "Brr Brr Patapim", emoji: "\uD83D\uDC43", rarity: "rare", set: "brainrot", bg: "linear-gradient(135deg,#16a34a,#14532d)", ring: "#bbf7d0" },
  { id: "cap-lirililala", name: "Lirili Larila", emoji: "\uD83D\uDC18", rarity: "rare", set: "brainrot", bg: "linear-gradient(135deg,#2dd4bf,#0d9488)", ring: "#99f6e4" },
  { id: "cap-glorbo", name: "Glorbo", emoji: "\uD83C\uDF49", rarity: "epic", set: "brainrot", bg: "linear-gradient(135deg,#84cc16,#3f6212)", ring: "#bef264" },
  { id: "cap-cappasino", name: "Cappuccino Assassino", emoji: "\uD83E\uDD77", rarity: "epic", set: "brainrot", bg: "linear-gradient(135deg,#f97316,#c2410c)", ring: "#fed7aa" },
  { id: "cap-tungtungsahur", name: "Tung Tung Sahur", emoji: "\uD83E\uDD41", rarity: "mythic", set: "brainrot", bg: "linear-gradient(135deg,#854d0e,#ca8a04,#fbbf24,#ca8a04)", ring: "#fde047" },

  { id: "cap-astropup", name: "Astro Pup", emoji: "\uD83D\uDC36", rarity: "common", set: "space", bg: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", ring: "#93c5fd" },
  { id: "cap-moonbunny", name: "Moon Bunny", emoji: "\uD83D\uDC30", rarity: "common", set: "space", bg: "linear-gradient(135deg,#312e81,#4338ca)", ring: "#c7d2fe" },
  { id: "cap-robowl", name: "Robo Owl", emoji: "\uD83E\uDD89", rarity: "rare", set: "space", bg: "linear-gradient(135deg,#1e293b,#334155)", ring: "#7dd3fc" },
  { id: "cap-zorp", name: "Zorp", emoji: "\uD83D\uDC7E", rarity: "rare", set: "space", bg: "linear-gradient(135deg,#064e3b,#065f46)", ring: "#6ee7b7" },
  { id: "cap-cometfox", name: "Comet Fox", emoji: "\uD83E\uDD8A", rarity: "rare", set: "space", bg: "linear-gradient(135deg,#7c2d12,#c2410c)", ring: "#fb923c" },
  { id: "cap-nebulacat", name: "Nebula Cat", emoji: "\uD83D\uDC31", rarity: "epic", set: "space", bg: "linear-gradient(135deg,#1e1b4b,#4c1d95,#7e22ce)", ring: "#d8b4fe" },
  { id: "cap-orbitdrake", name: "Orbit Drake", emoji: "\uD83D\uDC09", rarity: "epic", set: "space", bg: "linear-gradient(135deg,#0c4a6e,#0369a1,#0ea5e9)", ring: "#38bdf8" },
  { id: "cap-voidknight", name: "Void Knight", emoji: "\u2694\uFE0F", rarity: "mythic", set: "space", bg: "linear-gradient(135deg,#0f0c29,#1e1b4b,#4c1d95)", ring: "#a855f7" },

  { id: "cap-caroline-happy", name: "Happy", emoji: "\uD83D\uDE0A", rarity: "common", set: "caroline", bg: "linear-gradient(135deg,#8b5cf6,#7c3aed)", ring: "#ddd6fe" },
  { id: "cap-caroline-sad", name: "Sad", emoji: "\uD83D\uDE22", rarity: "common", set: "caroline", bg: "linear-gradient(135deg,#38bdf8,#2563eb)", ring: "#bfdbfe" },
  { id: "cap-caroline-silly", name: "Silly", emoji: "\uD83D\uDE1C", rarity: "common", set: "caroline", bg: "linear-gradient(135deg,#f472b6,#ec4899)", ring: "#fbcfe8" },
  { id: "cap-caroline-angry", name: "Angry", emoji: "\uD83D\uDE20", rarity: "rare", set: "caroline", bg: "linear-gradient(135deg,#fb7185,#ef4444)", ring: "#fecdd3" },
  { id: "cap-caroline-scared", name: "Scared", emoji: "\uD83D\uDE31", rarity: "rare", set: "caroline", bg: "linear-gradient(135deg,#2dd4bf,#14b8a6)", ring: "#99f6e4" },
  { id: "cap-caroline-surprised", name: "Surprised", emoji: "\uD83D\uDE2E", rarity: "rare", set: "caroline", bg: "linear-gradient(135deg,#fde047,#f59e0b)", ring: "#fef08a" },
  { id: "cap-caroline-tired", name: "Tired", emoji: "\uD83D\uDE34", rarity: "epic", set: "caroline", bg: "linear-gradient(135deg,#8b5cf6,#6d28d9,#4c1d95)", ring: "#ddd6fe" },
  { id: "cap-caroline-confused", name: "Confused", emoji: "\uD83D\uDE15", rarity: "epic", set: "caroline", bg: "linear-gradient(135deg,#60a5fa,#2563eb,#1d4ed8)", ring: "#bfdbfe" },
  { id: "cap-caroline-sassy", name: "Sassy", emoji: "\uD83D\uDC81", rarity: "mythic", set: "caroline", bg: "linear-gradient(135deg,#f472b6,#ec4899,#db2777)", ring: "#f9a8d4" },
];

export const CAP_MAP = Object.fromEntries(CAPS.map(c => [c.id, c]));

export const STARTER_CAP_ID = "cap-fox";

export const RARITY_LABEL: Record<CapRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  mythic: "Mythic",
};

export type ChestResult =
  | { type: "gold"; amount: number; label: string }
  | { type: "steal"; fromId: string; fromName: string; amount: number; label: string }
  | { type: "lose"; amount: number; label: string }
  | { type: "double"; label: string };

export type MachineChoice = "volt" | "aurum" | "ruby";

export function rollMachineChest(
  machine: MachineChoice,
  playerId: string,
  players: Array<{ id: string; display_name: string; gold: number }>,
): ChestResult {
  const others = players.filter(p => p.id !== playerId && p.gold > 0);
  const r = Math.random();

  if (machine === "aurum") {
    const amount = Math.floor(Math.random() * 21) + 25;
    return { type: "gold", amount, label: `+${amount} Gold!` };
  }

  if (machine === "volt") {
    if (r < 0.52) {
      const amount = Math.floor(Math.random() * 71) + 60;
      return { type: "gold", amount, label: `+${amount} Gold! \u26A1` };
    }
    return { type: "gold", amount: 5, label: "+5 Gold" };
  }

  if (others.length === 0) return { type: "gold", amount: 30, label: "+30 Gold!" };
  const richest = others.reduce((a, b) => (a.gold > b.gold ? a : b));
  const amount = Math.min(Math.floor(richest.gold * 0.30) + 10, 120);
  return { type: "steal", fromId: richest.id, fromName: richest.display_name, amount, label: `Robbed ${richest.display_name} for ${amount}! \u2666` };
}

const RARITY_WEIGHTS: Record<CapRarity, number> = {
  common: 65,
  rare: 25,
  epic: 8,
  mythic: 2,
};

export const CAPSULE_COST = 50;

export function rollCap(setId?: string): Cap {
  const source = setId ? CAPS.filter(c => c.set === setId) : CAPS;
  const pool: Cap[] = [];
  for (const cap of source) {
    const weight = RARITY_WEIGHTS[cap.rarity];
    for (let i = 0; i < weight; i++) pool.push(cap);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface CapsuleQuestion {
  prompt: string;
  choices: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  timeLimit: number;
}

export const DEMO_QUESTIONS: CapsuleQuestion[] = [
  {
    prompt: "What is the powerhouse of the cell?",
    choices: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
    answer: 2,
    timeLimit: 20,
  },
  {
    prompt: "Which planet is closest to the Sun?",
    choices: ["Venus", "Mercury", "Earth", "Mars"],
    answer: 1,
    timeLimit: 20,
  },
  {
    prompt: "What is 7 x 8?",
    choices: ["54", "64", "48", "56"],
    answer: 3,
    timeLimit: 15,
  },
  {
    prompt: "Who wrote Romeo and Juliet?",
    choices: ["Dickens", "Austen", "Shakespeare", "Chaucer"],
    answer: 2,
    timeLimit: 20,
  },
  {
    prompt: "What year did World War II end?",
    choices: ["1944", "1946", "1943", "1945"],
    answer: 3,
    timeLimit: 20,
  },
  {
    prompt: "What is the chemical symbol for gold?",
    choices: ["Au", "Ag", "Fe", "Cu"],
    answer: 0,
    timeLimit: 20,
  },
  {
    prompt: "Which ocean is the largest?",
    choices: ["Atlantic", "Pacific", "Indian", "Arctic"],
    answer: 1,
    timeLimit: 20,
  },
  {
    prompt: "What is the square root of 144?",
    choices: ["14", "11", "12", "13"],
    answer: 2,
    timeLimit: 15,
  },
  {
    prompt: "How many sides does a hexagon have?",
    choices: ["5", "7", "8", "6"],
    answer: 3,
    timeLimit: 15,
  },
  {
    prompt: "What gas do plants absorb from the air during photosynthesis?",
    choices: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
    answer: 1,
    timeLimit: 20,
  },
];
