import {
  createImagePlaceholder,
  createSlide,
  createWorksheetQuestion,
  createWorksheetSection,
} from "./studioDefaults";
import type { StudioSlide, TeacherStudioProject, WorksheetSection } from "./studioTypes";

/**
 * Comet quick actions — every "real" entry below is a pure, local transform
 * `(project) => project`. No API calls, no generated prose beyond fixed
 * template strings interpolated with the teacher's own content. Entries
 * marked `available: false` are visibly listed but intentionally no-ops;
 * the UI shows a "coming soon" explainer instead of running them.
 */

const TEXT_HEAVY_WORD_LIMIT = 60;

function wordCount(text: string | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function slideWordCount(slide: StudioSlide): number {
  return wordCount(slide.body) + slide.bullets.reduce((sum, b) => sum + wordCount(b.text), 0);
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function firstSentence(text: string): string {
  const match = text.trim().match(/^[^.!?]*[.!?]/);
  return match ? match[0].trim() : truncateWords(text, 16);
}

function topicFromProject(project: TeacherStudioProject): string {
  const fromTitle = project.title.replace(/\s+Lesson$/i, "").trim();
  return fromTitle || project.title || "this topic";
}

function touch(project: TeacherStudioProject): TeacherStudioProject {
  return { ...project, updatedAt: Date.now() };
}

function shortenIt(project: TeacherStudioProject): TeacherStudioProject {
  const slides = project.slides.map((slide) => ({
    ...slide,
    body: slide.body ? firstSentence(slide.body) : slide.body,
    bullets: slide.bullets.map((b) => ({ ...b, text: truncateWords(b.text, 10) })),
  }));
  const worksheetSections = project.worksheetSections.map((section) => ({
    ...section,
    directions: section.directions ? truncateWords(section.directions, 14) : section.directions,
  }));
  return touch({ ...project, slides, worksheetSections });
}

function addExitTicket(project: TeacherStudioProject): TeacherStudioProject {
  const topic = topicFromProject(project);
  const exitSlide = createSlide({
    type: "summary",
    title: "Exit Ticket",
    bullets: [{ id: crypto.randomUUID(), text: `What's one thing you learned about ${topic} today?` }],
    studentInstructions: "Answer before you leave class today.",
    teacherNotes: "Collect responses as a quick formative check.",
    tags: ["exitTicket"],
    layout: "titleBullets",
  });
  return touch({ ...project, slides: [...project.slides, exitSlide] });
}

function addDiscussionQuestions(project: TeacherStudioProject): TeacherStudioProject {
  const topic = topicFromProject(project);
  const discussionSlide = createSlide({
    type: "discussion",
    title: `Discuss: ${topic}`,
    bullets: [
      `What surprised you about ${topic}?`,
      `How does ${topic} connect to something you already know?`,
      `What questions do you still have about ${topic}?`,
    ].map((text) => ({ id: crypto.randomUUID(), text })),
    studentInstructions: "Discuss with a partner, then share with the class.",
    teacherNotes: "Use think-pair-share or cold-call to surface ideas.",
    layout: "titleBullets",
  });
  return touch({ ...project, slides: [...project.slides, discussionSlide] });
}

function addVocabularySupport(project: TeacherStudioProject): TeacherStudioProject {
  const topic = topicFromProject(project);
  const section = createWorksheetSection({
    title: "Vocabulary Support",
    directions: `Define each key vocabulary term from today's lesson on ${topic} in your own words.`,
    readingLevel: "below",
    questions: [1, 2, 3].map((n) =>
      createWorksheetQuestion({
        prompt: `Vocabulary term ${n}: ___________  Definition: ___________`,
        type: "vocabulary",
      })
    ),
  });
  return touch({ ...project, worksheetSections: [...project.worksheetSections, section] });
}

function lowerReadingLevel(project: TeacherStudioProject): TeacherStudioProject {
  const worksheetSections = project.worksheetSections.map((section) => ({
    ...section,
    readingLevel: "below" as const,
    directions: section.directions ? truncateWords(section.directions, 14) : section.directions,
  }));
  const slides = project.slides.map((slide) => ({
    ...slide,
    bullets: slide.bullets.map((b) => ({ ...b, text: truncateWords(b.text, 12) })),
  }));
  return touch({ ...project, worksheetSections, slides });
}

function addChallengeQuestions(project: TeacherStudioProject): TeacherStudioProject {
  const topic = topicFromProject(project);
  const section = createWorksheetSection({
    title: "Challenge Questions",
    directions: "Extend your thinking. These questions go beyond today's basics.",
    difficulty: "hard",
    questions: [
      `Explain how ${topic} connects to a real-world scenario outside class.`,
      `Make a claim about ${topic} and defend it with at least two reasons.`,
    ].map((prompt) => createWorksheetQuestion({ prompt, type: "constructedResponse", points: 3 })),
  });
  return touch({ ...project, worksheetSections: [...project.worksheetSections, section] });
}

function makePrintable(project: TeacherStudioProject): TeacherStudioProject {
  return touch({ ...project, metadata: { ...project.metadata, printOptimized: true } });
}

function addTeacherNotes(project: TeacherStudioProject): TeacherStudioProject {
  const slides = project.slides.map((slide) =>
    slide.teacherNotes.trim().length > 0
      ? slide
      : {
          ...slide,
          teacherNotes: `Guide students through "${slide.title}." Check for understanding before moving on.`,
        }
  );
  return touch({ ...project, slides });
}

function addImagePlaceholders(project: TeacherStudioProject): TeacherStudioProject {
  const newPlaceholders = [...project.imagePlaceholders];
  const slides = project.slides.map((slide) => {
    if (slide.imagePlaceholderId) return slide;
    const placeholder = createImagePlaceholder({
      description: `A visual related to "${slide.title}"`,
      purpose: "Help students connect this slide to a real example",
      suggestedSearch: `${slide.title} (free-use image)`,
      teacherPrompt: `Paste a link to a real image for "${slide.title}", or ask Comet where to find free-use visuals.`,
    });
    newPlaceholders.push(placeholder);
    return { ...slide, imagePlaceholderId: placeholder.id };
  });
  return touch({ ...project, slides, imagePlaceholders: newPlaceholders });
}

function splitTextHeavySlides(project: TeacherStudioProject): TeacherStudioProject {
  const slides: StudioSlide[] = [];
  for (const slide of project.slides) {
    if (slideWordCount(slide) <= TEXT_HEAVY_WORD_LIMIT || slide.bullets.length < 2) {
      slides.push(slide);
      continue;
    }
    const mid = Math.ceil(slide.bullets.length / 2);
    const firstHalf = { ...slide, bullets: slide.bullets.slice(0, mid) };
    const secondHalf = createSlide({
      type: slide.type,
      title: `${slide.title} (cont.)`,
      bullets: slide.bullets.slice(mid),
      layout: slide.layout,
      timingMinutes: slide.timingMinutes,
      tags: slide.tags,
    });
    slides.push(firstHalf, secondHalf);
  }
  return touch({ ...project, slides });
}

function createStudentVersion(project: TeacherStudioProject): TeacherStudioProject {
  return touch({ ...project, metadata: { ...project.metadata, studentVersionGenerated: true } });
}

function createAnswerKey(project: TeacherStudioProject): TeacherStudioProject {
  const worksheetSections: WorksheetSection[] = project.worksheetSections.map((section) => {
    const answerKey = { ...section.answerKey };
    section.questions.forEach((question) => {
      if (
        (question.type === "multipleChoice" || question.type === "trueFalse") &&
        question.correctAnswer
      ) {
        answerKey[question.id] = question.correctAnswer;
      }
    });
    return { ...section, answerKey };
  });
  return touch({ ...project, worksheetSections });
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  available: boolean;
  apply?: (project: TeacherStudioProject) => TeacherStudioProject;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "shortenIt",
    label: "Shorten it",
    description: "Trims slide bullets and worksheet directions down to the essentials.",
    available: true,
    apply: shortenIt,
  },
  {
    id: "addExitTicket",
    label: "Add exit ticket",
    description: "Adds a closing slide with a quick formative-check prompt.",
    available: true,
    apply: addExitTicket,
  },
  {
    id: "addDiscussionQuestions",
    label: "Add discussion questions",
    description: "Adds a discussion slide with think-pair-share prompts.",
    available: true,
    apply: addDiscussionQuestions,
  },
  {
    id: "addVocabularySupport",
    label: "Add vocabulary support",
    description: "Adds a worksheet section for defining key terms.",
    available: true,
    apply: addVocabularySupport,
  },
  {
    id: "lowerReadingLevel",
    label: "Lower reading level",
    description: "Shortens sentences and flags worksheet sections as below-level.",
    available: true,
    apply: lowerReadingLevel,
  },
  {
    id: "addChallengeQuestions",
    label: "Add challenge questions",
    description: "Adds a harder worksheet section for early finishers.",
    available: true,
    apply: addChallengeQuestions,
  },
  {
    id: "makePrintable",
    label: "Make printable",
    description: "Optimizes the layout for printing or saving as a PDF.",
    available: true,
    apply: makePrintable,
  },
  {
    id: "addTeacherNotes",
    label: "Add teacher notes",
    description: "Fills in a starter teacher note on any slide that's missing one.",
    available: true,
    apply: addTeacherNotes,
  },
  {
    id: "addImagePlaceholders",
    label: "Add image placeholders",
    description: "Adds an image placeholder to any slide that doesn't have one yet.",
    available: true,
    apply: addImagePlaceholders,
  },
  {
    id: "splitTextHeavySlides",
    label: "Split text-heavy slides",
    description: "Breaks slides with too much text into two lighter slides.",
    available: true,
    apply: splitTextHeavySlides,
  },
  {
    id: "createStudentVersion",
    label: "Create student version",
    description: "Marks a student-facing version ready, hiding teacher-only content in preview.",
    available: true,
    apply: createStudentVersion,
  },
  {
    id: "createAnswerKey",
    label: "Create answer key",
    description: "Auto-fills the answer key for multiple choice and true/false questions.",
    available: true,
    apply: createAnswerKey,
  },
  {
    id: "makeMoreRigorous",
    label: "Make more rigorous",
    description: "Coming soon — will raise the cognitive demand of questions and tasks.",
    available: false,
  },
  {
    id: "makeMoreFun",
    label: "Make more fun",
    description: "Coming soon — will add game-like framing to activities.",
    available: false,
  },
  {
    id: "addPartnerActivity",
    label: "Add partner activity",
    description: "Coming soon — will add a structured partner or small-group task.",
    available: false,
  },
  {
    id: "addAccommodations",
    label: "Add accommodations",
    description: "Coming soon — will add accommodation notes for IEP/504 supports.",
    available: false,
  },
  {
    id: "createStudyGuideFromThis",
    label: "Create study guide / quiz from this",
    description: "Coming soon — will spawn a new linked project from this one.",
    available: false,
  },
];

export function getQuickAction(id: string): QuickAction | undefined {
  return QUICK_ACTIONS.find((action) => action.id === id);
}

export function applyQuickAction(
  project: TeacherStudioProject,
  actionId: string
): TeacherStudioProject {
  const action = getQuickAction(actionId);
  if (!action || !action.available || !action.apply) return project;
  return action.apply(project);
}
