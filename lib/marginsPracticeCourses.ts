// Static catalog for Scout's practice courses — same idea as RUBRIC_TEMPLATES /
// REEL_TEMPLATES: hand-authored content, not AI-generated, so tone stays
// controlled and there's no extra live KORA call just to fetch a prompt.
//
// Each module is a short sequence of PAGES: a few conversational "lesson"
// pages that teach the concept from zero assumed knowledge (often via a
// non-history analogy before ever touching real content), followed by
// exactly one trailing "check" (or "full_saq_check") page. That trailing-page
// convention is load-bearing — app/api/margins/practice/[courseId]/check and
// PracticeCourseView both assume the check page is always a module's last page.

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

export interface PracticeLessonPage {
  id: string;
  kind: "lesson";
  title: string;
  body: string[];
}

export interface PracticePrompt {
  id: string;
  prompt: string;
}

export interface PracticeCheckPage {
  id: string;
  kind: "check";
  title: string;
  intro: string;
  skill: ApSkillId;
  prompts: PracticePrompt[];
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
}

export type PracticePage = PracticeLessonPage | PracticeCheckPage | PracticeFullSaqCheckPage;

export interface PracticeModule {
  id: string;
  order: number;
  title: string;
  tagline: string;
  pages: PracticePage[];
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
    title: "So... What's an SAQ?",
    tagline: "Start from zero. By the end, you'll land your first real point.",
    pages: [
      {
        id: "identify-p1",
        kind: "lesson",
        title: "So... what even is an SAQ?",
        body: [
          "Okay, first things first — SAQ stands for Short Answer Question. It's the smallest, least scary type of writing on the AP World History exam, and it's exactly what it sounds like: short answers.",
          "Here's the whole deal: every SAQ has three parts — A, B, and C. Each part is worth exactly one point. That's it. Three parts, three points, no more, no less.",
          "Best part: you don't need a thesis, an intro paragraph, or five paragraphs of anything. Each part just wants ONE clear answer, usually 1-3 sentences.",
          "So why start here instead of jumping into a full essay? Because SAQs are basically the building blocks of every other AP essay. Once you can nail a clean SAQ answer, you've already got half of what you need for a DBQ or LEQ later. We're building the skill in the smallest pieces first.",
          "Here's what a real SAQ prompt looks like: \"Identify ONE effect of the Columbian Exchange on population in the Americas.\" Notice how specific that is — it's not asking you to write everything you know, just ONE correct, specific thing.",
        ],
      },
      {
        id: "identify-p2",
        kind: "lesson",
        title: "The one move that earns every point",
        body: [
          "Every point on an SAQ — honestly, on every AP World essay — comes down to the same move: make a CLAIM, then back it up with something SPECIFIC.",
          "Forget history for a second. Say your friend asks: \"Which pizza place is better, Tony's or Marco's?\" If you just say \"Tony's is better,\" that's a claim with nothing behind it. Your friend has zero reason to believe you.",
          "Now say this instead: \"Tony's is better because their crust is actually crispy on the bottom instead of soggy, and their large is two bucks cheaper.\" That's a claim PLUS specific proof. Now your friend actually believes you — because you gave them something real to picture, not just a vibe.",
          "That's the entire skill. A claim by itself is empty. A claim with one sharp, specific piece of proof is what earns points — on a pizza argument, and on an AP exam.",
        ],
      },
      {
        id: "identify-p3",
        kind: "lesson",
        title: "Vague is the enemy",
        body: [
          "Here's the trap almost every student falls into: writing something that SOUNDS smart but is actually too vague to prove anything.",
          "Compare two answers to \"Why did trade increase along the Silk Roads?\": (1) \"Trade increased because things got better and people wanted more stuff.\" (2) \"Trade increased because the Mongol Empire controlled huge stretches of the route and enforced safety, so merchants stopped losing goods to bandits.\"",
          "Answer 1 could describe literally any trade network in any century — it's not really about the Silk Roads at all. Answer 2 names a specific empire, a specific mechanism, and a specific outcome. A grader can't argue with answer 2 — it's locked in with real, checkable detail.",
          "Your test for every SAQ part: could someone else write this exact sentence about a totally different topic? If yes, it's too vague. If it only makes sense for THIS specific fact, you're golden.",
        ],
      },
      {
        id: "identify-p4",
        kind: "lesson",
        title: "Okay, let's bring in the history",
        body: [
          "You've got the move down: claim + specific proof. Now let's point it at actual AP World content.",
          "The skill you're about to practice is called \"Use of Evidence\" — one of six official AP historical thinking skills. All it means is: can you name ONE real, specific historical fact or example that actually answers the question, instead of a vague generalization?",
          "You're about to get a real one-sentence prompt. Same move as the pizza example — just aim it at something real and specific from history. Ready?",
        ],
      },
      {
        id: "identify-p5",
        kind: "check",
        title: "Just the Facts",
        intro: "Quick hit: one sentence, one specific answer. No vague stuff allowed.",
        skill: "use_of_evidence",
        prompts: [
          {
            id: "identify-silk-roads",
            prompt:
              "Quick hit: give me ONE specific thing that spread along the Silk Roads between 500 and 1500 CE. A real, named thing — not just \"goods.\"",
          },
          {
            id: "identify-printing-press",
            prompt:
              "Name one specific piece of evidence that shows how the printing press changed European society after 1450. One sentence, one real detail.",
          },
          {
            id: "identify-industrialization",
            prompt:
              "Give me one concrete example of how industrialization changed daily life for factory workers in 19th-century Britain. Something you could actually picture, not a vibe.",
          },
        ],
      },
    ],
  },
  {
    id: "explain",
    order: 1,
    title: "But Why Though?",
    tagline: "Facts are step one. Now: why did it actually happen?",
    pages: [
      {
        id: "explain-p1",
        kind: "lesson",
        title: "Facts are step one. Now: why?",
        body: [
          "Nice work — you just proved you can spot a specific fact. But AP World also wants you to explain WHY things happened, not just WHAT happened. That skill is called causation.",
          "Causation just means connecting a cause to its effect, and explaining the actual mechanism — the \"how\" — that links them.",
        ],
      },
      {
        id: "explain-p2",
        kind: "lesson",
        title: "A non-history example: why'd you bomb that quiz?",
        body: [
          "Say you failed a quiz and your friend asks why. \"I don't know, bad luck\" isn't a real cause — it doesn't explain anything. But: \"I didn't do the practice problems, so I'd never actually solved that type of question before\" — THAT'S a real cause. It's a specific mechanism connecting your behavior to the actual result.",
          "The same move applies to history. \"Things changed because of contact between civilizations\" explains nothing — it's the historical equivalent of \"bad luck.\" You need the actual mechanism: WHO did WHAT that caused WHAT to happen.",
        ],
      },
      {
        id: "explain-p3",
        kind: "lesson",
        title: "One cause, explained all the way through",
        body: [
          "Here's the shape of a strong causation answer: [specific cause] → [the mechanism/how] → [the specific effect]. You don't need five causes — you need ONE, explained completely, instead of five mentioned but not explained.",
          "Weak: \"European exploration happened because of new technology.\" Strong: \"European exploration expanded because innovations like the caravel ship and the astrolabe let sailors travel farther from coastlines and still find their way back, which earlier ships couldn't reliably do.\" See the difference? The strong version actually explains the mechanism.",
        ],
      },
      {
        id: "explain-p4",
        kind: "lesson",
        title: "Catch the trap: naming isn't explaining",
        body: [
          "Quick gut check before you try one yourself: a lot of \"causation\" answers actually just restate the effect in different words, instead of explaining a mechanism. \"Trade increased because more people wanted to trade\" just restates the question — it doesn't explain anything new.",
          "Before you submit an answer, ask yourself: does this sentence tell someone HOW or WHY, using a specific detail they didn't already know? If you're just repeating the question in fancier words, dig one level deeper.",
        ],
      },
      {
        id: "explain-p5",
        kind: "check",
        title: "But Why Though?",
        intro: "One cause, explained all the way through. Go.",
        skill: "causation",
        prompts: [
          {
            id: "explain-mongols",
            prompt:
              "Why did the Mongol conquests actually help trade along the Silk Roads instead of just wrecking everything in their path? One sentence, one real reason.",
          },
          {
            id: "explain-exploration",
            prompt:
              "Why did European overseas exploration take off in the late 1400s specifically — not a hundred years earlier or later? Give me one real cause.",
          },
          {
            id: "explain-independence",
            prompt:
              "Why did colonies push back against European imperial rule in the 19th and 20th centuries? Pick one real reason and explain it in a sentence.",
          },
        ],
      },
    ],
  },
  {
    id: "compare",
    order: 2,
    title: "Side by Side",
    tagline: "Two things. One real difference or similarity. Go.",
    pages: [
      {
        id: "compare-p1",
        kind: "lesson",
        title: "New skill: comparison",
        body: [
          "You can identify a fact. You can explain why something happened. Now: comparison — looking at two things side by side and pointing out one real similarity or difference between them.",
        ],
      },
      {
        id: "compare-p2",
        kind: "lesson",
        title: "Two schools, one real difference",
        body: [
          "Say someone asks you to compare your school and a friend's school. Weak comparison: \"They're different because mine is better.\" That's not a comparison, that's an opinion. Strong comparison: \"My school requires four years of a foreign language, while my friend's school only requires two\" — one specific, checkable difference.",
          "A good comparison always names the SAME category for both things (here: language requirement) and then shows how they differ — or how they're alike — within that one category. Comparing two totally different categories isn't a comparison, it's just two random facts sitting next to each other.",
        ],
      },
      {
        id: "compare-p3",
        kind: "lesson",
        title: "Applying it to history",
        body: [
          "In history, this looks like: pick ONE category — an economic system, a form of government, a response to a crisis — and show how two empires, regions, or time periods handled that same category differently, or similarly.",
          "Weak: \"Spain and Portugal were both empires that were different.\" Strong: \"Spain relied on the encomienda system to force indigenous labor in mines, while Portugal built its Brazilian economy around large-scale sugar plantations worked by enslaved Africans.\" Same category — labor system — one real, specific difference.",
        ],
      },
      {
        id: "compare-p4",
        kind: "lesson",
        title: "Similarity works too, not just difference",
        body: [
          "Comparison doesn't only mean spotting differences — spotting a real similarity works just as well, as long as it's specific.",
          "Weak similarity: \"Both revolutions were violent.\" (Almost every revolution involves violence — too generic.) Strong similarity: \"Both the French and Russian Revolutions were triggered partly by ordinary people being unable to afford the rising cost of bread.\" That's a specific, shared cause — not just a vague vibe both events share.",
        ],
      },
      {
        id: "compare-p5",
        kind: "check",
        title: "Side by Side",
        intro: "Same category, both sides, one real difference or similarity.",
        skill: "comparison",
        prompts: [
          {
            id: "compare-empires",
            prompt:
              "Compare how Spain and Portugal approached empire-building in the Americas — pick one real difference and state it in one sentence.",
          },
          {
            id: "compare-revolutions",
            prompt:
              "Compare the causes of the French Revolution and the Russian Revolution — name one real similarity in one sentence.",
          },
          {
            id: "compare-imperialism-response",
            prompt:
              "Compare how Japan and China each responded to Western imperialism in the 19th century — one real difference, one sentence.",
          },
        ],
      },
    ],
  },
  {
    id: "full_saq",
    order: 3,
    title: "Prove It",
    tagline: "The real thing. Three parts, real rubric, no training wheels.",
    pages: [
      {
        id: "full-saq-p1",
        kind: "lesson",
        title: "You already know all three moves",
        body: [
          "Seriously — you already have everything you need. A real SAQ just asks you to do all three moves back to back: Part A is usually \"use of evidence\" (name a specific fact), Part B is usually \"causation\" (explain why), and Part C is usually \"comparison\" (or another skill) — the same three moves you just practiced, just stacked into one question.",
        ],
      },
      {
        id: "full-saq-p2",
        kind: "lesson",
        title: "How it's scored (no surprises)",
        body: [
          "Each part — A, B, C — is worth exactly 1 point, for 3 points total. It's binary: your sentence either fully and specifically answers what that part asks, or it doesn't. There's no partial credit within a part, which is actually good news — you don't need a perfect essay, you need three solid, specific sentences.",
          "Answer the parts in order, and answer ALL of them — leaving a part blank guarantees you lose that point, even if you're unsure. A specific guess beats a blank every time.",
        ],
      },
      {
        id: "full-saq-p3",
        kind: "lesson",
        title: "Timing tip: don't get stuck",
        body: [
          "One real exam tip: SAQs are meant to be quick. If you're staring at Part B for five minutes, that's a sign to write your best specific guess and move on — a good-enough answer on all three parts beats a perfect Part A and two blanks.",
        ],
      },
      {
        id: "full-saq-p4",
        kind: "lesson",
        title: "Ready for the real thing",
        body: [
          "This one's graded by the same real AP rubric a teacher would use — same rigor as a real assignment. Take your time, use the claim + specific proof move for every part, and go prove what you've got.",
        ],
      },
      {
        id: "full-saq-p5",
        kind: "full_saq_check",
        title: "Prove It",
        intro: "Three parts, one point each. Answer all three.",
        prompts: [
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

// Every module ends in exactly one check page (by content convention, enforced
// by whoever edits SAQ_MODULES above) — this is the page the /check route grades.
export function getModuleCheckPage(
  mod: PracticeModule
): PracticeCheckPage | PracticeFullSaqCheckPage | undefined {
  return mod.pages.find(
    (p): p is PracticeCheckPage | PracticeFullSaqCheckPage => p.kind === "check" || p.kind === "full_saq_check"
  );
}
