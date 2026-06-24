export type StudioDocType =
  | "slides"
  | "worksheet"
  | "lesson"
  | "guidedNotes"
  | "activity"
  | "assessment"
  | "exitTicket"
  | "studyGuide"
  | "teacherGuide"
  | "studentHandout"
  | "substitutePlan"
  | "poster"
  | "discussion"
  | "simulation"
  | "mixed";

export const STUDIO_DOC_TYPES: { value: StudioDocType; label: string }[] = [
  { value: "slides", label: "Slide Deck" },
  { value: "worksheet", label: "Worksheet" },
  { value: "lesson", label: "Full Lesson" },
  { value: "guidedNotes", label: "Guided Notes" },
  { value: "activity", label: "Activity" },
  { value: "assessment", label: "Assessment / Quiz" },
  { value: "exitTicket", label: "Exit Ticket" },
  { value: "studyGuide", label: "Study Guide" },
  { value: "teacherGuide", label: "Teacher Guide" },
  { value: "studentHandout", label: "Student Handout" },
  { value: "substitutePlan", label: "Substitute Plan" },
  { value: "poster", label: "Classroom Poster" },
  { value: "discussion", label: "Discussion / Debate" },
  { value: "simulation", label: "Simulation Plan" },
  { value: "mixed", label: "Mixed Packet" },
];

export type CreationMode = "scratch" | "template" | "comet";

export type PrimaryActivity =
  | "learn"
  | "practice"
  | "discuss"
  | "analyze"
  | "simulate"
  | "review"
  | "apply";

export type InstructionalStyle =
  | "direct"
  | "inquiry"
  | "gameBased"
  | "discussion"
  | "project"
  | "balanced";

export type PreviewAudience = "teacher" | "student";

export type SlideType =
  | "title"
  | "content"
  | "image"
  | "activity"
  | "discussion"
  | "summary";

export type SlideLayout =
  | "titleOnly"
  | "titleBody"
  | "titleBullets"
  | "twoColumn"
  | "imageFocus";

export interface SlideBullet {
  id: string;
  text: string;
}

/** A percentage-based box (0-100), resolution-independent so it scales with any slide frame size. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The two slide regions a teacher can drag/resize on the freeform canvas. */
export type SlideElementRole = "content" | "image";

export type FreeformShapeKind = "rectangle" | "ellipse";

export interface FreeformTextElement extends Rect {
  id: string;
  kind: "text";
  text: string;
  align?: "left" | "center" | "right";
  z: number;
}

export interface FreeformShapeElement extends Rect {
  id: string;
  kind: "shape";
  shapeType: FreeformShapeKind;
  color: string;
  z: number;
}

export type FreeformElement = FreeformTextElement | FreeformShapeElement;

export interface StudioSlide {
  id: string;
  type: SlideType;
  title: string;
  subtitle?: string;
  body?: string;
  bullets: SlideBullet[];
  teacherNotes: string;
  studentInstructions: string;
  imagePlaceholderId?: string | null;
  timingMinutes?: number;
  layout: SlideLayout;
  tags: string[];
  /** Freeform position/size overrides for the content block and image, dragged/resized on the canvas. Defaults (derived from `layout`) apply when absent. */
  layoutOverrides?: Partial<Record<SlideElementRole, Rect>>;
  /** Freestanding text boxes and shapes added directly on the canvas — content with no legacy-field equivalent. */
  extraElements?: FreeformElement[];
}

export type WorksheetQuestionType =
  | "shortAnswer"
  | "multipleChoice"
  | "trueFalse"
  | "vocabulary"
  | "constructedResponse";

export interface WorksheetQuestion {
  id: string;
  prompt: string;
  type: WorksheetQuestionType;
  choices?: string[];
  correctAnswer?: string;
  points?: number;
}

export type WorksheetDifficulty = "easy" | "medium" | "hard";
export type ReadingLevel = "below" | "onLevel" | "above";

export interface WorksheetSection {
  id: string;
  title: string;
  directions: string;
  questions: WorksheetQuestion[];
  responseSpaceLines: number;
  answerKey: Record<string, string>;
  difficulty: WorksheetDifficulty;
  readingLevel: ReadingLevel;
}

export interface ImagePlaceholder {
  id: string;
  description: string;
  purpose: string;
  suggestedSearch: string;
  teacherPrompt: string;
  link: string | null;
  uploadPending: boolean;
}

export interface QualityChecklistItem {
  id: string;
  label: string;
  computed: boolean | null;
  passed: boolean;
  autoNote?: string;
}

export interface TeacherGuide {
  overview: string;
  objectives: string[];
  materials: string[];
  timingNotes: string;
}

export interface TeacherStudioProject {
  id: string;
  title: string;
  type: StudioDocType;
  subject: string;
  gradeLevel: string;
  durationMinutes: number;
  standard?: string;
  teachingStyle: InstructionalStyle;
  createdAt: number;
  updatedAt: number;
  creationMode: CreationMode;
  templateId?: string;

  slides: StudioSlide[];
  worksheetSections: WorksheetSection[];
  teacherGuide: TeacherGuide;
  answerKey: Record<string, string>;
  imagePlaceholders: ImagePlaceholder[];
  qualityChecklist: QualityChecklistItem[];

  metadata: {
    wordCountTotal: number;
    lastExportedAt?: number;
    printOptimized?: boolean;
    studentVersionGenerated?: boolean;
  };
}

export interface StudioIndexEntry {
  id: string;
  title: string;
  type: StudioDocType;
  updatedAt: number;
}

export interface CometBuildAnswers {
  topic: string;
  subject: string;
  gradeLevel: string;
  classMinutes: number;
  primaryActivity: PrimaryActivity;
  outputType: StudioDocType;
  instructionalStyle: InstructionalStyle;
}

export interface TeachTomorrowInput {
  topic: string;
  gradeLevel: string;
  classMinutes: number;
  outputType: StudioDocType;
}
