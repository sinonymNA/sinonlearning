import { newId } from "./studioDefaults";
import type { AnchoredNotesProject, AnchoredNotesSettings } from "./anchoredNotesTypes";

export function createDefaultAnchoredSettings(): AnchoredNotesSettings {
  return {
    density: "spacious",
    includeNameLine: true,
    includeCourseHeader: true,
    includeEssentialQuestionBox: true,
    includeImagePlaceholders: true,
    includeOutsideInfoBank: true,
    includeAnswerKeyPlaceholder: false,
    synthesisResponseLines: 6,
    tableRowHeight: "normal",
    pageSize: "letter",
  };
}

export function createBlankAnchoredProject(overrides: Partial<AnchoredNotesProject> = {}): AnchoredNotesProject {
  const now = overrides.createdAt ?? Date.now();
  return {
    id: newId(),
    title: "Untitled Anchored Notes",
    course: "",
    lessonNumber: "",
    unit: "",
    gradeLevel: "",
    teacherName: "",
    templateStyle: "apwhAnchoredNotes",
    rawContent: "",
    blocks: [],
    imageNeeds: [],
    settings: createDefaultAnchoredSettings(),
    createdAt: now,
    updatedAt: now,
    googleDocUrl: null,
    ...overrides,
  };
}
