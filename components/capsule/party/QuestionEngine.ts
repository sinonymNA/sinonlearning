import Phaser from "phaser";

export interface AdaptiveQuestion {
  skill: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
}

const DEMO_BANK: AdaptiveQuestion[] = [
  { skill: "Economics", prompt: "What best describes inflation?", choices: ["A broad rise in average prices", "A fall in all wages", "An increase in exports only", "A stronger currency"], answer: 0, explanation: "Inflation is a sustained rise in the overall price level." },
  { skill: "Economics", prompt: "GDP measures the value of...", choices: ["final goods and services produced", "all stock trades", "government debt only", "imports only"], answer: 0, explanation: "GDP totals final production inside an economy." },
  { skill: "Economics", prompt: "Diversification mainly reduces...", choices: ["company-specific risk", "all market risk", "inflation", "tax rates"], answer: 0, explanation: "Holding varied assets reduces company-specific risk." },
  { skill: "History", prompt: "Which development most accelerated Indian Ocean trade after 1200?", choices: ["Improved maritime technology", "The end of monsoon winds", "The disappearance of cities", "A ban on credit"], answer: 0, explanation: "Better ships and navigation expanded long-distance maritime trade." },
  { skill: "History", prompt: "The Columbian Exchange connected which hemispheres?", choices: ["Eastern and Western", "Northern and Southern only", "Arctic and Antarctic", "Urban and rural"], answer: 0, explanation: "It transferred organisms between the Eastern and Western Hemispheres." },
  { skill: "History", prompt: "A primary source is created...", choices: ["during the period being studied", "only by a historian", "after all events end", "without a point of view"], answer: 0, explanation: "Primary sources originate in the historical period under study." },
  { skill: "Science", prompt: "Which organelle releases usable energy from food?", choices: ["Mitochondrion", "Ribosome", "Cell wall", "Nucleus"], answer: 0, explanation: "Mitochondria carry out cellular respiration." },
  { skill: "Science", prompt: "An independent variable is the factor a scientist...", choices: ["changes", "measures as the result", "keeps secret", "removes from the graph"], answer: 0, explanation: "The independent variable is deliberately changed." },
  { skill: "Science", prompt: "Which force pulls objects toward Earth?", choices: ["Gravity", "Friction", "Magnetism", "Buoyancy"], answer: 0, explanation: "Gravity attracts masses toward one another." },
  { skill: "Math", prompt: "What is 25% of 80?", choices: ["20", "15", "25", "40"], answer: 0, explanation: "One quarter of 80 is 20." },
  { skill: "Math", prompt: "A line with slope 0 is...", choices: ["horizontal", "vertical", "curved", "undefined everywhere"], answer: 0, explanation: "A horizontal line has no vertical change." },
  { skill: "Math", prompt: "Which value solves 3x = 18?", choices: ["6", "3", "9", "15"], answer: 0, explanation: "Divide both sides by 3 to get x = 6." },
  { skill: "Language", prompt: "Which sentence uses the strongest evidence?", choices: ["The data show a 30% increase.", "I just feel it is true.", "Everyone knows this.", "It is obviously correct."], answer: 0, explanation: "Specific, measurable evidence makes a claim stronger." },
  { skill: "Language", prompt: "A claim should be supported by...", choices: ["relevant evidence and reasoning", "a louder voice", "an unrelated example", "repetition alone"], answer: 0, explanation: "Evidence plus reasoning connects facts to the claim." },
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

