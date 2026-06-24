"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import StudioTopBar from "./StudioTopBar";
import DocPage from "./DocPage";
import WorksheetPreview from "./WorksheetPreview";
import TeacherGuidePreview from "./TeacherGuidePreview";
import CometDock from "./CometDock";
import type { CometEditOutcome } from "@/lib/cometEditValidation";
import type {
  PreviewAudience,
  TeacherGuide,
  TeacherStudioProject,
  WorksheetSection,
} from "@/lib/studioTypes";

export type DocTarget = "worksheet" | "guide";

interface DocsEditorProps {
  project: TeacherStudioProject;
  target: DocTarget;
  audience: PreviewAudience;
  onAudienceChange: (audience: PreviewAudience) => void;
  onBack: () => void;
  onRename: (title: string) => void;
  onUpdateMeta: (patch: Partial<Pick<TeacherStudioProject, "subject" | "gradeLevel" | "durationMinutes">>) => void;
  onOpenExport: () => void;
  onDuplicate: () => void;
  onChangeSection: (sectionId: string, patch: Partial<WorksheetSection>) => void;
  onAddSection: () => void;
  onRemoveSection: (sectionId: string) => void;
  onDuplicateSection: (sectionId: string) => void;
  onReorderSection: (sectionId: string, direction: "up" | "down") => void;
  onReorderSectionTo: (sectionId: string, toIndex: number) => void;
  onChangeGuide: (patch: Partial<TeacherGuide>) => void;
  onApplyQuickAction: (actionId: string) => void;
  onApplyCometEdit: (edit: CometEditOutcome) => void;
  onToggleChecklistItem: (itemId: string, passed: boolean) => void;
}

export default function DocsEditor({
  project,
  target,
  audience,
  onAudienceChange,
  onBack,
  onRename,
  onUpdateMeta,
  onOpenExport,
  onDuplicate,
  onChangeSection,
  onAddSection,
  onRemoveSection,
  onDuplicateSection,
  onReorderSection,
  onReorderSectionTo,
  onChangeGuide,
  onApplyQuickAction,
  onApplyCometEdit,
  onToggleChecklistItem,
}: DocsEditorProps) {
  const sections = project.worksheetSections;

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => () => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || index === draggedIndex) return;
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    onReorderSectionTo(sections[draggedIndex].id, index);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex h-screen flex-col bg-studio-canvas">
      <StudioTopBar
        project={project}
        audience={audience}
        onAudienceChange={onAudienceChange}
        onRename={onRename}
        onUpdateMeta={onUpdateMeta}
        onOpenExport={onOpenExport}
        onDuplicate={onDuplicate}
        onBack={onBack}
        backLabel="Back to project"
        compact
        contextLabel={target === "worksheet" ? "Worksheet" : "Teacher Guide"}
      />

      <div className="flex-1 overflow-y-auto px-4 py-10 sm:py-14">
        {target === "guide" ? (
          <TeacherGuidePreview guide={project.teacherGuide} onChange={onChangeGuide} />
        ) : (
          <DocPage>
            {sections.map((section, index) => (
              <div
                key={section.id}
                onDragOver={handleDragOver(index)}
                onDrop={handleDrop(index)}
                className={`relative ${index > 0 ? "mt-10 border-t border-navy-900/8 pt-10" : ""} ${
                  draggedIndex === index ? "opacity-40" : ""
                } ${
                  dragOverIndex === index && draggedIndex !== null && draggedIndex !== index
                    ? "border-t-2 border-t-teal-500 pt-[39px]"
                    : ""
                }`}
              >
                <div className="mb-2 flex items-center justify-end gap-0.5 text-navy-700/35">
                  <span
                    draggable
                    onDragStart={handleDragStart(index)}
                    onDragEnd={handleDragEnd}
                    aria-label="Drag to reorder section"
                    title="Drag to reorder"
                    className="flex h-6 w-6 cursor-grab items-center justify-center active:cursor-grabbing"
                  >
                    <GripVertical size={13} />
                  </span>
                  <button
                    type="button"
                    onClick={() => onReorderSection(section.id, "up")}
                    disabled={index === 0}
                    aria-label="Move section up"
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-navy-900/5 hover:text-navy-700/70 disabled:opacity-25"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onReorderSection(section.id, "down")}
                    disabled={index === sections.length - 1}
                    aria-label="Move section down"
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-navy-900/5 hover:text-navy-700/70 disabled:opacity-25"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateSection(section.id)}
                    aria-label="Duplicate section"
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-navy-900/5 hover:text-navy-700/70"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveSection(section.id)}
                    aria-label="Delete section"
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <WorksheetPreview
                  section={section}
                  audience={audience}
                  onChange={(patch) => onChangeSection(section.id, patch)}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={onAddSection}
              className={`flex w-full items-center justify-center gap-1.5 rounded-sm border border-dashed border-navy-900/20 py-4 text-sm font-medium text-navy-700/50 transition hover:border-teal-400/60 hover:text-teal-700 ${
                sections.length > 0 ? "mt-10" : ""
              }`}
            >
              <Plus size={14} /> Add section
            </button>
          </DocPage>
        )}
      </div>

      <CometDock
        project={project}
        onApplyQuickAction={onApplyQuickAction}
        onApplyCometEdit={onApplyCometEdit}
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </div>
  );
}
