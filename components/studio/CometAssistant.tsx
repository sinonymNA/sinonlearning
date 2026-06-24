"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import CometCharacter from "./CometCharacter";
import { QUICK_ACTIONS } from "@/lib/studioTransforms";
import type { CometEditOutcome } from "@/lib/cometEditValidation";
import type { TeacherStudioProject } from "@/lib/studioTypes";

interface CometAssistantProps {
  project: TeacherStudioProject;
  onApply: (actionId: string) => void;
  onApplyCometEdit: (edit: CometEditOutcome) => void;
}

type AskStatus = "idle" | "loading" | "error";

const DEFAULT_VISIBLE_ACTIONS = 4;

export default function CometAssistant({ project, onApply, onApplyCometEdit }: CometAssistantProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [status, setStatus] = useState<AskStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pendingEdit, setPendingEdit] = useState<CometEditOutcome | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);

  const visibleActions = showAllActions ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, DEFAULT_VISIBLE_ACTIONS);
  const hiddenCount = QUICK_ACTIONS.length - DEFAULT_VISIBLE_ACTIONS;

  const handleClick = (actionId: string, available: boolean) => {
    if (!available) {
      setToast("This quick action is coming soon — not wired up yet.");
      window.setTimeout(() => setToast(null), 2500);
      return;
    }
    onApply(actionId);
  };

  const handleAsk = async () => {
    const trimmed = instruction.trim();
    if (!trimmed || status === "loading") return;
    setStatus("loading");
    setError(null);
    setPendingEdit(null);
    try {
      const res = await fetch("/api/studio/comet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: trimmed,
          project: {
            title: project.title,
            subject: project.subject,
            gradeLevel: project.gradeLevel,
            durationMinutes: project.durationMinutes,
            teachingStyle: project.teachingStyle,
            slides: project.slides,
            worksheetSections: project.worksheetSections,
            teacherGuide: project.teacherGuide,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Comet couldn't make that edit. Please try again.");
        setStatus("error");
        return;
      }
      setPendingEdit(json.data as CometEditOutcome);
      setStatus("idle");
    } catch {
      setError("Comet couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  };

  const handleApplyEdit = () => {
    if (!pendingEdit) return;
    onApplyCometEdit(pendingEdit);
    setPendingEdit(null);
    setInstruction("");
    setToast("Applied Comet's edit.");
    window.setTimeout(() => setToast(null), 2500);
  };

  const handleDiscardEdit = () => {
    setPendingEdit(null);
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <CometCharacter size={32} mood="thinking" />
        <div>
          <p className="text-sm font-semibold text-navy-900">Ask Comet</p>
          <p className="text-xs text-navy-700/50">
            Type a request and Comet calls live AI to draft an edit you can review before applying.
          </p>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder='e.g. "Make the questions on slide 3 harder" or "Add two more discussion prompts"'
          rows={2}
          maxLength={500}
          className="w-full resize-none rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-700/40 focus:border-teal-400 focus:outline-none"
          disabled={status === "loading"}
        />
        <button
          type="button"
          onClick={handleAsk}
          disabled={!instruction.trim() || status === "loading"}
          className="w-full rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-navy-900/15 disabled:text-navy-700/40"
        >
          {status === "loading" ? "Comet is thinking…" : "Ask Comet"}
        </button>
        {error && <p className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-800">{error}</p>}
      </div>

      {pendingEdit && (
        <div className="mb-4 rounded-xl border border-teal-300 bg-teal-50 p-3">
          <p className="mb-1 text-xs font-semibold text-teal-900">Comet&apos;s proposed edit</p>
          <p className="mb-2 text-xs text-teal-800">{pendingEdit.summary}</p>
          <p className="mb-3 text-[11px] text-teal-700/70">
            {pendingEdit.slides.length} slide{pendingEdit.slides.length === 1 ? "" : "s"} ·{" "}
            {pendingEdit.worksheetSections.length} worksheet section
            {pendingEdit.worksheetSections.length === 1 ? "" : "s"} after this change
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApplyEdit}
              className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleDiscardEdit}
              className="rounded-full border border-teal-300 bg-white px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-50"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="mb-3">
        <p className="text-xs font-semibold text-navy-900">Quick actions</p>
        <p className="text-xs text-navy-700/50">Local edits, applied instantly. No AI call.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visibleActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleClick(action.id, action.available)}
            title={action.description}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              action.available
                ? "border-teal-300 bg-white text-teal-800 hover:bg-teal-50"
                : "border-navy-900/10 bg-white text-navy-700/40"
            }`}
          >
            {action.label}
            {!action.available && <span className="ml-1 text-[10px] uppercase">soon</span>}
          </button>
        ))}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAllActions((v) => !v)}
          className="mt-2 flex items-center gap-1 text-[11px] font-medium text-navy-700/45 hover:text-teal-700"
        >
          {showAllActions ? (
            <>
              <ChevronUp size={12} /> Show fewer
            </>
          ) : (
            <>
              <ChevronDown size={12} /> {hiddenCount} more action{hiddenCount === 1 ? "" : "s"}
            </>
          )}
        </button>
      )}
      {toast && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800">{toast}</p>
      )}
    </div>
  );
}
