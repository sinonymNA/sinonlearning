import { CHECKLIST_DEFINITIONS } from "./studioDefaults";
import type { QualityChecklistItem, StudioSlide, TeacherStudioProject } from "./studioTypes";

const TEXT_HEAVY_WORD_LIMIT = 60;

function wordCount(text: string | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function slideWordCount(slide: StudioSlide): number {
  return (
    wordCount(slide.body) +
    slide.bullets.reduce((sum, bullet) => sum + wordCount(bullet.text), 0)
  );
}

function findManualState(
  existing: QualityChecklistItem[],
  id: string
): boolean {
  return existing.find((item) => item.id === id)?.passed ?? false;
}

export function computeQualityChecklist(
  project: TeacherStudioProject
): QualityChecklistItem[] {
  const existing = project.qualityChecklist ?? [];
  const hasSlides = project.slides.length > 0;
  const hasSections = project.worksheetSections.length > 0;

  const heavySlides = project.slides.filter(
    (slide) => slideWordCount(slide) > TEXT_HEAVY_WORD_LIMIT
  );

  const totalQuestions = project.worksheetSections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );
  const totalAnswerKeyEntries =
    Object.keys(project.answerKey).length +
    project.worksheetSections.reduce(
      (sum, section) => sum + Object.keys(section.answerKey).length,
      0
    );

  const estimatedMinutes = project.slides.reduce(
    (sum, slide) => sum + (slide.timingMinutes ?? 0),
    0
  );
  const timingRealistic =
    estimatedMinutes === 0 ? true : Math.abs(estimatedMinutes - project.durationMinutes) <= 15;

  const results: Record<string, { passed: boolean; autoNote?: string }> = {
    clearObjective: { passed: project.teacherGuide.objectives.length > 0 },
    studentTask: {
      passed:
        hasSlides &&
        project.slides.some((s) => s.studentInstructions.trim().length > 0 || s.type === "activity"),
    },
    assessmentOrExit: {
      passed: hasSections || project.slides.some((s) => s.tags.includes("exitTicket")),
    },
    timingRealistic: {
      passed: timingRealistic,
      autoNote:
        estimatedMinutes > 0
          ? `Slides total ~${estimatedMinutes} min against a ${project.durationMinutes}-min class.`
          : undefined,
    },
    teacherDirections: {
      passed:
        project.teacherGuide.overview.trim().length > 0 ||
        project.slides.some((s) => s.teacherNotes.trim().length > 0),
    },
    imagePlaceholders: {
      passed: project.imagePlaceholders.length > 0,
    },
    notTextHeavy: {
      passed: heavySlides.length === 0,
      autoNote:
        heavySlides.length > 0
          ? `${heavySlides.length} slide(s) exceed ${TEXT_HEAVY_WORD_LIMIT} words.`
          : undefined,
    },
    answerKeyIncluded: {
      passed: totalQuestions === 0 || totalAnswerKeyEntries > 0,
    },
  };

  return CHECKLIST_DEFINITIONS.map((def) => {
    if (!def.computed) {
      return {
        id: def.id,
        label: def.label,
        computed: null,
        passed: findManualState(existing, def.id),
      };
    }
    const result = results[def.id] ?? { passed: false };
    return {
      id: def.id,
      label: def.label,
      computed: true,
      passed: result.passed,
      autoNote: result.autoNote,
    };
  });
}
