import { computeQualityChecklist } from "./studioChecklist";
import {
  createBlankProject,
  createImagePlaceholder,
  createSlide,
  createWorksheetQuestion,
  createWorksheetSection,
  newId,
} from "./studioDefaults";
import type {
  CometBuildAnswers,
  ImagePlaceholder,
  InstructionalStyle,
  SlideType,
  StudioDocType,
  StudioSlide,
  TeachTomorrowInput,
  TeacherGuide,
  TeacherStudioProject,
  WorksheetSection,
} from "./studioTypes";

/**
 * Deterministic, local draft engine — no API call. Slide/section copy is built
 * from fixed template strings interpolated with the teacher's own inputs, never
 * generative prose. This single function backs Build-with-Comet, Teach This
 * Tomorrow, and any template without hand-authored starter content.
 */

const STYLE_SEQUENCES: Record<InstructionalStyle, SlideType[]> = {
  direct: ["title", "content", "content", "activity", "summary"],
  inquiry: ["title", "discussion", "content", "activity", "discussion", "summary"],
  gameBased: ["title", "content", "activity", "activity", "summary"],
  discussion: ["title", "discussion", "discussion", "summary"],
  project: ["title", "content", "activity", "activity", "summary"],
  balanced: ["title", "content", "activity", "summary"],
};

const SLIDES_ONLY_TYPES: StudioDocType[] = ["slides", "poster"];
const WORKSHEET_ONLY_TYPES: StudioDocType[] = [
  "worksheet",
  "studyGuide",
  "assessment",
  "exitTicket",
  "studentHandout",
  "guidedNotes",
];

interface NormalizedInput {
  topic: string;
  subject: string;
  gradeLevel: string;
  classMinutes: number;
  outputType: StudioDocType;
  instructionalStyle: InstructionalStyle;
  creationMode: "comet" | "scratch";
}

function isCometAnswers(
  input: CometBuildAnswers | TeachTomorrowInput
): input is CometBuildAnswers {
  return "instructionalStyle" in input;
}

function normalizeInput(input: CometBuildAnswers | TeachTomorrowInput): NormalizedInput {
  if (isCometAnswers(input)) {
    return {
      topic: input.topic,
      subject: input.subject,
      gradeLevel: input.gradeLevel,
      classMinutes: input.classMinutes,
      outputType: input.outputType,
      instructionalStyle: input.instructionalStyle,
      creationMode: "comet",
    };
  }
  return {
    topic: input.topic,
    subject: "",
    gradeLevel: input.gradeLevel,
    classMinutes: input.classMinutes,
    outputType: input.outputType,
    instructionalStyle: "balanced",
    creationMode: "scratch",
  };
}

function shouldIncludeSlides(type: StudioDocType): boolean {
  return !WORKSHEET_ONLY_TYPES.includes(type);
}

function shouldIncludeWorksheet(type: StudioDocType): boolean {
  return !SLIDES_ONLY_TYPES.includes(type);
}

interface SlideContent {
  title: string;
  subtitle?: string;
  bullets: string[];
  studentInstructions: string;
  teacherNotes: string;
}

function slideContent(type: SlideType, topic: string): SlideContent {
  switch (type) {
    case "title":
      return {
        title: topic,
        subtitle: "Today's Lesson",
        bullets: [],
        studentInstructions: "",
        teacherNotes: "Welcome students and share today's objective.",
      };
    case "content":
      return {
        title: `${topic}: Key Ideas`,
        bullets: [`What is ${topic}?`, `Why ${topic} matters`, `Key vocabulary for ${topic}`],
        studentInstructions: "Follow along and take notes on the key ideas.",
        teacherNotes: "Pace this section with checks for understanding.",
      };
    case "discussion":
      return {
        title: `Discuss: ${topic}`,
        bullets: [
          `What do you already know about ${topic}?`,
          `Why might ${topic} matter to you?`,
        ],
        studentInstructions: "Discuss with a partner, then share with the class.",
        teacherNotes: "Cold-call or use think-pair-share to surface ideas.",
      };
    case "activity":
      return {
        title: `Let's Practice: ${topic}`,
        bullets: [`Apply what you've learned about ${topic}`, "Work independently or with a partner"],
        studentInstructions: `Complete the practice task on ${topic}.`,
        teacherNotes: "Circulate and support students as needed.",
      };
    case "image":
      return {
        title: `${topic}: Visual`,
        bullets: [],
        studentInstructions: "Examine the image and answer the prompt.",
        teacherNotes: "Use the image placeholder to source a real visual.",
      };
    case "summary":
      return {
        title: "Wrap-Up",
        bullets: [`What's one thing you learned about ${topic} today?`],
        studentInstructions: "Respond to the exit prompt before you leave.",
        teacherNotes: "Collect responses as a quick formative check.",
      };
  }
}

