/**
 * Anchored Notes: the "paste content, choose a template, generate a polished Google
 * Doc" flow. Deliberately a separate type system from studioTypes.ts (slides/worksheet/
 * teacher guide) — names like `TeacherStudioProject`/`ImagePlaceholder` already exist
 * there with different shapes, and this feature has a different editing model
 * (paste-and-structure, not direct block authoring).
 */

export type AnchoredBlockType =
  | "header"
  | "title"
  | "essentialQuestion"
  | "warmupBox"
  | "sectionHeading"
  | "guidedParagraph"
  | "numberedList"
  | "table"
  | "responseBox"
  | "imagePlaceholder"
  | "synthesisPrompt"
  | "outsideInfoBank"
  | "callout"
  | "divider";

export interface AnchoredTableData {
  headers: string[];
  rows: string[][];
}

export interface AnchoredNotesBlock {
  id: string;
  type: AnchoredBlockType;
  /** Whether this block renders in the preview/export. Teachers can toggle blocks off. */
  include: boolean;
  title?: string;
  /** Plain text content; blank lines for guided notes are preserved as literal underscores. */
  content?: string;
  items?: string[];
  table?: AnchoredTableData;
  responseLines?: number;
  imageNeedId?: string;
}

export type AnchoredImagePlacement = "inline" | "fullWidth" | "sideBySide";
export type AnchoredImageStatus = "needed" | "provided";

export interface AnchoredImageNeed {
  id: string;
  description: string;
  suggestedSearch: string;
  url: string | null;
  placement: AnchoredImagePlacement;
  status: AnchoredImageStatus;
}

export type AnchoredTemplateStyleId =
  | "apwhAnchoredNotes"
  | "cleanPrintable"
  | "modernHandout"
  | "boxedNotes";

export interface AnchoredNotesSettings {
  density: "compact" | "spacious";
  includeNameLine: boolean;
  includeCourseHeader: boolean;
  includeEssentialQuestionBox: boolean;
  includeImagePlaceholders: boolean;
  includeOutsideInfoBank: boolean;
  includeAnswerKeyPlaceholder: boolean;
  synthesisResponseLines: number;
  tableRowHeight: "compact" | "normal" | "large";
  pageSize: "letter";
}

export interface AnchoredNotesProject {
  id: string;
  title: string;
  course: string;
  lessonNumber: string;
  unit: string;
  gradeLevel: string;
  teacherName: string;
  templateStyle: AnchoredTemplateStyleId;
  rawContent: string;
  blocks: AnchoredNotesBlock[];
  imageNeeds: AnchoredImageNeed[];
  settings: AnchoredNotesSettings;
  createdAt: number;
  updatedAt: number;
  googleDocUrl?: string | null;
}

export interface AnchoredNotesIndexEntry {
  id: string;
  title: string;
  updatedAt: number;
}

export const ANCHORED_TEMPLATE_OPTIONS: { value: AnchoredTemplateStyleId; label: string; description: string }[] = [
  {
    value: "apwhAnchoredNotes",
    label: "APWH Anchored Notes",
    description: "Boxed prompts, guided blanks, and a name/course header — modeled on AP-style handouts.",
  },
  {
    value: "cleanPrintable",
    label: "Clean Printable Notes",
    description: "Minimal borders, generous whitespace, easy on the toner.",
  },
  {
    value: "modernHandout",
    label: "Modern Handout",
    description: "Rounded section cards with a soft accent color.",
  },
  {
    value: "boxedNotes",
    label: "Boxed Notes",
    description: "Every section lives inside its own bordered box — high structure, easy to scan.",
  },
];
