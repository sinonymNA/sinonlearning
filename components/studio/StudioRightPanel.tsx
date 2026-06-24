"use client";

import CometAssistant from "./CometAssistant";
import QualityChecklist from "./QualityChecklist";
import type { CometEditOutcome } from "@/lib/cometEditValidation";
import type { TeacherStudioProject } from "@/lib/studioTypes";

interface StudioRightPanelProps {
  project: TeacherStudioProject;
  onApplyQuickAction: (actionId: string) => void;
  onApplyCometEdit: (edit: CometEditOutcome) => void;
  onToggleChecklistItem: (itemId: string, passed: boolean) => void;
}

export default function StudioRightPanel({
  project,
  onApplyQuickAction,
  onApplyCometEdit,
  onToggleChecklistItem,
}: StudioRightPanelProps) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <CometAssistant project={project} onApply={onApplyQuickAction} onApplyCometEdit={onApplyCometEdit} />
      <div className="h-px bg-navy-900/8" />
      <QualityChecklist items={project.qualityChecklist} onTogglePassed={onToggleChecklistItem} />
    </div>
  );
}
