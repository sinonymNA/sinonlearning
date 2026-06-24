"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import CometCharacter from "./CometCharacter";
import CometAssistant from "./CometAssistant";
import QualityChecklist from "./QualityChecklist";
import type { CometEditOutcome } from "@/lib/cometEditValidation";
import type { TeacherStudioProject } from "@/lib/studioTypes";

interface CometDockProps {
  project: TeacherStudioProject;
  onApplyQuickAction: (actionId: string) => void;
  onApplyCometEdit: (edit: CometEditOutcome) => void;
  onToggleChecklistItem: (itemId: string, passed: boolean) => void;
}

export default function CometDock({
  project,
  onApplyQuickAction,
  onApplyCometEdit,
  onToggleChecklistItem,
}: CometDockProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="no-print fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-white py-2 pl-2 pr-4 shadow-[0_8px_30px_rgba(13,27,46,0.18)] ring-1 ring-navy-900/10 transition hover:shadow-[0_10px_36px_rgba(13,27,46,0.24)]"
          aria-label="Open Comet assistant"
        >
          <CometCharacter size={36} mood="happy" />
          <span className="text-sm font-semibold text-navy-900">Ask Comet</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="no-print fixed inset-0 z-40 bg-navy-950/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="no-print fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between border-b border-navy-900/8 px-4 py-3">
                <div className="flex items-center gap-2">
                  <CometCharacter size={28} mood="thinking" />
                  <span className="text-sm font-semibold text-navy-900">Comet</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close Comet assistant"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-navy-700/50 hover:bg-navy-900/5"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
                <CometAssistant
                  project={project}
                  onApply={onApplyQuickAction}
                  onApplyCometEdit={onApplyCometEdit}
                />
                <div className="h-px bg-navy-900/8" />
                <QualityChecklist
                  items={project.qualityChecklist}
                  onTogglePassed={onToggleChecklistItem}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
