import { generateProjectDraft } from "./studioGenerator";
import type {
  InstructionalStyle,
  StudioDocType,
  TeacherStudioProject,
} from "./studioTypes";

export type StudioTemplateCategory =
  | "Lesson Decks"
  | "Worksheets"
  | "Activities"
  | "Assessments"
  | "Social Studies";

export const STUDIO_TEMPLATE_CATEGORIES: StudioTemplateCategory[] = [
  "Lesson Decks",
  "Worksheets",
  "Activities",
  "Assessments",
  "Social Studies",
];

export interface StudioTemplate {
  id: string;
  name: string;
  category: StudioTemplateCategory;
  description: string;
  recommendedUse: string;
  outputType: StudioDocType;
  estimatedMinutes: number;
  includedMaterials: string[];
  hasFullStarterContent: boolean;
  /** Used only when hasFullStarterContent is false, to seed the local generator. */
  instructionalStyleHint: InstructionalStyle;
  /** Hand-authored starter content. "[Topic]" tokens are replaced with the teacher's topic on use. */
  starterContent?: Partial<TeacherStudioProject>;
}

/* ---------- 8 fully-authored templates ---------- */

const directInstructionPractice: StudioTemplate = {
  id: "direct-instruction-practice",
  name: "Direct Instruction + Practice",
  category: "Lesson Decks",
  description:
    "A classic teach-then-practice structure: introduce the idea, model it, then hand practice to students.",
  recommendedUse: "Best for introducing a new skill or concept that students need modeled first.",
  outputType: "lesson",
  estimatedMinutes: 50,
  includedMaterials: ["Slide deck", "Practice worksheet", "Answer key"],
  hasFullStarterContent: true,
  instructionalStyleHint: "direct",
  starterContent: {
    slides: [
      {
        id: "",
        type: "title",
        title: "[Topic]",
        subtitle: "Today's Lesson",
        bullets: [],
        teacherNotes: "Share the objective and why it matters before diving in.",
        studentInstructions: "",
        layout: "titleOnly",
        tags: [],
        timingMinutes: 5,
      },
      {
        id: "",
        type: "content",
        title: "[Topic]: Direct Instruction",
        bullets: [
          { id: "", text: "Define the key idea in plain language" },
          { id: "", text: "Model one worked example" },
          { id: "", text: "Check for understanding before moving on" },
        ],
        teacherNotes: "Model the example out loud, narrating your thinking.",
        studentInstructions: "Watch the example and take notes on the steps.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 15,
      },
      {
        id: "",
        type: "activity",
        title: "Guided Practice",
        bullets: [
          { id: "", text: "Try one problem together as a class" },
          { id: "", text: "Pause to address common mistakes" },
        ],
        teacherNotes: "Circulate and prompt students rather than giving answers.",
        studentInstructions: "Work through the guided example with your teacher.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 15,
      },
      {
        id: "",
        type: "activity",
        title: "Independent Practice",
        bullets: [{ id: "", text: "Apply [Topic] on your own using the practice worksheet" }],
        teacherNotes: "Support students who are still stuck on the guided example.",
        studentInstructions: "Complete the practice worksheet independently.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 10,
      },
      {
        id: "",
        type: "summary",
        title: "Wrap-Up",
        bullets: [{ id: "", text: "What's one thing you learned about [Topic] today?" }],
        teacherNotes: "Collect responses as a quick formative check.",
        studentInstructions: "Respond to the exit prompt before you leave.",
        layout: "titleBullets",
        tags: ["exitTicket"],
        timingMinutes: 5,
      },
    ],
    worksheetSections: [
      {
        id: "",
        title: "[Topic] Practice",
        directions: "Show your work and answer in complete sentences.",
        questions: [
          { id: "q1", prompt: "Explain [Topic] in your own words.", type: "shortAnswer", points: 2 },
          { id: "q2", prompt: "Give one real example of [Topic].", type: "shortAnswer", points: 1 },
          { id: "q3", prompt: "Why does [Topic] matter?", type: "shortAnswer", points: 1 },
        ],
        responseSpaceLines: 3,
        answerKey: {},
        difficulty: "medium",
        readingLevel: "onLevel",
      },
    ],
    teacherGuide: {
      overview: "Direct instruction on [Topic], followed by guided and then independent practice.",
      objectives: ["Students will be able to explain [Topic] and apply it independently."],
      materials: ["Slide deck", "Practice worksheet"],
      timingNotes: "Model first, then release responsibility gradually.",
    },
  },
};