function buildSlides(
  topic: string,
  classMinutes: number,
  instructionalStyle: InstructionalStyle
): StudioSlide[] {
  const sequence = STYLE_SEQUENCES[instructionalStyle];
  const perSlideMinutes = Math.max(3, Math.round(classMinutes / sequence.length));
  return sequence.map((type) => {
    const content = slideContent(type, topic);
    return createSlide({
      type,
      title: content.title,
      subtitle: content.subtitle,
      bullets: content.bullets.map((text) => ({ id: newId(), text })),
      studentInstructions: content.studentInstructions,
      teacherNotes: content.teacherNotes,
      timingMinutes: perSlideMinutes,
      layout: content.bullets.length > 0 ? "titleBullets" : "titleOnly",
    });
  });
}

function buildWorksheetSection(topic: string, outputType: StudioDocType): WorksheetSection {
  const isAssessment = outputType === "assessment";
  const isExitTicket = outputType === "exitTicket";

  if (isExitTicket) {
    return createWorksheetSection({
      title: "Exit Ticket",
      directions: "Answer before you leave class today.",
      questions: [
        createWorksheetQuestion({
          prompt: `What's one thing you learned about ${topic} today?`,
          type: "shortAnswer",
          points: 1,
        }),
      ],
    });
  }

  if (isAssessment) {
    const mcQuestion = createWorksheetQuestion({
      prompt: `Which best describes ${topic}?`,
      type: "multipleChoice",
      choices: [
        `A concept directly related to ${topic}`,
        "An unrelated idea",
        "None of the above",
        "All of the above",
      ],
      correctAnswer: `A concept directly related to ${topic}`,
      points: 1,
    });
    const tfQuestion = createWorksheetQuestion({
      prompt: `${topic} is relevant to this unit. True or False?`,
      type: "trueFalse",
      correctAnswer: "True",
      points: 1,
    });
    const shortAnswer = createWorksheetQuestion({
      prompt: `Explain ${topic} in your own words.`,
      type: "shortAnswer",
      points: 2,
    });
    return createWorksheetSection({
      title: "Quick Check Quiz",
      directions: "Answer each question. Show your thinking where asked.",
      questions: [mcQuestion, tfQuestion, shortAnswer],
      answerKey: {
        [mcQuestion.id]: mcQuestion.correctAnswer ?? "",
        [tfQuestion.id]: tfQuestion.correctAnswer ?? "",
      },
    });
  }

  const questions = [
    `In your own words, explain ${topic}.`,
    `Give one example related to ${topic}.`,
    `Why does ${topic} matter?`,
  ].map((prompt) => createWorksheetQuestion({ prompt, type: "shortAnswer", points: 1 }));

  return createWorksheetSection({
    title: `${topic} Practice`,
    directions: "Answer each question in complete sentences.",
    questions,
  });
}

function buildTeacherGuide(topic: string, classMinutes: number): TeacherGuide {
  return {
    overview: `This ${classMinutes}-minute lesson introduces students to ${topic}.`,
    objectives: [`Students will be able to explain ${topic} and apply it to a real example.`],
    materials: ["Slide deck or worksheet", "Student notebooks"],
    timingNotes: `Plan roughly ${Math.max(5, Math.round(classMinutes / 5))} minutes per section.`,
  };
}

function buildImagePlaceholder(topic: string): ImagePlaceholder {
  return createImagePlaceholder({
    description: `A visual related to ${topic}`,
    purpose: "Help students connect the topic to a real example",
    suggestedSearch: `${topic} (free-use image)`,
    teacherPrompt: `This would work well with a real image related to ${topic}. Paste a link, or ask Comet where to find free-use visuals.`,
  });
}

export function generateProjectDraft(
  input: CometBuildAnswers | TeachTomorrowInput
): TeacherStudioProject {
  const normalized = normalizeInput(input);
  const { topic, subject, gradeLevel, classMinutes, outputType, instructionalStyle, creationMode } =
    normalized;
  const safeTopic = topic.trim() || "Today's Topic";

  const project = createBlankProject(outputType, {
    title: topic.trim() ? `${topic.trim()} Lesson` : "Untitled Project",
    subject,
    gradeLevel,
    durationMinutes: classMinutes || 50,
    teachingStyle: instructionalStyle,
    creationMode,
  });

  if (shouldIncludeSlides(outputType)) {
    project.slides = buildSlides(safeTopic, project.durationMinutes, instructionalStyle);
  }

  if (shouldIncludeWorksheet(outputType)) {
    project.worksheetSections = [buildWorksheetSection(safeTopic, outputType)];
  }

  project.teacherGuide = buildTeacherGuide(safeTopic, project.durationMinutes);

  const placeholder = buildImagePlaceholder(safeTopic);
  project.imagePlaceholders = [placeholder];
  const firstContentSlide = project.slides.find((slide) => slide.type === "content");
  if (firstContentSlide) {
    firstContentSlide.imagePlaceholderId = placeholder.id;
  }

  project.qualityChecklist = computeQualityChecklist(project);
  return project;
}
