import type {
  FreeformShapeElement,
  FreeformTextElement,
  ImagePlaceholder,
  QualityChecklistItem,
  StudioDocType,
  StudioSlide,
  TeacherStudioProject,
  WorksheetQuestion,
  WorksheetSection,
} from "./studioTypes";

export function newId(): string {
  return crypto.randomUUID();
}

export const CHECKLIST_DEFINITIONS: { id: string; label: string; computed: boolean }[] = [
  { id: "clearObjective", label: "Clear objective", computed: true },
  { id: "studentTask", label: "Student task included", computed: true },
  { id: "assessmentOrExit", label: "Assessment or exit ticket included", computed: true },
  { id: "timingRealistic", label: "Timing feels realistic", computed: true },
  { id: "teacherDirections", label: "Teacher directions included", computed: true },
  { id: "imagePlaceholders", label: "Image placeholders added where useful", computed: true },
  { id: "worksheetMatchesLesson", label: "Worksheet matches lesson", computed: false },
  { id: "exitTicketMatchesObjective", label: "Exit ticket matches objective", computed: false },
  { id: "notTextHeavy", label: "Not too much text per slide", computed: true },
  { id: "answerKeyIncluded", label: "Answer key included when needed", computed: true },
  { id: "teacherInControl", label: "Teacher remains in control", computed: false },
];

export function createDefaultChecklist(): QualityChecklistItem[] {
  return CHECKLIST_DEFINITIONS.map((def) => ({
    id: def.id,
    label: def.label,
    computed: def.computed ? false : null,
    passed: false,
  }));
}

export function createSlide(overrides: Partial<StudioSlide> = {}): StudioSlide {
  return {
    id: newId(),
    type: "content",
    title: "New Slide",
    bullets: [],
    teacherNotes: "",
    studentInstructions: "",
    layout: "titleBullets",
    tags: [],
    extraElements: [],
    ...overrides,
  };
}

export function createFreeformTextElement(
  overrides: Partial<FreeformTextElement> = {}
): FreeformTextElement {
  return {
    id: newId(),
    kind: "text",
    text: "New text",
    x: 20,
    y: 40,
    width: 50,
    height: 16,
    z: 3,
    ...overrides,
  };
}

export function createFreeformShapeElement(
  overrides: Partial<FreeformShapeElement> = {}
): FreeformShapeElement {
  return {
    id: newId(),
    kind: "shape",
    shapeType: "rectangle",
    color: "#5eead4",
    x: 30,
    y: 35,
    width: 30,
    height: 24,
    z: 3,
    ...overrides,
  };
}

export function createWorksheetQuestion(
  overrides: Partial<WorksheetQuestion> = {}
): WorksheetQuestion {
  return {
    id: newId(),
    prompt: "",
    type: "shortAnswer",
    ...overrides,
  };
}

export function createWorksheetSection(
  overrides: Partial<WorksheetSection> = {}
): WorksheetSection {
  return {
    id: newId(),
    title: "New Section",
    directions: "",
    questions: [],
    responseSpaceLines: 3,
    answerKey: {},
    difficulty: "medium",
    readingLevel: "onLevel",
    ...overrides,
  };
}

export function createImagePlaceholder(
  overrides: Partial<ImagePlaceholder> = {}
): ImagePlaceholder {
  return {
    id: newId(),
    description: "",
    purpose: "",
    suggestedSearch: "",
    teacherPrompt: "",
    link: null,
    uploadPending: true,
    ...overrides,
  };
}

export function createBlankProject(
  type: StudioDocType,
  overrides: Partial<TeacherStudioProject> = {}
): TeacherStudioProject {
  const now = overrides.createdAt ?? Date.now();
  return {
    id: newId(),
    title: "Untitled Project",
    type,
    subject: "",
    gradeLevel: "",
    durationMinutes: 50,
    teachingStyle: "balanced",
    createdAt: now,
    updatedAt: now,
    creationMode: "scratch",
    slides: [],
    worksheetSections: [],
    teacherGuide: { overview: "", objectives: [], materials: [], timingNotes: "" },
    answerKey: {},
    imagePlaceholders: [],
    qualityChecklist: createDefaultChecklist(),
    metadata: { wordCountTotal: 0 },
    ...overrides,
  };
}