const inquiryLesson: StudioTemplate = {
  id: "inquiry-lesson",
  name: "Inquiry Lesson",
  category: "Lesson Decks",
  description: "Opens with a question, lets students investigate, then synthesizes as a class.",
  recommendedUse: "Best when you want students to construct understanding rather than receive it.",
  outputType: "lesson",
  estimatedMinutes: 50,
  includedMaterials: ["Slide deck", "Discussion prompts"],
  hasFullStarterContent: true,
  instructionalStyleHint: "inquiry",
  starterContent: {
    slides: [
      {
        id: "",
        type: "title",
        title: "[Topic]: A Question Worth Asking",
        subtitle: "Inquiry Lesson",
        bullets: [],
        teacherNotes: "Pose the driving question and let it sit — don't answer it yet.",
        studentInstructions: "",
        layout: "titleOnly",
        tags: [],
        timingMinutes: 5,
      },
      {
        id: "",
        type: "discussion",
        title: "What do you already think?",
        bullets: [
          { id: "", text: "What do you already know about [Topic]?" },
          { id: "", text: "What's your first guess, and why?" },
        ],
        teacherNotes: "Record initial guesses publicly — return to them at the end.",
        studentInstructions: "Share your first thinking with a partner.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 8,
      },
      {
        id: "",
        type: "content",
        title: "Investigate [Topic]",
        bullets: [
          { id: "", text: "Examine the evidence or source material" },
          { id: "", text: "Look for patterns or surprises" },
        ],
        teacherNotes: "Provide source material; resist over-explaining.",
        studentInstructions: "Investigate the material and record what you notice.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 15,
      },
      {
        id: "",
        type: "activity",
        title: "Test Your Thinking",
        bullets: [{ id: "", text: "Use evidence to support or revise your first guess about [Topic]" }],
        teacherNotes: "Push students to cite evidence, not just opinion.",
        studentInstructions: "Revise your earlier answer using what you found.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 12,
      },
      {
        id: "",
        type: "discussion",
        title: "Synthesize",
        bullets: [{ id: "", text: "As a class, what's our best answer to the question now?" }],
        teacherNotes: "Compare final answers to the initial guesses from earlier.",
        studentInstructions: "Share your revised thinking with the class.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 8,
      },
      {
        id: "",
        type: "summary",
        title: "Wrap-Up",
        bullets: [{ id: "", text: "What changed about your thinking on [Topic] today?" }],
        teacherNotes: "Collect as a quick formative check.",
        studentInstructions: "Respond to the exit prompt before you leave.",
        layout: "titleBullets",
        tags: ["exitTicket"],
        timingMinutes: 5,
      },
    ],
    teacherGuide: {
      overview: "An inquiry-based lesson where students investigate [Topic] before the class synthesizes an answer.",
      objectives: ["Students will be able to use evidence to support a claim about [Topic]."],
      materials: ["Source material or data on [Topic]", "Slide deck"],
      timingNotes: "Resist answering the driving question too early — let evidence lead.",
    },
  },
};

const practiceProblems: StudioTemplate = {
  id: "practice-problems",
  name: "Practice Problems",
  category: "Worksheets",
  description: "A mixed-format practice worksheet for reinforcing a skill after it's been taught.",
  recommendedUse: "Best for independent or homework practice after direct instruction.",
  outputType: "worksheet",
  estimatedMinutes: 20,
  includedMaterials: ["Worksheet", "Answer key"],
  hasFullStarterContent: true,
  instructionalStyleHint: "direct",
  starterContent: {
    worksheetSections: [
      {
        id: "",
        title: "[Topic] Practice Problems",
        directions: "Answer each question. Show your work where applicable.",
        questions: [
          { id: "pp1", prompt: "Define [Topic] in your own words.", type: "shortAnswer", points: 2 },
          {
            id: "pp2",
            prompt: "Which best describes [Topic]?",
            type: "multipleChoice",
            choices: ["A related concept", "An unrelated idea", "None of the above", "All of the above"],
            correctAnswer: "A related concept",
            points: 1,
          },
          { id: "pp3", prompt: "[Topic] connects to what we studied before. True or False?", type: "trueFalse", correctAnswer: "True", points: 1 },
          { id: "pp4", prompt: "Apply [Topic] to a new example.", type: "shortAnswer", points: 2 },
          { id: "pp5", prompt: "Explain one challenge people have with [Topic].", type: "constructedResponse", points: 3 },
        ],
        responseSpaceLines: 3,
        answerKey: { pp2: "A related concept", pp3: "True" },
        difficulty: "medium",
        readingLevel: "onLevel",
      },
    ],
  },
};

