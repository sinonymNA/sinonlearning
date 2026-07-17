import Phaser from "phaser";

export interface AdaptiveQuestion {
  skill: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
}

const DEMO_BANK: AdaptiveQuestion[] = [
  // ── Economics (10) ─────────────────────────────────────────────────────────
  {
    skill: "Economics", answer: 0,
    prompt: "What best describes inflation?",
    choices: ["A broad rise in average prices", "A fall in all wages", "An increase in exports only", "A stronger currency"],
    explanation: "Inflation is a sustained rise in the overall price level.",
  },
  {
    skill: "Economics", answer: 2,
    prompt: "GDP measures the value of…",
    choices: ["all stock trades", "government debt only", "final goods and services produced", "imports only"],
    explanation: "GDP totals final production inside an economy.",
  },
  {
    skill: "Economics", answer: 1,
    prompt: "Diversification mainly reduces…",
    choices: ["all market risk", "company-specific risk", "inflation", "tax rates"],
    explanation: "Holding varied assets reduces company-specific (unsystematic) risk.",
  },
  {
    skill: "Economics", answer: 0,
    prompt: "If demand rises but supply stays the same, what usually happens to price?",
    choices: ["It rises", "It falls", "It stays the same", "It becomes unpredictable"],
    explanation: "Higher demand chasing the same supply bids prices up.",
  },
  {
    skill: "Economics", answer: 3,
    prompt: "A budget surplus occurs when government…",
    choices: ["spends more than it collects", "borrows heavily from banks", "lowers all tax rates", "collects more revenue than it spends"],
    explanation: "A surplus means revenues exceed expenditures.",
  },
  {
    skill: "Economics", answer: 1,
    prompt: "Which best defines opportunity cost?",
    choices: ["The price tag on a product", "The value of the next-best alternative given up", "The cost of raw materials only", "Total production expenses"],
    explanation: "Opportunity cost is what you sacrifice by choosing one option over the next best.",
  },
  {
    skill: "Economics", answer: 2,
    prompt: "A tariff is best described as…",
    choices: ["a trade agreement", "a type of currency exchange", "a tax on imported goods", "a government subsidy for exports"],
    explanation: "Tariffs are taxes placed on imported goods to raise their price.",
  },
  {
    skill: "Economics", answer: 0,
    prompt: "Which factor most directly causes the value of currency to fall?",
    choices: ["High inflation in that country", "Rising foreign investment", "Lower government spending", "Stronger exports"],
    explanation: "High inflation erodes purchasing power, reducing the currency's value.",
  },
  {
    skill: "Economics", answer: 3,
    prompt: "In a free market, prices are mainly set by…",
    choices: ["government agencies", "international banks", "labor unions", "supply and demand"],
    explanation: "Prices in free markets emerge from the interaction of buyers and sellers.",
  },
  {
    skill: "Economics", answer: 1,
    prompt: "Which of these is an example of a fixed cost for a factory?",
    choices: ["Cost of raw materials per unit", "Monthly rent on the factory building", "Wages paid per item produced", "Shipping charges per order"],
    explanation: "Rent stays the same regardless of how many units are produced — that's a fixed cost.",
  },

  // ── History (10) ────────────────────────────────────────────────────────────
  {
    skill: "History", answer: 0,
    prompt: "Which development most accelerated Indian Ocean trade after 1200?",
    choices: ["Improved maritime technology", "The end of monsoon winds", "The disappearance of cities", "A ban on credit"],
    explanation: "Better ships and navigation expanded long-distance maritime trade.",
  },
  {
    skill: "History", answer: 2,
    prompt: "The Columbian Exchange connected which hemispheres?",
    choices: ["Northern and Southern only", "Arctic and Antarctic", "Eastern and Western", "Urban and rural"],
    explanation: "It transferred organisms between the Eastern and Western Hemispheres.",
  },
  {
    skill: "History", answer: 0,
    prompt: "A primary source is created…",
    choices: ["during the period being studied", "only by a professional historian", "after all events end", "without a point of view"],
    explanation: "Primary sources originate in the historical period under study.",
  },
  {
    skill: "History", answer: 1,
    prompt: "The Industrial Revolution began in which country?",
    choices: ["France", "Great Britain", "Germany", "United States"],
    explanation: "Britain's coal, iron, and river systems made it the cradle of industrialization.",
  },
  {
    skill: "History", answer: 3,
    prompt: "Which empire controlled the largest land area in history?",
    choices: ["Roman Empire", "Ottoman Empire", "British Empire", "Mongol Empire"],
    explanation: "At its peak the Mongol Empire covered about 24 million km².",
  },
  {
    skill: "History", answer: 2,
    prompt: "The Renaissance is best described as…",
    choices: ["a military campaign across Europe", "a religious reform movement", "a cultural rebirth centered on art and learning", "an economic revolution driven by trade"],
    explanation: "The Renaissance was a revival of classical learning, art, and humanist ideas.",
  },
  {
    skill: "History", answer: 0,
    prompt: "World War I was triggered most directly by…",
    choices: ["The assassination of Archduke Franz Ferdinand", "Germany's invasion of Poland", "The sinking of the Lusitania", "Russia's revolution"],
    explanation: "The assassination of Franz Ferdinand in 1914 set off a chain of treaty obligations that escalated into WWI.",
  },
  {
    skill: "History", answer: 1,
    prompt: "The Silk Road primarily connected…",
    choices: ["Africa and South America", "East Asia and the Mediterranean world", "North America and Europe", "Australia and Southeast Asia"],
    explanation: "The Silk Road was a network of routes linking China to the Mediterranean.",
  },
  {
    skill: "History", answer: 3,
    prompt: "Which document first limited the English monarch's power in writing?",
    choices: ["The Declaration of Independence", "The Bill of Rights", "The Edict of Nantes", "Magna Carta"],
    explanation: "Magna Carta (1215) was the first written limit on royal authority in England.",
  },
  {
    skill: "History", answer: 2,
    prompt: "The Cold War was mainly a conflict between…",
    choices: ["China and Japan", "Britain and France", "the USA and the Soviet Union", "Germany and Italy"],
    explanation: "The Cold War was a decades-long ideological and geopolitical rivalry between the US and USSR.",
  },

  // ── Science (10) ────────────────────────────────────────────────────────────
  {
    skill: "Science", answer: 0,
    prompt: "Which organelle releases usable energy from food?",
    choices: ["Mitochondrion", "Ribosome", "Cell wall", "Nucleus"],
    explanation: "Mitochondria carry out cellular respiration to produce ATP.",
  },
  {
    skill: "Science", answer: 2,
    prompt: "An independent variable is the factor a scientist…",
    choices: ["measures as the result", "keeps constant throughout", "changes on purpose", "removes from the graph"],
    explanation: "The independent variable is deliberately manipulated by the experimenter.",
  },
  {
    skill: "Science", answer: 0,
    prompt: "Which force pulls objects toward Earth?",
    choices: ["Gravity", "Friction", "Magnetism", "Buoyancy"],
    explanation: "Gravity attracts masses toward one another.",
  },
  {
    skill: "Science", answer: 1,
    prompt: "What is the chemical formula for water?",
    choices: ["CO₂", "H₂O", "O₂", "NaCl"],
    explanation: "Water is two hydrogen atoms bonded to one oxygen atom.",
  },
  {
    skill: "Science", answer: 3,
    prompt: "Which layer of the atmosphere contains most weather?",
    choices: ["Mesosphere", "Stratosphere", "Thermosphere", "Troposphere"],
    explanation: "The troposphere, the lowest layer, is where nearly all weather occurs.",
  },
  {
    skill: "Science", answer: 2,
    prompt: "In Newton's first law, an object at rest stays at rest unless…",
    choices: ["it is very heavy", "gravity increases", "a net external force acts on it", "the temperature rises"],
    explanation: "Inertia keeps objects in their current state until an unbalanced force intervenes.",
  },
  {
    skill: "Science", answer: 0,
    prompt: "Photosynthesis converts sunlight into…",
    choices: ["chemical energy stored in glucose", "electrical energy", "kinetic energy", "thermal energy"],
    explanation: "Plants use light energy to convert CO₂ and water into glucose and oxygen.",
  },
  {
    skill: "Science", answer: 1,
    prompt: "Which type of rock forms from cooled magma?",
    choices: ["Sedimentary", "Igneous", "Metamorphic", "Fossil"],
    explanation: "Igneous rocks solidify from molten material (magma or lava).",
  },
  {
    skill: "Science", answer: 3,
    prompt: "DNA is found mainly in which part of a cell?",
    choices: ["Cell membrane", "Cytoplasm", "Ribosome", "Nucleus"],
    explanation: "The nucleus houses the chromosomes — the cell's DNA library.",
  },
  {
    skill: "Science", answer: 2,
    prompt: "Which gas makes up the largest share of Earth's atmosphere?",
    choices: ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"],
    explanation: "Nitrogen makes up about 78% of our atmosphere.",
  },

  // ── Math (10) ───────────────────────────────────────────────────────────────
  {
    skill: "Math", answer: 0,
    prompt: "What is 25% of 80?",
    choices: ["20", "15", "25", "40"],
    explanation: "One quarter of 80 is 20.",
  },
  {
    skill: "Math", answer: 2,
    prompt: "A line with slope 0 is…",
    choices: ["vertical", "undefined everywhere", "horizontal", "curved"],
    explanation: "A horizontal line has no vertical change, so its slope is 0.",
  },
  {
    skill: "Math", answer: 1,
    prompt: "Which value solves 3x = 18?",
    choices: ["3", "6", "9", "15"],
    explanation: "Divide both sides by 3 to get x = 6.",
  },
  {
    skill: "Math", answer: 3,
    prompt: "What is the area of a rectangle 7 units wide and 4 units tall?",
    choices: ["11", "22", "14", "28"],
    explanation: "Area = width × height = 7 × 4 = 28.",
  },
  {
    skill: "Math", answer: 0,
    prompt: "Which of these is a prime number?",
    choices: ["13", "9", "15", "21"],
    explanation: "13 is divisible only by 1 and itself — the definition of prime.",
  },
  {
    skill: "Math", answer: 2,
    prompt: "What is the value of 2³?",
    choices: ["6", "5", "8", "16"],
    explanation: "2³ = 2 × 2 × 2 = 8.",
  },
  {
    skill: "Math", answer: 1,
    prompt: "The median of {3, 7, 9, 2, 5} is…",
    choices: ["9", "5", "3", "7"],
    explanation: "Sort the set: 2, 3, 5, 7, 9. The middle value is 5.",
  },
  {
    skill: "Math", answer: 3,
    prompt: "Which expression equals 48 ÷ 6?",
    choices: ["6", "7", "9", "8"],
    explanation: "48 divided by 6 equals 8.",
  },
  {
    skill: "Math", answer: 0,
    prompt: "A triangle has angles of 60° and 80°. What is the third angle?",
    choices: ["40°", "60°", "100°", "120°"],
    explanation: "Angles in a triangle sum to 180°; 180 − 60 − 80 = 40°.",
  },
  {
    skill: "Math", answer: 2,
    prompt: "Which number is closest to the square root of 50?",
    choices: ["6", "8", "7", "5"],
    explanation: "7² = 49, so √50 ≈ 7.07 — closest to 7.",
  },

  // ── Language (10) ───────────────────────────────────────────────────────────
  {
    skill: "Language", answer: 0,
    prompt: "Which sentence uses the strongest evidence?",
    choices: ["The data show a 30% increase.", "I just feel it is true.", "Everyone knows this.", "It is obviously correct."],
    explanation: "Specific, measurable evidence makes a claim stronger.",
  },
  {
    skill: "Language", answer: 3,
    prompt: "A claim should be supported by…",
    choices: ["a louder voice", "an unrelated example", "repetition alone", "relevant evidence and reasoning"],
    explanation: "Evidence plus reasoning connects facts to the claim.",
  },
  {
    skill: "Language", answer: 1,
    prompt: "Which sentence is in the passive voice?",
    choices: ["The dog chased the cat.", "The ball was kicked by the player.", "She wrote the report.", "He answered every question."],
    explanation: "Passive voice places the receiver of the action as the subject: 'The ball was kicked.'",
  },
  {
    skill: "Language", answer: 2,
    prompt: "What does a thesis statement do?",
    choices: ["Lists all sources used", "Summarizes the conclusion only", "States the main argument of an essay", "Introduces background facts"],
    explanation: "A thesis expresses the central claim the essay will defend.",
  },
  {
    skill: "Language", answer: 0,
    prompt: "An inference is best described as…",
    choices: ["A conclusion drawn from evidence and reasoning", "A direct quote from the text", "A summary of every paragraph", "An opinion with no support"],
    explanation: "Inferring means using clues and logic to reach a conclusion not directly stated.",
  },
  {
    skill: "Language", answer: 3,
    prompt: "Which transition word shows contrast?",
    choices: ["Furthermore", "Similarly", "In addition", "However"],
    explanation: "'However' signals that the next idea contrasts with the previous one.",
  },
  {
    skill: "Language", answer: 1,
    prompt: "A synonym is a word that…",
    choices: ["means the opposite of another word", "has the same or similar meaning as another word", "sounds the same but is spelled differently", "refers only to nouns"],
    explanation: "Synonyms share the same or nearly the same meaning — 'happy' and 'joyful' are synonyms.",
  },
  {
    skill: "Language", answer: 2,
    prompt: "Which sentence contains a simile?",
    choices: ["The stars are diamonds in the sky.", "Night fell over the city.", "Her laugh was like music to his ears.", "He moved silently through the crowd."],
    explanation: "A simile makes a comparison using 'like' or 'as'; option C uses 'like.'",
  },
  {
    skill: "Language", answer: 0,
    prompt: "Which of the following is a compound sentence?",
    choices: ["She studied hard, so she passed the test.", "After she studied, she slept.", "She studied hard.", "Studying always helps."],
    explanation: "A compound sentence joins two independent clauses — 'She studied hard' + 'she passed the test' joined by 'so.'",
  },
  {
    skill: "Language", answer: 3,
    prompt: "The tone of a piece of writing refers to…",
    choices: ["the speed at which it should be read", "the topic of the first paragraph", "the number of adjectives used", "the author's attitude toward the subject"],
    explanation: "Tone conveys how the author feels about the material — formal, humorous, somber, etc.",
  },
];

export function getAdaptiveQuestion(mastery: Record<string, number>): AdaptiveQuestion {
  const skills = [...new Set(DEMO_BANK.map((question) => question.skill))];
  const weakest = skills.slice().sort((a, b) => (mastery[a] ?? 0) - (mastery[b] ?? 0)).slice(0, 2);
  const pool = DEMO_BANK.filter((question) => weakest.includes(question.skill));
  const source = Phaser.Utils.Array.GetRandom(pool) as AdaptiveQuestion;
  const indexed = source.choices.map((choice, index) => ({ choice, correct: index === source.answer }));
  Phaser.Utils.Array.Shuffle(indexed);
  return {
    ...source,
    choices: indexed.map((item) => item.choice),
    answer: indexed.findIndex((item) => item.correct),
  };
}

export function recordMastery(mastery: Record<string, number>, skill: string, correct: boolean) {
  mastery[skill] = Phaser.Math.Clamp((mastery[skill] ?? 0) + (correct ? 2 : -1), -3, 10);
}
