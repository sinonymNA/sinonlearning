import type { LearningLabQuestion } from "./marginsLearningLab";

const REQUIRED = ["question", "choices", "correct_answer", "point_value", "standard", "skill", "explanation"];

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

export function parseLearningLabCsv(csv: string): { questions: LearningLabQuestion[]; errors: string[] } {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { questions: [], errors: ["Add a header row and at least one question."] };
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().trim());
  const missing = REQUIRED.filter((header) => !headers.includes(header));
  if (missing.length) return { questions: [], errors: [`Missing columns: ${missing.join(", ")}.`] };

  const questions: LearningLabQuestion[] = [];
  const errors: string[] = [];
  for (let index = 1; index < lines.length; index++) {
    const cells = parseCsvLine(lines[index]);
    const row = Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ""]));
    const choices = (row.choices ?? "").split("|").map((choice) => choice.trim()).filter(Boolean);
    const pointValue = Number(row.point_value);
    if (!row.question || choices.length < 2 || !row.correct_answer || !Number.isFinite(pointValue) || pointValue <= 0 || !row.skill) {
      errors.push(`Row ${index + 1}: required question fields are missing.`);
      continue;
    }
    if (!choices.includes(row.correct_answer)) {
      errors.push(`Row ${index + 1}: correct_answer must match one of the choices.`);
      continue;
    }
    questions.push({
      id: row.id || `imported-${index}`,
      questionText: row.question,
      choices,
      correctAnswer: row.correct_answer,
      pointValue,
      standard: row.standard || null,
      skill: row.skill,
      explanation: row.explanation,
      distractorExplanations: {},
      prerequisiteSkills: (row.prerequisite_skills ?? "").split("|").map((item) => item.trim()).filter(Boolean),
      materialRefs: (row.material_refs ?? "").split("|").map((item) => item.trim()).filter(Boolean),
      freshPractice: row.fresh_question && row.fresh_choices && row.fresh_correct_answer ? {
        questionText: row.fresh_question,
        choices: row.fresh_choices.split("|").map((choice) => choice.trim()).filter(Boolean),
        correctAnswer: row.fresh_correct_answer,
      } : undefined,
    });
  }
  return { questions, errors };
}
