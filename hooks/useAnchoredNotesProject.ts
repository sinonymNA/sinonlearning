"use client";

import { useCallback } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { saveAnchoredProject } from "@/lib/anchoredNotesStorage";
import { parseLessonContent } from "@/lib/parseLessonContent";
import { newId } from "@/lib/studioDefaults";
import type {
  AnchoredImageNeed,
  AnchoredNotesBlock,
  AnchoredNotesProject,
  AnchoredNotesSettings,
  AnchoredTemplateStyleId,
} from "@/lib/anchoredNotesTypes";

function projectKey(id: string): string {
  return `anchoredNotes:project:${id}`;
}

type AnchoredMetadata = Partial<
  Pick<AnchoredNotesProject, "title" | "course" | "lessonNumber" | "unit" | "gradeLevel" | "teacherName">
>;

export function useAnchoredNotesProject(projectId: string, initialProject: AnchoredNotesProject) {
  const [project, setProject] = useLocalStorageState<AnchoredNotesProject>(projectKey(projectId), initialProject);

  const mutate = useCallback(
    (updater: (project: AnchoredNotesProject) => AnchoredNotesProject) => {
      setProject((prev) => {
        const finalized: AnchoredNotesProject = { ...updater(prev), updatedAt: Date.now() };
        saveAnchoredProject(finalized);
        return finalized;
      });
    },
    [setProject]
  );

  const setRawContent = useCallback((rawContent: string) => mutate((p) => ({ ...p, rawContent })), [mutate]);

  const setMetadata = useCallback((metadata: AnchoredMetadata) => mutate((p) => ({ ...p, ...metadata })), [mutate]);

  const setTemplateStyle = useCallback(
    (templateStyle: AnchoredTemplateStyleId) => mutate((p) => ({ ...p, templateStyle })),
    [mutate]
  );

  const structureContent = useCallback(() => {
    mutate((p) => {
      const { blocks, imageNeeds } = parseLessonContent(p.rawContent, p.settings.synthesisResponseLines);
      return { ...p, blocks, imageNeeds };
    });
  }, [mutate]);

  const updateBlock = useCallback(
    (blockId: string, patch: Partial<AnchoredNotesBlock>) =>
      mutate((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)) })),
    [mutate]
  );

  const removeBlock = useCallback(
    (blockId: string) => mutate((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== blockId) })),
    [mutate]
  );

  const reorderBlock = useCallback(
    (index: number, direction: "up" | "down") =>
      mutate((p) => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= p.blocks.length) return p;
        const blocks = [...p.blocks];
        [blocks[index], blocks[targetIndex]] = [blocks[targetIndex], blocks[index]];
        return { ...p, blocks };
      }),
    [mutate]
  );

  const updateSettings = useCallback(
    (patch: Partial<AnchoredNotesSettings>) => mutate((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
    [mutate]
  );

  const addImageNeed = useCallback(
    () =>
      mutate((p) => ({
        ...p,
        imageNeeds: [
          ...p.imageNeeds,
          { id: newId(), description: "", suggestedSearch: "", url: null, placement: "inline", status: "needed" },
        ],
      })),
    [mutate]
  );

  const updateImageNeed = useCallback(
    (id: string, patch: Partial<AnchoredImageNeed>) =>
      mutate((p) => ({
        ...p,
        imageNeeds: p.imageNeeds.map((need) =>
          need.id === id
            ? { ...need, ...patch, status: patch.url !== undefined ? (patch.url ? "provided" : "needed") : need.status }
            : need
        ),
      })),
    [mutate]
  );

  const removeImageNeed = useCallback(
    (id: string) => mutate((p) => ({ ...p, imageNeeds: p.imageNeeds.filter((n) => n.id !== id) })),
    [mutate]
  );

  const setGoogleDocUrl = useCallback((url: string | null) => mutate((p) => ({ ...p, googleDocUrl: url })), [mutate]);

  const renameProject = useCallback((title: string) => mutate((p) => ({ ...p, title })), [mutate]);

  return {
    project,
    setRawContent,
    setMetadata,
    setTemplateStyle,
    structureContent,
    updateBlock,
    removeBlock,
    reorderBlock,
    updateSettings,
    addImageNeed,
    updateImageNeed,
    removeImageNeed,
    setGoogleDocUrl,
    renameProject,
  };
}
