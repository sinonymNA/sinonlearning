"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import StudioTopBar from "./StudioTopBar";
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
  onReorderSection: (sectionId: string, direction: "up" | "down") => void;
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
  onReorderSection,
  onChangeGuide,
  onApplyQuickAction,
  onApplyCometEdit,
  onToggleChecklistItem,
}: DocsEditorProps) {
  const sections = project.worksheetSections;

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
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={section.id} className="group relative mx-auto w-full max-w-[680px]">
                <div className="absolute -top-3 right-0 z-10 flex items-center gap-0.5 rounded-full bg-white px-1 py-0.5 opacity-0 shadow-sm ring-1 ring-navy-900/10 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onReorderSection(section.id, "up")}
                    disabled={index === 0}
                    aria-label="Move section up"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-navy-700/50 hover:bg-navy-900/5 disabled:opacity-25"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onReorderSection(section.id, "down")}
                    disabled={index === sections.length - 1}
                    aria-label="Move section down"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-navy-700/50 hover:bg-navy-900/5 disabled:opacity-25"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveSection(section.id)}
                    aria-label="Delete section"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-navy-700/50 hover:bg-rose-50 hover:text-rose-600"
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

            <div className="mx-auto w-full max-w-[680px]">
              <button
                type="button"
                onClick={onAddSection}
                className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-dashed border-navy-900/20 bg-white/40 py-4 text-sm font-medium text-navy-700/50 transition hover:border-teal-400/60 hover:text-teal-700"
              >
                <Plus size={14} /> Add section
              </button>
            </div>
          </div>
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