const primarySourceAnalysis: StudioTemplate = {
  id: "primary-source-analysis",
  name: "Primary Source Analysis",
  category: "Worksheets",
  description: "A structured worksheet for examining a single primary source closely.",
  recommendedUse: "Best when you have a real document, image, or excerpt for students to analyze.",
  outputType: "worksheet",
  estimatedMinutes: 25,
  includedMaterials: ["Worksheet", "Image placeholder for the source"],
  hasFullStarterContent: true,
  instructionalStyleHint: "inquiry",
  starterContent: {
    worksheetSections: [
      {
        id: "",
        title: "Primary Source Analysis: [Topic]",
        directions: "Examine the source carefully before answering.",
        questions: [
          { id: "ps1", prompt: "Who created this source, and when?", type: "shortAnswer", points: 1 },
          { id: "ps2", prompt: "What is the source's main point about [Topic]?", type: "shortAnswer", points: 2 },
          { id: "ps3", prompt: "What point of view or bias might this source have?", type: "shortAnswer", points: 2 },
          { id: "ps4", prompt: "How does this source connect to [Topic]?", type: "constructedResponse", points: 3 },
        ],
        responseSpaceLines: 3,
        answerKey: {},
        difficulty: "medium",
        readingLevel: "onLevel",
      },
    ],
    imagePlaceholders: [
      {
        id: "",
        description: "The primary source itself",
        purpose: "Students need to see the actual source to analyze it",
        suggestedSearch: "[Topic] primary source (archive or museum)",
        teacherPrompt:
          "Paste a link to the real source, or upload it once uploads are available.",
        link: null,
        uploadPending: true,
      },
    ],
  },
};

const thinkPairShare: StudioTemplate = {
  id: "think-pair-share",
  name: "Think-Pair-Share",
  category: "Activities",
  description: "A short, structured discussion protocol: think alone, talk in pairs, share with the class.",
  recommendedUse: "Best as a quick check for understanding or to launch a discussion.",
  outputType: "activity",
  estimatedMinutes: 15,
  includedMaterials: ["Slide deck", "Discussion prompt"],
  hasFullStarterContent: true,
  instructionalStyleHint: "discussion",
  starterContent: {
    slides: [
      {
        id: "",
        type: "title",
        title: "Think-Pair-Share: [Topic]",
        subtitle: "",
        bullets: [],
        teacherNotes: "Pose the prompt and give silent think time before any talking.",
        studentInstructions: "",
        layout: "titleOnly",
        tags: [],
        timingMinutes: 1,
      },
      {
        id: "",
        type: "discussion",
        title: "Think",
        bullets: [{ id: "", text: "What's your honest first thought about [Topic]?" }],
        teacherNotes: "Hold this silent for at least 60 seconds — resist rushing.",
        studentInstructions: "Think silently. Jot a note if it helps.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 2,
      },
      {
        id: "",
        type: "discussion",
        title: "Pair",
        bullets: [{ id: "", text: "Share your thinking with a partner. Ask each other one question." }],
        teacherNotes: "Circulate and listen in rather than redirecting too quickly.",
        studentInstructions: "Talk with your partner. Try to build on each other's ideas.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 5,
      },
      {
        id: "",
        type: "summary",
        title: "Share",
        bullets: [{ id: "", text: "What did your partner say that changed or sharpened your thinking?" }],
        teacherNotes: "Cold-call a few pairs rather than only volunteers.",
        studentInstructions: "Be ready to share either your idea or your partner's.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 5,
      },
    ],
    teacherGuide: {
      overview: "A think-pair-share protocol on [Topic].",
      objectives: ["Students will articulate and refine their thinking about [Topic] through discussion."],
      materials: ["Discussion prompt slide"],
      timingNotes: "Keep think time silent and protected — it's easy to skip but it's what makes pair time work.",
    },
  },
};

