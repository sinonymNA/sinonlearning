// Registry + shared types for Scout's practice courses — same idea as
// RUBRIC_TEMPLATES / REEL_TEMPLATES: hand-authored content, not AI-generated,
// so tone stays controlled and there's no extra live KORA call just to fetch
// a prompt. Actual course content lives in lib/practiceCourses/*.ts; this
// file owns the shared type system, the course registry, and lookup helpers.
//
// A module is a sequence of PAGES: lesson pages (teach a concept, often via a
// non-history analogy before ever touching real content) interleaved with any
// number of "check" (or "full_saq_check") pages, wherever they fall in the
// sequence. There is no "the module's one check page" convention anymore —
// gating is purely by the student's current_page index into this array, so a
// module can have zero, one, or several check-kind pages.

import { CLAIM_TO_POINT_COURSE_ID, CLAIM_TO_POINT_MODULES } from "./practiceCourses/claimToPoint";

export const AP_SKILL_IDS = [
  "contextualization",
  "comparison",
  "causation",
  "continuity_change",
  "argumentation",
  "use_of_evidence",
] as const;

export type ApSkillId = (typeof AP_SKILL_IDS)[number];

export const AP_SKILL_LABELS: Record<ApSkillId, string> = {
  contextualization: "Contextualization",
  comparison: "Comparison",
  causation: "Causation",
  continuity_change: "Continuity & Change",
  argumentation: "Argumentation",
  use_of_evidence: "Use of Evidence",
};

// A separate, course-specific mastery dimension for the mechanics of writing
// a claim/evidence/reasoning chain — distinct from the six official AP
// historical-thinking skills above. Fed only by fictional-story reps; never
// mixed into AP_SKILL_IDS/SkillMasteryPanel.
export const WRITING_MECHANICS_SKILL_IDS = ["claim", "evidence", "reasoning", "identify_vs_explain"] as const;

export type WritingMechanicsSkillId = (typeof WRITING_MECHANICS_SKILL_IDS)[number];

export const WRITING_MECHANICS_LABELS: Record<WritingMechanicsSkillId, string> = {
  claim: "Claim",
  evidence: "Evidence",
  reasoning: "Reasoning",
  identify_vs_explain: "Identify vs. Explain",
};

// Every check page names which dimension its skill id belongs to, so a
// fictional-story rep can never accidentally write to the real AP panel (and
// vice versa) — the route branches on `.dimension`, not a shared enum.
export type PracticeCheckSkillTag =
  | { dimension: "ap"; id: ApSkillId }
  | { dimension: "mechanics"; id: WritingMechanicsSkillId };

export function skillTagLabel(tag: PracticeCheckSkillTag): string {
  return tag.dimension === "ap" ? AP_SKILL_LABELS[tag.id] : WRITING_MECHANICS_LABELS[tag.id];
}

// Scout's grading voice shifts register as a course escalates from an
// in-story fictional rep into real AP coaching. Defaults to "ap" when unset
// so older/simpler content needs no changes.
export const SCOUT_REGISTERS = ["story", "transitional", "ap"] as const;

export type ScoutRegister = (typeof SCOUT_REGISTERS)[number];

export interface PracticeLessonPage {
  id: string;
  kind: "lesson";
  title: string;
  body: string[];
}

export interface PracticePrompt {
  id: string;
  prompt: string;
  // Real Unit 1 source excerpt shown above the question (stimulus-based reps).
  stimulus?: string;
  // Fixed claim+evidence text shown above the response box, when a check page
  // isolates one part of the claim/evidence/reasoning chain by giving the
  // rest already written (e.g. "write only the reasoning sentence").
  givenContext?: string;
}

export interface PracticeCheckPage {
  id: string;
  kind: "check";
  title: string;
  intro: string;
  skill: PracticeCheckSkillTag;
  prompts: PracticePrompt[];
  // Before revealing feedback, prompt the student to self-diagnose the
  // weakest part of their own answer first.
  selfDiagnosis?: boolean;
  // No retry button; the server rejects a second grading attempt at the same
  // prompt and returns the stored result instead.
  singleAttempt?: boolean;
}

export interface FullSaqPart {
  label: "A" | "B" | "C";
  skill: ApSkillId;
  prompt: string;
}

export interface FullSaqPrompt {
  id: string;
  stimulus: string;
  parts: [FullSaqPart, FullSaqPart, FullSaqPart];
}

export interface PracticeFullSaqCheckPage {
  id: string;
  kind: "full_saq_check";
  title: string;
  intro: string;
  prompts: FullSaqPrompt[];
  selfDiagnosis?: boolean;
  singleAttempt?: boolean;
}

export type PracticePage = PracticeLessonPage | PracticeCheckPage | PracticeFullSaqCheckPage;

export interface PracticeModule {
  id: string;
  order: number;
  title: string;
  tagline: string;
  pages: PracticePage[];
  register?: ScoutRegister;
  // A bonus module after the course's real completion point — doesn't block
  // "course complete," doesn't count toward the required last-module index.
  optional?: boolean;
}

export interface PracticeCourse {
  id: string;
  title: string;
  description: string;
  modules: PracticeModule[];
}

export function isPracticeCourseId(id: string): boolean {
  return PRACTICE_COURSES.some((c) => c.id === id);
}

export function getPracticeCourse(courseId: string): PracticeCourse | undefined {
  return PRACTICE_COURSES.find((c) => c.id === courseId);
}

export function getPracticeModule(courseId: string, moduleId: string): PracticeModule | undefined {
  return getPracticeCourse(courseId)?.modules.find((m) => m.id === moduleId);
}

// The last module a student must clear for the course to count as complete —
// optional bonus modules (the timed capstone) don't count, even though they
// sit after it in the array.
export function getLastRequiredModule(course: PracticeCourse): PracticeModule {
  const required = course.modules.filter((m) => !m.optional);
  return required[required.length - 1];
}

export const PRACTICE_COURSES: PracticeCourse[] = [
  {
    id: CLAIM_TO_POINT_COURSE_ID,
    title: "Claim to Point",
    description:
      "A mystery you investigate one sentence at a time — claim, evidence, reasoning — until you're ready for a real, full-rubric AP World SAQ.",
    modules: CLAIM_TO_POINT_MODULES,
  },
];
