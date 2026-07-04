export type EssayType = "DBQ" | "LEQ" | "SAQ";

export interface RubricCriterion {
  category: string;
  points_possible: number;
  description: string;
}

// Based on the College Board's published AP World History: Modern scoring
// guidelines (rubric categories and point values are stable across exam years;
// exact per-prompt wording varies, so descriptions here are the general,
// editable criteria — not a specific year's exam-question text).
export const RUBRIC_TEMPLATES: Record<EssayType, RubricCriterion[]> = {
  DBQ: [
    {
      category: "Thesis/Claim",
      points_possible: 1,
      description:
        "Responds to the prompt with a historically defensible thesis that establishes a line of reasoning, located in one place (intro or conclusion).",
    },
    {
      category: "Contextualization",
      points_possible: 1,
      description:
        "Describes a broader historical context relevant to the prompt — events, developments, or processes before, during, or after the prompt's timeframe. More than a phrase or reference.",
    },
    {
      category: "Evidence",
      points_possible: 3,
      description:
        "Uses the content of at least three documents to address the topic; uses content from at least six documents to support an argument; and uses at least one piece of specific historical evidence beyond the documents.",
    },
    {
      category: "Analysis and Reasoning",
      points_possible: 2,
      description:
        "Explains how or why the point of view, purpose, historical situation, or audience of at least three documents is relevant to the argument; and demonstrates a complex understanding of the historical development through sophisticated argumentation.",
    },
  ],
  LEQ: [
    {
      category: "Thesis/Claim",
      points_possible: 1,
      description:
        "Responds to the prompt with a historically defensible thesis that establishes a line of reasoning, located in one place (intro or conclusion).",
    },
    {
      category: "Contextualization",
      points_possible: 1,
      description:
        "Describes a broader historical context relevant to the prompt — events, developments, or processes before, during, or after the prompt's timeframe. More than a phrase or reference.",
    },
    {
      category: "Evidence",
      points_possible: 2,
      description:
        "Provides at least two specific, relevant historical examples; and supports an argument in response to the prompt using at least two pieces of specific and relevant evidence.",
    },
    {
      category: "Analysis and Reasoning",
      points_possible: 2,
      description:
        "Uses historical reasoning (comparison, causation, or continuity/change) to structure an argument; and demonstrates a complex understanding through sophisticated argumentation.",
    },
  ],
  SAQ: [
    {
      category: "Part A",
      points_possible: 1,
      description: "Fully and accurately addresses what Part A of the prompt asks for.",
    },
    {
      category: "Part B",
      points_possible: 1,
      description: "Fully and accurately addresses what Part B of the prompt asks for.",
    },
    {
      category: "Part C",
      points_possible: 1,
      description: "Fully and accurately addresses what Part C of the prompt asks for.",
    },
  ],
};

export function maxScoreFor(essayType: EssayType): number {
  return RUBRIC_TEMPLATES[essayType].reduce((sum, c) => sum + c.points_possible, 0);
}