const quiz: StudioTemplate = {
  id: "quiz",
  name: "Quiz",
  category: "Assessments",
  description: "A short, gradable quiz mixing multiple choice, true/false, and short answer.",
  recommendedUse: "Best for a quick formal check of understanding after a lesson or unit.",
  outputType: "assessment",
  estimatedMinutes: 15,
  includedMaterials: ["Quiz", "Answer key"],
  hasFullStarterContent: true,
  instructionalStyleHint: "direct",
  starterContent: {
    worksheetSections: [
      {
        id: "",
        title: "[Topic] Quiz",
        directions: "Answer every question. You have the full class period.",
        questions: [
          {
            id: "qz1",
            prompt: "Which statement best describes [Topic]?",
            type: "multipleChoice",
            choices: ["A correct description", "A common misconception", "An unrelated idea", "None of the above"],
            correctAnswer: "A correct description",
            points: 1,
          },
          { id: "qz2", prompt: "[Topic] is connected to this unit's main idea. True or False?", type: "trueFalse", correctAnswer: "True", points: 1 },
          {
            id: "qz3",
            prompt: "Which is NOT an example of [Topic]?",
            type: "multipleChoice",
            choices: ["Example A", "Example B", "Example C", "A clearly unrelated example"],
            correctAnswer: "A clearly unrelated example",
            points: 1,
          },
          { id: "qz4", prompt: "Define a key vocabulary term related to [Topic].", type: "vocabulary", points: 1 },
          { id: "qz5", prompt: "Give one real-world example of [Topic].", type: "shortAnswer", points: 1 },
          { id: "qz6", prompt: "Explain why [Topic] matters in 2-3 sentences.", type: "shortAnswer", points: 2 },
        ],
        responseSpaceLines: 2,
        answerKey: { qz1: "A correct description", qz2: "True", qz3: "A clearly unrelated example" },
        difficulty: "medium",
        readingLevel: "onLevel",
      },
    ],
  },
};

const governmentDebate: StudioTemplate = {
  id: "government-debate",
  name: "Government Debate",
  category: "Social Studies",
  description: "A structured debate activity on a government or policy question.",
  recommendedUse: "Best for civics, government, or current events units with a genuine two-sided question.",
  outputType: "discussion",
  estimatedMinutes: 45,
  includedMaterials: ["Slide deck", "Prep organizer", "Debrief questions"],
  hasFullStarterContent: true,
  instructionalStyleHint: "discussion",
  starterContent: {
    slides: [
      {
        id: "",
        type: "title",
        title: "Debate: [Topic]",
        subtitle: "Government Debate",
        bullets: [],
        teacherNotes: "State the debate question neutrally — avoid signaling your own view.",
        studentInstructions: "",
        layout: "titleOnly",
        tags: [],
        timingMinutes: 5,
      },
      {
        id: "",
        type: "content",
        title: "Background on [Topic]",
        bullets: [
          { id: "", text: "Key facts students need before debating" },
          { id: "", text: "The two (or more) sides of the issue" },
        ],
        teacherNotes: "Present background as neutrally as possible.",
        studentInstructions: "Take notes on the background before you prep your side.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 10,
      },
      {
        id: "",
        type: "activity",
        title: "Prep Your Argument",
        bullets: [
          { id: "", text: "Identify your side's strongest evidence" },
          { id: "", text: "Anticipate the other side's strongest point" },
        ],
        teacherNotes: "Circulate to help groups find evidence, not opinions.",
        studentInstructions: "Use the prep organizer to build your argument with evidence.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 15,
      },
      {
        id: "",
        type: "discussion",
        title: "Debate",
        bullets: [{ id: "", text: "Present, rebut, and respond following the debate format" }],
        teacherNotes: "Hold groups to citing evidence, not just asserting opinions.",
        studentInstructions: "Present your case and respond to the other side respectfully.",
        layout: "titleBullets",
        tags: [],
        timingMinutes: 10,
      },
      {
        id: "",
        type: "summary",
        title: "Debrief",
        bullets: [{ id: "", text: "Did your view on [Topic] change? Why or why not?" }],
        teacherNotes: "This reflection matters as much as the debate itself.",
        studentInstructions: "Reflect honestly — changing your mind is a sign of good thinking.",
        layout: "titleBullets",
        tags: ["exitTicket"],
        timingMinutes: 5,
      },
    ],
    worksheetSections: [
      {
        id: "",
        title: "Debate Prep Organizer",
        directions: "Fill this out before the debate begins.",
        questions: [
          { id: "gd1", prompt: "What is your side's main claim about [Topic]?", type: "shortAnswer", points: 1 },
          { id: "gd2", prompt: "List your two strongest pieces of evidence.", type: "constructedResponse", points: 2 },
          { id: "gd3", prompt: "What's the other side's strongest counterargument, and how will you respond?", type: "constructedResponse", points: 2 },
        ],
        responseSpaceLines: 3,
        answerKey: {},
        difficulty: "medium",
        readingLevel: "onLevel",
      },
    ],
  },
};

