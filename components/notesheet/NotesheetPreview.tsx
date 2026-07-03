"use client";

import { useState } from "react";
import { Pencil, Download, FileText } from "lucide-react";
import type { NotesheetPlan, NotesheetSection } from "@/lib/notesheetTypes";
import NotesheetSectionEditor from "./NotesheetSectionEditor";
import PrintAnimation from "./PrintAnimation";

const SECTION_TYPE_LABELS: Record<string, string> = {
  warmup_box: "Warm-up Box",
  fill_blank: "Fill in the Blank",
  numbered_response: "Numbered Response",
  content_box: "Content Box",
  two_column_box: "Two-Column Box",
  drawing_box: "Drawing Box",
  three_column_box: "Three-Column Box",
};

const SECTION_TYPE_COLORS: Record<string, string> = {
  warmup_box: "bg-violet-100 text-violet-700",
  fill_blank: "bg-blue-100 text-blue-700",
  numbered_response: "bg-emerald-100 text-emerald-700",
  content_box: "bg-amber-100 text-amber-700",
  two_column_box: "bg-pink-100 text-pink-700",
  drawing_box: "bg-orange-100 text-orange-700",
  three_column_box: "bg-sky-100 text-sky-700",
};

interface Props {
  plan: NotesheetPlan;
  onPlanChange: (updated: NotesheetPlan) => void;
  onReset: () => void;
}

export default function NotesheetPreview({ plan, onPlanChange, onReset }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"student" | "teacher_key" | null>(null);

  function updateSection(updated: NotesheetSection) {
    onPlanChange({
      ...plan,
      sections: plan.sections.map((s) => (s.id === updated.id ? updated : s)),
    });
    setEditingId(null);
  }

  async function exportPdf(mode: "student" | "teacher_key") {
    setExporting(mode);
    try {
      const res = await fetch("/api/notesheet/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, mode }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Export failed.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${plan.concept.replace(/\s+/g, "_")}_notesheet${mode === "teacher_key" ? "_key" : ""}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  }

  const editing = editingId ? plan.sections.find((s) => s.id === editingId) ?? null : null;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{plan.title}</h2>
          <p className="text-sm text-stone-400 mt-0.5">{plan.subject} · {plan.grade_band}</p>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors shrink-0"
        >
          Start over
        </button>
      </div>

      <div className="rounded-xl border border-violet-100 bg-violet-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-1">Essential Question</p>
        <p className="text-sm text-stone-700 italic">{plan.essential_question}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {plan.sections.map((section) => (
          <div
            key={section.id}
            className="group rounded-xl border border-stone-200 bg-white px-5 py-4 hover:border-stone-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className={[
                  "inline-block text-[10px] font-semibold uppercase tracking-widest rounded-full px-2 py-0.5 mb-1.5",
                  SECTION_TYPE_COLORS[section.type] ?? "bg-stone-100 text-stone-500",
                ].join(" ")}>
                  {SECTION_TYPE_LABELS[section.type] ?? section.type}
                </span>
                {section.heading && (
                  <p className="text-sm font-medium text-stone-800 mb-1">{section.heading}</p>
                )}
                <p className="text-sm text-stone-500 line-clamp-2">{section.student_prompt}</p>
              </div>
              <button
                onClick={() => setEditingId(section.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 text-stone-400 hover:text-stone-600"
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => exportPdf("student")}
          disabled={!!exporting}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {exporting === "student" ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={14} />
          )}
          Download Student PDF
        </button>
        <button
          onClick={() => exportPdf("teacher_key")}
          disabled={!!exporting}
          className="flex items-center justify-center gap-2 rounded-full border border-stone-200 px-5 py-2.5 text-sm text-stone-600 hover:border-stone-300 hover:text-stone-800 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting === "teacher_key" ? (
            <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          ) : (
            <FileText size={14} />
          )}
          Teacher Key
        </button>
      </div>

      {editing && (
        <NotesheetSectionEditor
          section={editing}
          onSave={updateSection}
          onClose={() => setEditingId(null)}
        />
      )}

      <PrintAnimation visible={!!exporting} mode={exporting ?? "student"} />
    </div>
  );
}
