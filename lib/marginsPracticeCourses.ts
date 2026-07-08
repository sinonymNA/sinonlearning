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

// The fictional cast — fixed identity (initials/color) lives here since it's
// shared vocabulary across every module that quotes them. A character's
// in-story status (e.g. "ALIBI: DINER 11:04PM") changes as the plot
// develops, so it's passed per-usage at the call site, not stored here.
export type CharacterId = "devon" | "priya" | "jonah" | "marisol" | "wren";

export const CHARACTER_META: Record<CharacterId, { initials: string; colorClass: string }> = {
  devon: { initials: "D", colorClass: "bg-teal-100 text-teal-700" },
  priya: { initials: "P", colorClass: "bg-violet-100 text-violet-700" },
  jonah: { initials: "J", colorClass: "bg-stone-200 text-stone-700" },
  marisol: { initials: "M", colorClass: "bg-sky-100 text-sky-700" },
  // Wren never appears "on screen" — the one source you never hear from
  // directly, only through forwarded/secondhand texts.
  wren: { initials: "W", colorClass: "bg-amber-100 text-amber-700" },
};

// A lesson page's body is a sequence of typed content blocks — not just
// paragraphs — so visuals (a quoted text thread, a pinned evidence card, a
// claim/evidence/reasoning diagram, a timeline, a chart) sit directly in the
// narrative flow instead of being appended after a wall of prose. A closed,
// purpose-built union (not a generic "embed named component" escape hatch)
// keeps every block statically checked and keeps PracticeContentBlockView's
// dispatch a plain switch, no dynamic component registry.
export interface ParagraphBlock {
  type: "paragraph";
  text: string;
}

export interface ChatMessageBlock {
  type: "chatMessage";
  sender: CharacterId;
  text: string;
  timestamp?: string;
}

// A run of consecutive chat lines rendered as one contiguous conversation
// card instead of separately floating bubbles.
export interface ChatExchangeBlock {
  type: "chatExchange";
  messages: { sender: CharacterId; text: string; timestamp?: string }[];
}

// A "pinned to the investigation board" reveal — a diner timestamp, a
// currency-portrait detail, a quoted historical source excerpt.
export interface EvidenceExhibitBlock {
  type: "evidenceExhibit";
  label: string;
  content: string;
  annotation?: string;
}

// The recurring claim -> evidence -> reasoning anatomy-of-a-sentence
// diagram. `highlight` dims the other two steps to isolate the one a page is
// drilling (e.g. a reasoning-only rep).
export interface AnatomyDiagramBlock {
  type: "anatomyDiagram";
  claim: string;
  evidence: string;
  reasoning: string;
  highlight?: "claim" | "evidence" | "reasoning";
}

// A sequence of real-history dated events.
export interface TimelineBlock {
  type: "timeline";
  events: { date: string; label: string; detail: string }[];
}

// Explicitly illustrative/schematic bar or line data — `illustrative` is
// required (not optional) so a chart can never silently imply it's precise
// verified statistics; the rendering component always shows `caption` as a
// visible disclaimer strip.
export interface SchematicChartBlock {
  type: "schematicChart";
  chartKind: "bar" | "line";
  caption: string;
  points: { label: string; value: number }[];
  illustrative: true;
}

// Side-by-side comparison of two things across shared dimensions.
export interface ComparisonChartBlock {
  type: "comparisonChart";
  leftLabel: string;
  rightLabel: string;
  rows: { dimension: string; left: string; right: string }[];
}

// A "Weak — .../ Strong — ..." contrast pair.
export interface ContrastCardBlock {
  type: "contrastCard";
  weak: string;
  strong: string;
  weakNote?: string;
  strongNote?: string;
}

// Scout breaking from the story narration to talk directly to the student —
// a teaching aside, not plot. Gets its own tinted callout treatment instead
// of reading as an ordinary paragraph (or, worse, a stray quote mark).
export interface CalloutBlock {
  type: "callout";
  text: string;
  label?: string;
}

// A story illustration — "photo evidence" pinned to the investigation
// board. `src` is a path under /public.
export interface ImageBlock {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
}

export type PracticeContentBlock =
  | ParagraphBlock
  | ChatMessageBlock
  | ChatExchangeBlock
  | EvidenceExhibitBlock
  | AnatomyDiagramBlock
  | TimelineBlock
  | SchematicChartBlock
  | ComparisonChartBlock
  | ContrastCardBlock
  | CalloutBlock
  | ImageBlock;

export interface PracticeLessonPage {
  id: string;
  kind: "lesson";
  title: string;
  body: PracticeContentBlock[];
}

// A stimulus/given-context can optionally carry a richer visual — additive,
// falls back to the plain-text field's existing rendering when unset, so no
// existing prompt breaks by not having one authored yet.
export type StimulusVisual =
  | { kind: "document"; label: string }
  | { kind: "comparisonChart"; leftLabel: string; rightLabel: string; rows: { dimension: string; left: string; right: string }[] };

export interface PracticePrompt {
  id: string;
  prompt: string;
  // Real Unit 1 source excerpt shown above the question (stimulus-based reps).
  stimulus?: string;
  // Richer visual for `stimulus` — renders instead of the plain text box when set.
  stimulusVisual?: StimulusVisual;
  // Fixed claim+evidence text shown above the response box, when a check page
  // isolates one part of the claim/evidence/reasoning chain by giving the
  // rest already written (e.g. "write only the reasoning sentence").
  givenContext?: string;
  // Richer visual for `givenContext` — renders via AnatomyDiagram(highlight="reasoning")
  // instead of the plain text box when set.
  givenContextAnatomy?: { claim: string; evidence: string };
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
  stimulusVisual?: StimulusVisual;
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