const dbqDocumentSet: StudioTemplate = {
  id: "dbq-document-set",
  name: "DBQ Document Set",
  category: "Social Studies",
  description: "A document-based question packet with multiple sources and a synthesis question.",
  recommendedUse: "Best for AP-style or advanced social studies classes practicing source analysis and synthesis.",
  outputType: "studyGuide",
  estimatedMinutes: 40,
  includedMaterials: ["Document packet", "Source analysis questions", "Synthesis prompt"],
  hasFullStarterContent: true,
  instructionalStyleHint: "inquiry",
  starterContent: {
    worksheetSections: [
      {
        id: "",
        title: "Document-Based Question: [Topic]",
        directions: "Read each document, answer the source questions, then write a synthesis response.",
        questions: [
          { id: "dbq1", prompt: "Document 1 — What is the main argument, and what's the source's point of view?", type: "shortAnswer", points: 2 },
          { id: "dbq2", prompt: "Document 2 — What is the main argument, and what's the source's point of view?", type: "shortAnswer", points: 2 },
          { id: "dbq3", prompt: "Document 3 — What is the main argument, and what's the source's point of view?", type: "shortAnswer", points: 2 },
          { id: "dbq4", prompt: "Using all three documents, write a paragraph answering: how does [Topic] connect across these sources?", type: "constructedResponse", points: 5 },
        ],
        responseSpaceLines: 4,
        answerKey: {},
        difficulty: "hard",
        readingLevel: "above",
      },
    ],
    imagePlaceholders: [
      { id: "", description: "Document 1", purpose: "Primary source for the DBQ", suggestedSearch: "[Topic] primary source 1", teacherPrompt: "Paste a link to the real document.", link: null, uploadPending: true },
      { id: "", description: "Document 2", purpose: "Primary source for the DBQ", suggestedSearch: "[Topic] primary source 2", teacherPrompt: "Paste a link to the real document.", link: null, uploadPending: true },
      { id: "", description: "Document 3", purpose: "Primary source for the DBQ", suggestedSearch: "[Topic] primary source 3", teacherPrompt: "Paste a link to the real document.", link: null, uploadPending: true },
    ],
  },
};

const FULL_TEMPLATES: StudioTemplate[] = [
  directInstructionPractice,
  inquiryLesson,
  practiceProblems,
  primarySourceAnalysis,
  thinkPairShare,
  quiz,
  governmentDebate,
  dbqDocumentSet,
];

/* ---------- Remaining catalog entries (real metadata, generated draft on use) ---------- */

function stub(
  partial: Omit<StudioTemplate, "hasFullStarterContent" | "starterContent">
): StudioTemplate {
  return { ...partial, hasFullStarterContent: false };
}

