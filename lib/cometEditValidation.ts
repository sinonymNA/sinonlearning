import {
  createSlide,
  createWorksheetQuestion,
  createWorksheetSection,
} from "./studioDefaults";
import type {
  SlideLayout,
  SlideType,
  StudioSlide,
  TeacherGuide,
  WorksheetDifficulty,
  WorksheetQuestion,
  WorksheetQuestionType,
  WorksheetSection,
  ReadingLevel,
} from "./studioTypes";

const MAX_SLIDES = 40;
const MAX_SECTIONS = 20;
const MAX_QUESTIONS_PER_SECTION = 20;

const SLIDE_TYPES: SlideType[] = ["title", "content", "image", "activity", "discussion", "summary"];
const SLIDE_LAYOUTS: SlideLayout[] = ["titleOnly", "titleBody", "titleBullets", "twoColumn", "imageFocus"];
const QUESTION_TYPES: WorksheetQuestionType[] = [
  "shortAnswer",
  "multipleChoice",
  "trueFalse",
  "vocabulary",
  "constructedResponse",
];
const DIFFICULTIES: WorksheetDifficulty[] = ["easy", "medium", "hard"];
const READING_LEVELS: ReadingLevel[] = ["below", "onLevel", "above"];

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function oneOf<T extends string>(value: unknown, options: T[], fallback: T): T {
  return typeof value === "string" && (options as string[]).includes(value) ? (value as T) : fallback;
}

export interface CometEditOutcome {
  summary: string;
  slides: StudioSlide[];
  worksheetSections: WorksheetSection[];
  teacherGuide: TeacherGuide;
}

function sanitizeSlide(raw: unknown): StudioSlide | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = str(r.title).trim();
  if (!title) return null;
  return createSlide({
    type: oneOf(r.type, SLIDE_TYPES, "content"),
    title,
    subtitle: typeof r.subtitle === "string" ? r.subtitle : undefined,
    body: typeof r.body === "string" ? r.body : undefined,
    bullets: strArray(r.bullets)
      .slice(0, 20)
      .map((text) => ({ id: crypto.randomUUID(), text })),
    teacherNotes: str(r.teacherNotes),
    studentInstructions: str(r.studentInstructions),
    layout: oneOf(r.layout, SLIDE_LAYOUTS, "titleBullets"),
    timingMinutes: num(r.timingMinutes, undefined),
    tags: strArray(r.tags).slice(0, 10),
  });
}

function sanitizeQuestion(raw: unknown): WorksheetQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const prompt = str(r.prompt).trim();
  if (!prompt) return null;
  return createWorksheetQuestion({
    prompt,
    type: oneOf(r.type, QUESTION_TYPES, "shortAnswer"),
    choices: Array.isArray(r.choices) ? strArray(r.choices).slice(0, 8) : undefined,
    correctAnswer: typeof r.correctAnswer === "string" ? r.correctAnswer : undefined,
    points: num(r.points, undefined),
  });
}

function sanitizeSection(raw: unknown): WorksheetSection | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = str(r.title).trim();
  if (!title) return null;
  const questions = Array.isArray(r.questions)
    ? r.questions
        .slice(0, MAX_QUESTIONS_PER_SECTION)
        .map(sanitizeQuestion)
        .filter((q): q is WorksheetQuestion => q !== null)
    : [];
  return createWorksheetSection({
    title,
    directions: str(r.directions),
    questions,
    responseSpaceLines: num(r.responseSpaceLines, 3) ?? 3,
    difficulty: oneOf(r.difficulty, DIFFICULTIES, "medium"),
    readingLevel: oneOf(r.readingLevel, READING_LEVELS, "onLevel"),
  });
}

function sanitizeTeacherGuide(raw: unknown): TeacherGuide {
  if (!raw || typeof raw !== "object") {
    return { overview: "", objectives: [], materials: [], timingNotes: "" };
  }
  const r = raw as Record<string, unknown>;
  return {
    overview: str(r.overview),
    objectives: strArray(r.objectives).slice(0, 12),
    materials: strArray(r.materials).slice(0, 12),
    timingNotes: str(r.timingNotes),
  };
}

export function sanitizeCometEdit(raw: unknown): CometEditOutcome | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  if (!Array.isArray(r.slides) || !Array.isArray(r.worksheetSections)) return null;

  const slides = r.slides
    .slice(0, MAX_SLIDES)
    .map(sanitizeSlide)
    .filter((s): s is StudioSlide => s !== null);

  const worksheetSections = r.worksheetSections
    .slice(0, MAX_SECTIONS)
    .map(sanitizeSection)
    .filter((s): s is WorksheetSection => s !== null);

  if (slides.length === 0 && worksheetSections.length === 0) return null;

  return {
    summary: str(r.summary, "Comet made some changes.").slice(0, 300) || "Comet made some changes.",
    slides,
    worksheetSections,
    teacherGuide: sanitizeTeacherGuide(r.teacherGuide),
  };
}
