"use client";

import CometAssistant from "./CometAssistant";
import QualityChecklist from "./QualityChecklist";
import type { QualityChecklistItem } from "@/lib/studioTypes";

interface StudioRightPanelProps {
  checklist: QualityChecklistItem[];
  onApplyQuickAction: (actionId: string) => void;
  onToggleChecklistItem: (itemId: string, passed: boolean) => void;
}

export default function StudioRightPanel({
  checklist,
  onApplyQuickAction,
  onToggleChecklistItem,
}: StudioRightPanelProps) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <CometAssistant onApply={onApplyQuickAction} />
      <div className="h-px bg-navy-900/8" />
      <QualityChecklist items={checklist} onTogglePassed={onToggleChecklistItem} />
    </div>
  );
}