const STUB_TEMPLATES: StudioTemplate[] = [
  stub({
    id: "fifty-minute-lesson-deck",
    name: "50-Minute Lesson Deck",
    category: "Lesson Decks",
    description: "A full slide deck sized for a standard single-period class.",
    recommendedUse: "Best as your default deck for a normal class period.",
    outputType: "lesson",
    estimatedMinutes: 50,
    includedMaterials: ["Slide deck", "Worksheet", "Teacher guide"],
    instructionalStyleHint: "balanced",
  }),
  stub({
    id: "ninety-minute-block-lesson",
    name: "90-Minute Block Lesson",
    category: "Lesson Decks",
    description: "An extended deck with more practice and discussion time for block scheduling.",
    recommendedUse: "Best for block periods where one normal-length lesson would run short.",
    outputType: "lesson",
    estimatedMinutes: 90,
    includedMaterials: ["Slide deck", "Worksheet", "Teacher guide"],
    instructionalStyleHint: "balanced",
  }),
  stub({
    id: "mini-lesson",
    name: "Mini Lesson",
    category: "Lesson Decks",
    description: "A short, focused deck for a single idea that doesn't need a full period.",
    recommendedUse: "Best for a quick concept check-in or a warm-up lesson.",
    outputType: "lesson",
    estimatedMinutes: 20,
    includedMaterials: ["Slide deck"],
    instructionalStyleHint: "direct",
  }),
  stub({
    id: "review-lesson",
    name: "Review Lesson",
    category: "Lesson Decks",
    description: "A structured review deck for revisiting material before an assessment.",
    recommendedUse: "Best the day or two before a quiz or test.",
    outputType: "lesson",
    estimatedMinutes: 45,
    includedMaterials: ["Slide deck", "Review worksheet"],
    instructionalStyleHint: "review" as InstructionalStyle,
  }),
  stub({
    id: "discussion-lesson",
    name: "Discussion Lesson",
    category: "Lesson Decks",
    description: "A deck built around discussion prompts rather than direct content delivery.",
    recommendedUse: "Best when the goal is dialogue, not new content.",
    outputType: "discussion",
    estimatedMinutes: 40,
    includedMaterials: ["Discussion prompts", "Debrief questions"],
    instructionalStyleHint: "discussion",
  }),
  stub({
    id: "guided-notes",
    name: "Guided Notes",
    category: "Worksheets",
    description: "A fill-in-the-blank style notes page to use alongside direct instruction.",
    recommendedUse: "Best for students who benefit from structure while taking notes.",
    outputType: "guidedNotes",
    estimatedMinutes: 30,
    includedMaterials: ["Guided notes sheet"],
    instructionalStyleHint: "direct",
  }),
  stub({
    id: "vocabulary-practice",
    name: "Vocabulary Practice",
    category: "Worksheets",
    description: "A worksheet focused on defining and applying key vocabulary terms.",
    recommendedUse: "Best when introducing several new terms at once.",
    outputType: "worksheet",
    estimatedMinutes: 20,
    includedMaterials: ["Worksheet"],
    instructionalStyleHint: "direct",
  }),
  stub({
    id: "reading-with-questions",
    name: "Reading With Questions",
    category: "Worksheets",
    description: "A short reading passage paired with comprehension questions.",
    recommendedUse: "Best for building reading stamina alongside content knowledge.",
    outputType: "worksheet",
    estimatedMinutes: 25,
    includedMaterials: ["Worksheet"],
    instructionalStyleHint: "balanced",
  }),
  stub({
    id: "graphic-organizer",
    name: "Graphic Organizer",
    category: "Worksheets",
    description: "A structured organizer for sorting or sequencing ideas.",
    recommendedUse: "Best for compare/contrast, cause/effect, or sequencing tasks.",
    outputType: "worksheet",
    estimatedMinutes: 15,
    includedMaterials: ["Organizer worksheet"],
    instructionalStyleHint: "balanced",
  }),
  stub({
    id: "exit-ticket-template",
    name: "Exit Ticket",
    category: "Worksheets",
    description: "A short reflection or check-for-understanding to use as students leave.",
    recommendedUse: "Best as the last few minutes of any lesson.",
    outputType: "exitTicket",
    estimatedMinutes: 5,
    includedMaterials: ["Exit ticket"],
    instructionalStyleHint: "balanced",
  }),
  stub({
    id: "study-guide-template",
    name: "Study Guide",
    category: "Worksheets",
    description: "A consolidated study guide pulling together key ideas for a unit.",
    recommendedUse: "Best when preparing students for a larger assessment.",
    outputType: "studyGuide",
    estimatedMinutes: 30,
    includedMaterials: ["Study guide"],
    instructionalStyleHint: "review" as InstructionalStyle,
  }),
  stub({
    id: "practice-problems-set-2",
    name: "Practice Problems",
    category: "Worksheets",
    description: "A second practice problems set variant for additional reinforcement.",
    recommendedUse: "Best as a follow-up set after the first round of practice.",
    outputType: "worksheet",
    estimatedMinutes: 20,
    includedMaterials: ["Worksheet", "Answer key"],
    instructionalStyleHint: "direct",
  }),
  stub({
    id: "station-rotation",
    name: "Station Rotation",
    category: "Activities",
    description: "A multi-station activity where small groups rotate through different tasks.",
    recommendedUse: "Best for differentiated practice or covering several sub-topics at once.",
    outputType: "activity",
    estimatedMinutes: 45,
    includedMaterials: ["Station directions", "Materials list", "Timing plan"],
    instructionalStyleHint: "project",
  }),
  stub({
    id: "debate-template",
    name: "Debate",
    category: "Activities",
    description: "A general-purpose structured debate activity.",
    recommendedUse: "Best for any subject with a genuine two-sided question.",
    outputType: "discussion",
    estimatedMinutes: 40,
    includedMaterials: ["Prep organizer", "Debrief questions"],
    instructionalStyleHint: "discussion",
  }),
  stub({
    id: "scenario-activity",
    name: "Scenario Activity",
    category: "Activities",
    description: "Students work through a realistic scenario and decide how to respond.",
    recommendedUse: "Best for applying concepts to real-world decision-making.",
    outputType: "activity",
    estimatedMinutes: 30,
    includedMaterials: ["Scenario handout", "Debrief questions"],
    instructionalStyleHint: "project",
  }),
  stub({
    id: "case-study",
    name: "Case Study",
    category: "Activities",
    description: "A deeper analysis of one real or realistic case related to the topic.",
    recommendedUse: "Best for examining a topic through one concrete example in depth.",
    outputType: "activity",
    estimatedMinutes: 35,
    includedMaterials: ["Case study handout", "Analysis questions"],
    instructionalStyleHint: "inquiry",
  }),
  stub({
    id: "gallery-walk",
    name: "Gallery Walk",
    category: "Activities",
    description: "Students circulate among posted materials, responding as they go.",
    recommendedUse: "Best for reviewing multiple examples or student work at once.",
    outputType: "activity",
    estimatedMinutes: 25,
    includedMaterials: ["Gallery prompts", "Response sheet"],
    instructionalStyleHint: "gameBased",
  }),
  stub({
    id: "simulation-debrief",
    name: "Simulation Debrief",
    category: "Activities",
    description: "A structured set of debrief questions to use after any simulation activity.",
    recommendedUse: "Best paired with a simulation to make sure the learning sticks.",
    outputType: "simulation",
    estimatedMinutes: 15,
    includedMaterials: ["Debrief questions"],
    instructionalStyleHint: "discussion",
  }),
  stub({
    id: "test-review",
    name: "Test Review",
    category: "Assessments",
    description: "A review packet structured around likely test questions.",
    recommendedUse: "Best in the class period right before a test.",
    outputType: "studyGuide",
    estimatedMinutes: 35,
    includedMaterials: ["Review packet", "Answer key"],
    instructionalStyleHint: "review" as InstructionalStyle,
  }),
  stub({
    id: "constructed-response",
    name: "Constructed Response",
    category: "Assessments",
    description: "A single extended-response prompt with a scoring guide.",
    recommendedUse: "Best for assessing depth of understanding on one big idea.",
    outputType: "assessment",
    estimatedMinutes: 25,
    includedMaterials: ["Prompt", "Scoring guide"],
    instructionalStyleHint: "balanced",
  }),
  stub({
    id: "short-answer-practice",
    name: "Short Answer Practice",
    category: "Assessments",
    description: "A set of short-answer questions for low-stakes assessment practice.",
    recommendedUse: "Best for frequent, lower-pressure checks for understanding.",
    outputType: "assessment",
    estimatedMinutes: 15,
    includedMaterials: ["Worksheet", "Answer key"],
    instructionalStyleHint: "balanced",
  }),
  stub({
    id: "rubric",
    name: "Rubric",
    category: "Assessments",
    description: "A scoring rubric structure for grading student work consistently.",
    recommendedUse: "Best when pairing with any open-ended assignment.",
    outputType: "teacherGuide",
    estimatedMinutes: 10,
    includedMaterials: ["Rubric"],
    instructionalStyleHint: "balanced",
  }),
  stub({
    id: "reflection",
    name: "Reflection",
    category: "Assessments",
    description: "A short written reflection prompt for students to assess their own learning.",
    recommendedUse: "Best at the end of a unit or project.",
    outputType: "exitTicket",
    estimatedMinutes: 10,
    includedMaterials: ["Reflection prompt"],
    instructionalStyleHint: "balanced",
  }),
  stub({
    id: "ap-world-saq-practice",
    name: "AP World SAQ Practice",
    category: "Social Studies",
    description: "Short-answer question practice in the AP World History format.",
    recommendedUse: "Best for AP World History classes practicing the SAQ format.",
    outputType: "assessment",
    estimatedMinutes: 25,
    includedMaterials: ["SAQ prompt set", "Scoring notes"],
    instructionalStyleHint: "direct",
  }),
  stub({
    id: "economics-scenario-lesson",
    name: "Economics Scenario Lesson",
    category: "Social Studies",
    description: "A lesson built around a realistic economics decision-making scenario.",
    recommendedUse: "Best for applying economics concepts to a real-feeling situation.",
    outputType: "lesson",
    estimatedMinutes: 50,
    includedMaterials: ["Slide deck", "Scenario handout"],
    instructionalStyleHint: "project",
  }),
  stub({
    id: "personal-finance-budget-activity",
    name: "Personal Finance Budget Activity",
    category: "Social Studies",
    description: "A hands-on budgeting activity using realistic income and expense numbers.",
    recommendedUse: "Best for personal finance units covering budgeting.",
    outputType: "activity",
    estimatedMinutes: 40,
    includedMaterials: ["Budget worksheet", "Scenario cards"],
    instructionalStyleHint: "project",
  }),
  stub({
    id: "court-case-analysis",
    name: "Court Case Analysis",
    category: "Social Studies",
    description: "A structured worksheet for analyzing the facts, ruling, and impact of a court case.",
    recommendedUse: "Best for government or law-related units.",
    outputType: "worksheet",
    estimatedMinutes: 30,
    includedMaterials: ["Worksheet"],
    instructionalStyleHint: "inquiry",
  }),
  stub({
    id: "trade-network-simulation",
    name: "Trade Network Simulation",
    category: "Social Studies",
    description: "A simulation activity modeling how trade networks connect regions and goods.",
    recommendedUse: "Best for world history units covering trade and exchange.",
    outputType: "simulation",
    estimatedMinutes: 45,
    includedMaterials: ["Simulation roles", "Materials list", "Debrief questions"],
    instructionalStyleHint: "gameBased",
  }),
  stub({
    id: "historical-cause-effect-organizer",
    name: "Historical Cause/Effect Organizer",
    category: "Social Studies",
    description: "A graphic organizer for mapping causes and effects of a historical event.",
    recommendedUse: "Best for analyzing a single pivotal historical event.",
    outputType: "worksheet",
    estimatedMinutes: 20,
    includedMaterials: ["Organizer worksheet"],
    instructionalStyleHint: "inquiry",
  }),
];

