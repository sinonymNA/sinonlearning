export type VaultQuestion = {
  id: string;
  subject: string;
  concept: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
  misconception: string;
  repairPrompt: string;
  repairChoices: [string, string];
  repairAnswer: number;
};

export type VaultArtifact = {
  id: string;
  name: string;
  lore: string;
  rarity: "Unusual" | "Rare" | "Mythic";
  glyph: string;
};

export const VAULT_QUESTIONS: VaultQuestion[] = [
  {
    id: "history-1", subject: "World History", concept: "Indian Ocean trade",
    prompt: "Which development most directly expanded Indian Ocean commerce from 1200 to 1450?",
    choices: ["The spread of maritime technologies", "The collapse of all coastal states", "The end of monsoon winds", "The disappearance of merchant diasporas"],
    answer: 0,
    explanation: "Improved ship designs, navigational tools, and knowledge of monsoon patterns made long-distance maritime exchange more reliable.",
    misconception: "You may be treating trade growth as the result of isolation rather than better connections.",
    repairPrompt: "Which change would make ocean travel more reliable?",
    repairChoices: ["Better navigation", "Fewer ports"], repairAnswer: 0,
  },
  {
    id: "history-2", subject: "World History", concept: "Mali",
    prompt: "Which evidence best supports the claim that Mali was integrated into wider commercial networks?",
    choices: ["Mansa Musa’s pilgrimage through Cairo", "Mali’s complete rejection of Islam", "The absence of gold in West Africa", "A ban on trans-Saharan travel"],
    answer: 0,
    explanation: "Mansa Musa’s pilgrimage displayed Mali’s wealth and its connections to Islamic and trans-Saharan networks.",
    misconception: "You may recognize facts about Mali without connecting them to the claim about networks.",
    repairPrompt: "A ruler traveling through major trade cities is strongest evidence of…",
    repairChoices: ["connection", "isolation"], repairAnswer: 0,
  },
  {
    id: "history-3", subject: "World History", concept: "Industrialization",
    prompt: "Why did industrialization begin in Great Britain before most other regions?",
    choices: ["Access to coal, capital, labor, and markets", "A total absence of overseas trade", "A prohibition on mechanical invention", "A primarily nomadic population"],
    answer: 0,
    explanation: "Britain combined accessible coal, investment capital, labor, infrastructure, and imperial markets.",
    misconception: "Industrialization had several reinforcing causes; it was not produced by a single invention alone.",
    repairPrompt: "Which is more likely to support early factories?",
    repairChoices: ["Coal and investment", "No energy source"], repairAnswer: 0,
  },
  {
    id: "biology-1", subject: "Biology", concept: "Cellular respiration",
    prompt: "Which organelle produces most of a eukaryotic cell’s ATP?",
    choices: ["Mitochondrion", "Nucleus", "Golgi apparatus", "Lysosome"], answer: 0,
    explanation: "Mitochondria carry out the stages of cellular respiration that generate most ATP.",
    misconception: "The nucleus controls genetic information, but it is not the cell’s main ATP producer.",
    repairPrompt: "ATP is most directly associated with…",
    repairChoices: ["usable cellular energy", "stored genetic instructions"], repairAnswer: 0,
  },
  {
    id: "biology-2", subject: "Biology", concept: "Natural selection",
    prompt: "Natural selection acts most directly on which feature of a population?",
    choices: ["Heritable variation", "Traits acquired through effort", "Identical genotypes", "Needs consciously chosen by organisms"], answer: 0,
    explanation: "Selection changes populations when heritable variations affect survival or reproduction.",
    misconception: "Individuals do not evolve because they need to; selection acts on existing heritable variation.",
    repairPrompt: "For selection to affect future generations, a useful trait must be…",
    repairChoices: ["heritable", "temporary"], repairAnswer: 0,
  },
  {
    id: "biology-3", subject: "Biology", concept: "Ecology",
    prompt: "If a top predator is removed, what is the most likely immediate effect?",
    choices: ["Its prey population increases", "All producers disappear instantly", "Energy stops entering the ecosystem", "Every species remains unchanged"], answer: 0,
    explanation: "Removing predation pressure commonly allows prey populations to rise, which can trigger a trophic cascade.",
    misconception: "Food-web changes spread through relationships; they rarely leave every population unchanged.",
    repairPrompt: "Less predation usually means prey initially…",
    repairChoices: ["increase", "decrease"], repairAnswer: 0,
  },
  {
    id: "algebra-1", subject: "Algebra", concept: "Linear equations",
    prompt: "What is the solution to 3x + 6 = 21?",
    choices: ["x = 5", "x = 7", "x = 9", "x = 3"], answer: 0,
    explanation: "Subtract 6 from both sides to get 3x = 15, then divide by 3.",
    misconception: "Keep the equation balanced: undo addition before undoing multiplication.",
    repairPrompt: "What is the first operation used to undo +6?",
    repairChoices: ["Subtract 6", "Divide by 6"], repairAnswer: 0,
  },
  {
    id: "algebra-2", subject: "Algebra", concept: "Slope",
    prompt: "A line rises 8 units while running 4 units right. What is its slope?",
    choices: ["2", "1/2", "4", "12"], answer: 0,
    explanation: "Slope is rise divided by run: 8 ÷ 4 = 2.",
    misconception: "Slope is rise over run, not run over rise and not their sum.",
    repairPrompt: "Slope is calculated as…",
    repairChoices: ["rise ÷ run", "rise + run"], repairAnswer: 0,
  },
  {
    id: "algebra-3", subject: "Algebra", concept: "Functions",
    prompt: "If f(x) = 2x², what is f(3)?",
    choices: ["18", "12", "36", "6"], answer: 0,
    explanation: "Substitute 3 for x: 2(3²) = 2(9) = 18.",
    misconception: "Apply the exponent before multiplying by the coefficient.",
    repairPrompt: "In 2(3²), which happens first?",
    repairChoices: ["Square 3", "Multiply 2 × 3"], repairAnswer: 0,
  },
];

export const VAULT_ARTIFACTS: VaultArtifact[] = [
  { id: "star-key", name: "Star-forged Key", lore: "Warm to the touch. It points toward doors that do not exist yet.", rarity: "Rare", glyph: "✦" },
  { id: "echo-lens", name: "Echo Lens", lore: "Look through it and every wrong path leaves a faint afterimage.", rarity: "Unusual", glyph: "◉" },
  { id: "moth-crown", name: "Crown of Moths", lore: "Its tiny subjects gather wherever knowledge has been forgotten.", rarity: "Mythic", glyph: "♛" },
  { id: "glass-compass", name: "Glass Compass", lore: "The needle points toward whatever its holder almost remembers.", rarity: "Rare", glyph: "⌖" },
  { id: "ember-seed", name: "Ember Seed", lore: "A small mechanical seed dreaming of a forest beneath the stone.", rarity: "Unusual", glyph: "◆" },
  { id: "moon-coin", name: "Moon Coin", lore: "Spend it twice and it returns with a different face.", rarity: "Unusual", glyph: "◐" },
];
