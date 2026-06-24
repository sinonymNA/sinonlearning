"use client";

import { useCallback } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { computeQualityChecklist } from "@/lib/studioChecklist";
import {
  createImagePlaceholder,
  createSlide,
  createWorksheetSection,
  newId,
} from "@/lib/studioDefaults";
import { duplicateProject, saveProject } from "@/lib/studioStorage";
import { applyQuickAction } from "@/lib/studioTransforms";
import type {
  ImagePlaceholder,
  SlideType,
  StudioSlide,
  TeacherGuide,
  TeacherStudioProject,
  WorksheetSection,
} from "@/lib/studioTypes";
import type { CometEditOutcome } from "@/lib/cometEditValidation";

function projectKey(id: string): string {
  return `studio:project:${id}`;
}

function moveItem<T>(items: T[], index: number, direction: "up" | "down"): T[] {
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

/** Drag-and-drop reorder: drops before `toIndex` as measured in the original array. */
function moveItemToIndex<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  const insertAt = Math.max(0, Math.min(fromIndex < toIndex ? toIndex - 1 : toIndex, next.length));
  next.splice(insertAt, 0, moved);
  return next;
}

export function useStudioProject(projectId: string, initialProject: TeacherStudioProject) {
  const [project, setProject] = useLocalStorageState<TeacherStudioProject>(
    projectKey(projectId),
    initialProject
  );

  const mutate = useCallback(
    (updater: (project: TeacherStudioProject) => TeacherStudioProject) => {
      setProject((prev) => {
        const updated = updater(prev);
        const finalized: TeacherStudioProject = {
          ...updated,
          updatedAt: Date.now(),
        };
        finalized.qualityChecklist = computeQualityChecklist(finalized);
        saveProject(finalized);
        return finalized;
      });
    },
    [setProject]
  );

  const updateMeta = useCallback(
    (patch: Partial<
      Pick<
        TeacherStudioProject,
        "title" | "subject" | "gradeLevel" | "durationMinutes" | "standard" | "teachingStyle"
      >
    >) => mutate((p) => ({ ...p, ...patch })),
    [mutate]
  );

  const renameProject = useCallback((title: string) => updateMeta({ title }), [updateMeta]);

  const updateTeacherGuide = useCallback(
    (patch: Partial<TeacherGuide>) =>
      mutate((p) => ({ ...p, teacherGuide: { ...p.teacherGuide, ...patch } })),
    [mutate]
  );

  const addSlide = useCallback(
    (type: SlideType = "content", index?: number) => {
      mutate((p) => {
        const slide = createSlide({ type });
        const slides = [...p.slides];
        const insertAt = index ?? slides.length;
        slides.splice(insertAt, 0, slide);
        return { ...p, slides };
      });
    },
    [mutate]
  );

  const updateSlide = useCallback(
    (slideId: string, patch: Partial<StudioSlide>) => {
      mutate((p) => ({
        ...p,
        slides: p.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s)),
      }));
    },
    [mutate]
  );

  const removeSlide = useCallback(
    (slideId: string) => {
      mutate((p) => ({ ...p, slides: p.slides.filter((s) => s.id !== slideId) }));
    },
    [mutate]
  );

  const duplicateSlide = useCallback(
    (slideId: string) => {
      mutate((p) => {
        const index = p.slides.findIndex((s) => s.id === slideId);
        if (index === -1) return p;
        const original = p.slides[index];
        const copy: StudioSlide = {
          ...original,
          id: newId(),
          bullets: original.bullets.map((b) => ({ ...b, id: newId() })),
        };
        const slides = [...p.slides];
        slides.splice(index + 1, 0, copy);
        return { ...p, slides };
      });
    },
    [mutate]
  );

  const reorderSlide = useCallback(
    (slideId: string, direction: "up" | "down") => {
      mutate((p) => {
        const index = p.slides.findIndex((s) => s.id === slideId);
        if (index === -1) return p;
        return { ...p, slides: moveItem(p.slides, index, direction) };
      });
    },
    [mutate]
  );

  const reorderSlideTo = useCallback(
    (slideId: string, toIndex: number) => {
      mutate((p) => {
        const index = p.slides.findIndex((s) => s.id === slideId);
        if (index === -1) return p;
        return { ...p, slides: moveItemToIndex(p.slides, index, toIndex) };
      });
    },
    [mutate]
  );

  const addSection = useCallback(
    (initial: Partial<WorksheetSection> = {}) => {
      mutate((p) => ({
        ...p,
        worksheetSections: [...p.worksheetSections, createWorksheetSection(initial)],
      }));
    },
    [mutate]
  );

  const updateSection = useCallback(
    (sectionId: string, patch: Partial<WorksheetSection>) => {
      mutate((p) => ({
        ...p,
        worksheetSections: p.worksheetSections.map((s) =>
          s.id === sectionId ? { ...s, ...patch } : s
        ),
      }));
    },
    [mutate]
  );

  const removeSection = useCallback(
    (sectionId: string) => {
      mutate((p) => ({
        ...p,
        worksheetSections: p.worksheetSections.filter((s) => s.id !== sectionId),
      }));
    },
    [mutate]
  );

  const duplicateSection = useCallback(
    (sectionId: string) => {
      mutate((p) => {
        const index = p.worksheetSections.findIndex((s) => s.id === sectionId);
        if (index === -1) return p;
        const original = p.worksheetSections[index];
        const idMap = new Map<string, string>();
        const questions = original.questions.map((q) => {
          const id = newId();
          idMap.set(q.id, id);
          return { ...q, id };
        });
        const answerKey: Record<string, string> = {};
        Object.entries(original.answerKey).forEach(([qId, answer]) => {
          answerKey[idMap.get(qId) ?? qId] = answer;
        });
        const copy: WorksheetSection = { ...original, id: newId(), questions, answerKey };
        const worksheetSections = [...p.worksheetSections];
        worksheetSections.splice(index + 1, 0, copy);
        return { ...p, worksheetSections };
      });
    },
    [mutate]
  );

  const reorderSection = useCallback(
    (sectionId: string, direction: "up" | "down") => {
      mutate((p) => {
        const index = p.worksheetSections.findIndex((s) => s.id === sectionId);
        if (index === -1) return p;
        return { ...p, worksheetSections: moveItem(p.worksheetSections, index, direction) };
      });
    },
    [mutate]
  );

  const reorderSectionTo = useCallback(
    (sectionId: string, toIndex: number) => {
      mutate((p) => {
        const index = p.worksheetSections.findIndex((s) => s.id === sectionId);
        if (index === -1) return p;
        return { ...p, worksheetSections: moveItemToIndex(p.worksheetSections, index, toIndex) };
      });
    },
    [mutate]
  );

  const addImagePlaceholder = useCallback(
    (overrides: Partial<ImagePlaceholder> = {}, slideId?: string) => {
      mutate((p) => {
        const placeholder = createImagePlaceholder(overrides);
        return {
          ...p,
          imagePlaceholders: [...p.imagePlaceholders, placeholder],
          slides: slideId
            ? p.slides.map((s) => (s.id === slideId ? { ...s, imagePlaceholderId: placeholder.id } : s))
            : p.slides,
        };
      });
    },
    [mutate]
  );

  const updateImagePlaceholder = useCallback(
    (placeholderId: string, patch: Partial<ImagePlaceholder>) => {
      mutate((p) => ({
        ...p,
        imagePlaceholders: p.imagePlaceholders.map((ph) =>
          ph.id === placeholderId ? { ...ph, ...patch } : ph
        ),
      }));
    },
    [mutate]
  );

  const removeImagePlaceholder = useCallback(
    (placeholderId: string) => {
      mutate((p) => ({
        ...p,
        imagePlaceholders: p.imagePlaceholders.filter((ph) => ph.id !== placeholderId),
        slides: p.slides.map((s) =>
          s.imagePlaceholderId === placeholderId ? { ...s, imagePlaceholderId: null } : s
        ),
      }));
    },
    [mutate]
  );

  const setChecklistItemPassed = useCallback(
    (itemId: string, passed: boolean) => {
      mutate((p) => ({
        ...p,
        qualityChecklist: p.qualityChecklist.map((item) =>
          item.id === itemId ? { ...item, passed } : item
        ),
      }));
    },
    [mutate]
  );

  const applyTransform = useCallback(
    (actionId: string) => {
      mutate((p) => applyQuickAction(p, actionId));
    },
    [mutate]
  );

  const applyCometEdit = useCallback(
    (edit: CometEditOutcome) => {
      mutate((p) => ({
        ...p,
        slides: edit.slides,
        worksheetSections: edit.worksheetSections,
        teacherGuide: edit.teacherGuide,
      }));
    },
    [mutate]
  );

  const saveAs = useCallback(() => {
    saveProject(project);
    return duplicateProject(project.id);
  }, [project]);

  return {
    project,
    updateMeta,
    renameProject,
    updateTeacherGuide,
    addSlide,
    updateSlide,
    removeSlide,
    duplicateSlide,
    reorderSlide,
    reorderSlideTo,
    addSection,
    updateSection,
    removeSection,
    duplicateSection,
    reorderSection,
    reorderSectionTo,
    addImagePlaceholder,
    updateImagePlaceholder,
    removeImagePlaceholder,
    setChecklistItemPassed,
    applyTransform,
    applyCometEdit,
    saveAs,
  };
}