export const studioTemplates: StudioTemplate[] = [...FULL_TEMPLATES, ...STUB_TEMPLATES];

export function getStudioTemplateById(id: string): StudioTemplate | undefined {
  return studioTemplates.find((template) => template.id === id);
}

export function getStudioTemplatesByCategory(
  category: StudioTemplateCategory
): StudioTemplate[] {
  return studioTemplates.filter((template) => template.category === category);
}

function replaceTopicTokens<T>(value: T, topic: string): T {
  const json = JSON.stringify(value).replace(/\[Topic\]/g, topic);
  return JSON.parse(json) as T;
}

function assignFreshIds(project: TeacherStudioProject): TeacherStudioProject {
  project.id = crypto.randomUUID();
  project.slides = project.slides.map((slide) => ({
    ...slide,
    id: crypto.randomUUID(),
    bullets: slide.bullets.map((bullet) => ({ ...bullet, id: crypto.randomUUID() })),
  }));
  project.worksheetSections = project.worksheetSections.map((section) => {
    const questionIdMap = new Map<string, string>();
    const questions = section.questions.map((question) => {
      const newQuestionId = crypto.randomUUID();
      questionIdMap.set(question.id, newQuestionId);
      return { ...question, id: newQuestionId };
    });
    const answerKey: Record<string, string> = {};
    Object.entries(section.answerKey).forEach(([oldId, answer]) => {
      answerKey[questionIdMap.get(oldId) ?? oldId] = answer;
    });
    return { ...section, id: crypto.randomUUID(), questions, answerKey };
  });
  project.imagePlaceholders = project.imagePlaceholders.map((placeholder) => ({
    ...placeholder,
    id: crypto.randomUUID(),
  }));
  return project;
}

export function instantiateTemplate(
  template: StudioTemplate,
  input: { topic: string; subject: string; gradeLevel: string }
): TeacherStudioProject {
  const safeTopic = input.topic.trim() || "Today's Topic";

  if (!template.hasFullStarterContent || !template.starterContent) {
    return generateProjectDraft({
      topic: safeTopic,
      subject: input.subject,
      gradeLevel: input.gradeLevel,
      classMinutes: template.estimatedMinutes,
      primaryActivity: "learn",
      outputType: template.outputType,
      instructionalStyle: template.instructionalStyleHint,
    });
  }

  const filled = replaceTopicTokens(template.starterContent, safeTopic);
  const now = Date.now();
  const base = generateProjectDraft({
    topic: safeTopic,
    subject: input.subject,
    gradeLevel: input.gradeLevel,
    classMinutes: template.estimatedMinutes,
    primaryActivity: "learn",
    outputType: template.outputType,
    instructionalStyle: template.instructionalStyleHint,
  });

  const project: TeacherStudioProject = {
    ...base,
    ...filled,
    title: `${safeTopic} — ${template.name}`,
    templateId: template.id,
    creationMode: "template",
    createdAt: now,
    updatedAt: now,
  };

  return assignFreshIds(project);
}
