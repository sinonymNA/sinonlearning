// Node/edge data for the KORA network graph — deliberately not decorative.
// Every edge below traces to real language in the production system prompts
// (lib/*KoraGenerate.ts) or the grading/revision routes, cited in `grounding`.
// This file has no rendering logic; KoraNetworkGraph.tsx consumes it.

export type KoraNodeKind = "core" | "principle" | "capability";

export interface KoraNode {
  id: string;
  kind: KoraNodeKind;
  label: string;
}

export interface KoraEdge {
  source: string;
  target: string;
  grounding: string;
}

export const KORA_NODES: KoraNode[] = [
  { id: "kora", kind: "core", label: "KORA" },

  { id: "p-author", kind: "principle", label: "Teacher is the author" },
  { id: "p-draft", kind: "principle", label: "Every output is a draft" },
  { id: "p-no-fabricate", kind: "principle", label: "Never fabricates evidence" },
  { id: "p-teacher-evaluates", kind: "principle", label: "Teacher oversees evaluation" },
  { id: "p-no-student-words", kind: "principle", label: "Never writes the student's words" },

  { id: "c-slideshows", kind: "capability", label: "Slideshows" },
  { id: "c-videos", kind: "capability", label: "Explainer videos" },
  { id: "c-grading", kind: "capability", label: "Essay grading" },
  { id: "c-assignments", kind: "capability", label: "Assignment & rubric design" },
  { id: "c-revision", kind: "capability", label: "Revision coaching" },
  { id: "c-notesheets", kind: "capability", label: "Notesheets" },
  { id: "c-game-shows", kind: "capability", label: "Game shows" },
  { id: "c-diagnostics", kind: "capability", label: "Understanding diagnostics" },
];

// Core → each principle: KORA is defined by these five constraints.
const CORE_TO_PRINCIPLES: KoraEdge[] = [
  { source: "kora", target: "p-author", grounding: "The teacher's own topic, audience, and key points drive every generation — KORA never originates a lesson from scratch." },
  { source: "kora", target: "p-draft", grounding: "No KORA output is final. Every artifact is built to be opened, edited, and reshaped before it reaches a student." },
  { source: "kora", target: "p-no-fabricate", grounding: "KORA is instructed to never invent a citation, statistic, quote, or historical source presented as real." },
  { source: "kora", target: "p-teacher-evaluates", grounding: "Scores and feedback are information for a teacher to review — never an automatic grade or record." },
  { source: "kora", target: "p-no-student-words", grounding: "Where a task involves student writing, KORA is barred from producing any sentence the student could copy directly into their own work." },
];

// Capability → principle: the specific grounding rule from that task's real system prompt.
const CAPABILITY_EDGES: KoraEdge[] = [
  {
    source: "c-slideshows",
    target: "p-no-fabricate",
    grounding: "\"Never invent a specific citation, statistic, or quote attribution presented as verifiably real unless it is common, well-established knowledge.\"",
  },
  {
    source: "c-slideshows",
    target: "p-author",
    grounding: "Every deck is built from the teacher's own topic, audience, and key points supplied in the build conversation — not a generic template.",
  },
  {
    source: "c-slideshows",
    target: "p-draft",
    grounding: "Slider decks stay fully editable after generation — themes, slides, and images can all be changed before a class ever sees them.",
  },
  {
    source: "c-videos",
    target: "p-no-fabricate",
    grounding: "\"Do NOT invent image URLs or describe images you can't guarantee exist — image_query is a SEARCH phrase the teacher will approve.\"",
  },
  {
    source: "c-videos",
    target: "p-author",
    grounding: "Reel scripts a sequence of beats around the teacher's own topic and key points; the teacher records the real narration.",
  },
  {
    source: "c-grading",
    target: "p-no-fabricate",
    grounding: "\"Every annotation's 'quote' field MUST be an exact, verbatim substring copied character-for-character\" from the student's actual essay — a hallucinated quote is dropped, never rendered.",
  },
  {
    source: "c-grading",
    target: "p-draft",
    grounding: "\"This is a draft grade a teacher will review before it counts.\"",
  },
  {
    source: "c-grading",
    target: "p-teacher-evaluates",
    grounding: "A teacher can override any KORA score before it's recorded — the grading route stores a separate teacher_override_score field for exactly this.",
  },
  {
    source: "c-assignments",
    target: "p-no-fabricate",
    grounding: "\"You must NEVER invent, fabricate, or write text presented as a real historical primary source document, quote, or excerpt.\" For DBQ prompts, KORA suggests document topics for the teacher to source themselves — it never writes the source text.",
  },
  {
    source: "c-assignments",
    target: "p-author",
    grounding: "Rubric generation adapts the College Board's official categories to the teacher's topic — it does not invent new categories or change point totals.",
  },
  {
    source: "c-revision",
    target: "p-no-student-words",
    grounding: "\"Never write a sentence, phrase, thesis statement, piece of analysis, or any text the student could copy directly into their essay.\" A 'scaffold' is a fill-in-the-blank template, never a worked example with real content plugged in.",
  },
  {
    source: "c-revision",
    target: "p-teacher-evaluates",
    grounding: "Revision plans are generated from a grading the teacher has already reviewed — coaching never bypasses the teacher's own assessment.",
  },
  {
    source: "c-notesheets",
    target: "p-author",
    grounding: "Scaffold reads the teacher's own uploaded slides — the notesheet's content, concepts, and structure come from that specific lesson, not a generic outline.",
  },
  {
    source: "c-notesheets",
    target: "p-draft",
    grounding: "Every generated section is editable before export — teachers routinely adjust section types and wording before printing.",
  },
  {
    source: "c-game-shows",
    target: "p-author",
    grounding: "Game show content is generated directly from content the teacher pastes in — KORA reformats it into a game, it doesn't supply the underlying facts.",
  },
  {
    source: "c-game-shows",
    target: "p-draft",
    grounding: "Generated rounds and questions can be edited before a class plays them, the same as any other KORA draft.",
  },
  {
    source: "c-diagnostics",
    target: "p-teacher-evaluates",
    grounding: "Diagnostic evidence (accuracy, causality, application, transfer, model quality) is a signal for the teacher, not an automated judgment of the student — see the KORA research program below.",
  },
  {
    source: "c-diagnostics",
    target: "p-no-fabricate",
    grounding: "Evidence levels are only ever assigned from what a student actually demonstrated in their own response — never inferred or assumed.",
  },
];

export const KORA_EDGES: KoraEdge[] = [...CORE_TO_PRINCIPLES, ...CAPABILITY_EDGES];
