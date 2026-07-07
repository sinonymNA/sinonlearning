// Static catalog for Scout's practice courses — same idea as RUBRIC_TEMPLATES /
// REEL_TEMPLATES: hand-authored content, not AI-generated, so tone stays
// controlled and there's no extra live KORA call just to fetch a prompt.

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

export type PracticeModuleKind = "identify" | "explain" | "compare" | "full_saq";

export interface PracticePrompt {
  id: string;
  skill: ApSkillId;
  prompt: string;
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

export interface PracticeModule {
  id: string;
  order: number;
  kind: PracticeModuleKind;
  title: string;
  tagline: string;
  skill?: ApSkillId;
  prompts?: PracticePrompt[];
  fullSaqPrompts?: FullSaqPrompt[];
}

export interface PracticeCourse {
  id: string;
  title: string;
  description: string;
  modules: PracticeModule[];
}

export const SAQ_COURSE_ID = "saq";

const SAQ_MODULES: PracticeModule[] = [
  {
    id: "identify",
    order: 0,
    kind: "identify",
    title: "Just the Facts",
    tagline: "One real, specific example. That's it. No essay allowed.",
    skill: "use_of_evidence",
    prompts: [
      {
        id: "identify-silk-roads",
        skill: "use_of_evidence",
        prompt:
          "Quick hit: give me ONE specific thing that spread along the Silk Roads between 500 and 1500 CE. A real, named thing — not just \"goods.\"",
      },
      {
        id: "identify-printing-press",
        skill: "use_of_evidence",
        prompt:
          "Name one specific piece of evidence that shows how the printing press changed European society after 1450. One sentence, one real detail.",
      },
      {
        id: "identify-industrialization",
        skill: "use_of_evidence",
        prompt:
          "Give me one concrete example of how industrialization changed daily life for factory workers in 19th-century Britain. Something you could actually picture, not a vibe.",
      },
    ],
  },
  {
    id: "explain",
    order: 1,
    kind: "explain",
    title: "But Why Though?",
    tagline: "Facts are easy. Now tell me why it actually happened.",
    skill: "causation",
    prompts: [
      {
        id: "explain-mongols",
        skill: "causation",
        prompt:
          "Why did the Mongol conquests actually help trade along the Silk Roads instead of just wrecking everything in their path? One sentence, one real reason.",
      },
      {
        id: "explain-exploration",
        skill: "causation",
        prompt:
          "Why did European overseas exploration take off in the late 1400s specifically — not a hundred years earlier or later? Give me one real cause.",
      },
      {
        id: "explain-independence",
        skill: "causation",
        prompt:
          "Why did colonies push back against European imperial rule in the 19th and 20th centuries? Pick one real reason and explain it in a sentence.",
      },
    ],
  },
  {
    id: "compare",
    order: 2,
    kind: "compare",
    title: "Side by Side",
    tagline: "Two things. One real difference or similarity. Go.",
    skill: "comparison",
    prompts: [
      {
        id: "compare-empires",
        skill: "comparison",
        prompt:
          "Compare how Spain and Portugal approached empire-building in the Americas — pick one real difference and state it in one sentence.",
      },
      {
        id: "compare-revolutions",
        skill: "comparison",
        prompt:
          "Compare the causes of the French Revolution and the Russian Revolution — name one real similarity in one sentence.",
      },
      {
        id: "compare-imperialism-response",
        skill: "comparison",
        prompt:
          "Compare how Japan and China each responded to Western imperialism in the 19th century — one real difference, one sentence.",
      },
    ],
  },
  {
    id: "full_saq",
    order: 3,
    kind: "full_saq",
    title: "Prove It",
    tagline: "The real thing. Three parts, real rubric, no training wheels.",
    fullSaqPrompts: [
      {
        id: "full-saq-columbian-exchange",
        stimulus:
          "Use your knowledge of world history to answer all parts of the question below. This one's about the Americas, 1450–1750.",
        parts: [
          {
            label: "A",
            skill: "use_of_evidence",
            prompt:
              "Identify ONE specific effect of the Columbian Exchange on the population of the Americas between 1492 and 1650.",
          },
          {
            label: "B",
            skill: "causation",
            prompt:
              "Explain ONE reason European powers were able to establish colonial empires in the Americas during this period.",
          },
          {
            label: "C",
            skill: "comparison",
            prompt:
              "Explain ONE way the economic systems used by two European colonial powers in the Americas differed from each other.",
          },
        ],
      },
      {
        id: "full-saq-cold-war-decolonization",
        stimulus:
          "Use your knowledge of world history to answer all parts of the question below. This one's about the Cold War and decolonization, 1900–2001.",
        parts: [
          {
            label: "A",
            skill: "use_of_evidence",
            prompt: "Identify ONE specific example of a Cold War proxy conflict.",
          },
          {
            label: "B",
            skill: "causation",
            prompt:
              "Explain ONE reason a newly independent nation in Africa or Asia aligned with one side of the Cold War.",
          },
          {
            label: "C",
            skill: "continuity_change",
            prompt:
              "Explain ONE way decolonization changed the global balance of power between 1900 and 2001.",
          },
        ],
      },
    ],
  },
];

export const PRACTICE_COURSES: PracticeCourse[] = [
  {
    id: SAQ_COURSE_ID,
    title: "SAQ Bootcamp",
    description:
      "Work up from one-sentence reps to a full, real-rubric-scored SAQ — with Scout coaching you through every step.",
    modules: SAQ_MODULES,
  },
];

export function isPracticeCourseId(id: string): boolean {
  return PRACTICE_COURSES.some((c) => c.id === id);
}

export function getPracticeCourse(courseId: string): PracticeCourse | undefined {
  return PRACTICE_COURSES.find((c) => c.id === courseId);
}

export function getPracticeModule(courseId: string, moduleId: string): PracticeModule | undefined {
  return getPracticeCourse(courseId)?.modules.find((m) => m.id === moduleId);
}

export function getPracticePrompt(
  courseId: string,
  moduleId: string,
  promptId: string
): PracticePrompt | undefined {
  return getPracticeModule(courseId, moduleId)?.prompts?.find((p) => p.id === promptId);
}

export function getFullSaqPrompt(
  courseId: string,
  moduleId: string,
  promptId: string
): FullSaqPrompt | undefined {
  return getPracticeModule(courseId, moduleId)?.fullSaqPrompts?.find((p) => p.id === promptId);
}
