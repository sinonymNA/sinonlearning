import type { GameShowType } from "./gameShowTypes";

const SCHEMA_BY_TYPE: Record<GameShowType, string> = {
  grid: `{
  "categories": [
    {
      "name": "string, short category title",
      "clues": [
        { "value": 100, "question": "string, shown to the class first", "answer": "string, revealed after a guess" }
      ]
    }
  ]
}
Aim for 5 categories with 5 clues each, values increasing like 100/200/300/400/500 per category.`,
  wheel: `{
  "rounds": [
    { "category": "string, short label shown above the puzzle", "phrase": "string, the hidden word or phrase, ALL CAPS", "hint": "string, optional teacher-only hint" }
  ]
}
Aim for 6-8 rounds, phrases between 2 and 5 words.`,
  feud: `{
  "rounds": [
    {
      "prompt": "string, a 'Name something...' style prompt",
      "answers": [ { "text": "string", "points": 40 } ]
    }
  ]
}
Aim for 5-6 rounds, 4-6 ranked answers per round with points descending (e.g. 40, 30, 20, 10).`,
  race: `{
  "questions": [
    { "question": "string", "choices": ["string", "string", "string", "string"], "correctIndex": 0, "points": 100 }
  ]
}
Aim for 10-15 multiple-choice questions, exactly 4 choices each.`,
  memory: `{
  "pairs": [
    { "term": "string, short", "definition": "string, short" }
  ]
}
Aim for 8-10 term/definition pairs.`,
};

const LABEL_BY_TYPE: Record<GameShowType, string> = {
  grid: "a Jeopardy-style trivia grid game",
  wheel: "a Wheel-of-Fortune-style phrase guessing game",
  feud: "a Family-Feud-style ranked answers game",
  race: "a fast-paced multiple-choice trivia race",
  memory: "a memory-match game pairing terms with definitions",
};

export function buildGenerationPrompt(type: GameShowType, rawContent: string): string {
  return `You are helping a teacher turn their own classroom content into ${LABEL_BY_TYPE[type]} for Sinon Learning, a website for teachers.

Here is the teacher's raw content (notes, vocab list, standards, or study guide):
"""
${rawContent}
"""

Convert this content into game content that strictly matches this JSON shape (no extra fields, no commentary):
${SCHEMA_BY_TYPE[type]}

Respond with ONLY the JSON object, no markdown code fences, no explanation.`;
}
