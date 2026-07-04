"use client";

import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Pencil, Download, FileText, RotateCcw } from "lucide-react";
import type { NotesheetPlan, NotesheetSection } from "@/lib/notesheetTypes";
import NotesheetSectionEditor from "./NotesheetSectionEditor";
import PrintAnimation from "./PrintAnimation";

const TYPE_LABELS: Record<string, string> = {
  warmup_box: "Warm-up",
  fill_blank: "Fill in the Blank",
  numbered_response: "Numbered",
  content_box: "Content",
  two_column_box: "Two-Column",
  drawing_box: "Drawing",
  three_column_box: "Three-Column",
};

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  warmup_box:        { bg: "bg-violet-50",  text: "text-violet-600", dot: "bg-violet-400" },
  fill_blank:        { bg: "bg-blue-50",    text: "text-blue-600",   dot: "bg-blue-400" },
  numbered_response: { bg: "bg-emerald-50", text: "text-emerald-600",dot: "bg-emerald-400" },
  content_box:       { bg: "bg-amber-50",   text: "text-amber-600",  dot: "bg-amber-400" },
  two_column_box:    { bg: "bg-pink-50",    text: "text-pink-600",   dot: "bg-pink-400" },
  drawing_box:       { bg: "bg-orange-50",  text: "text-orange-600", dot: "bg-orange-400" },
  three_column_box:  { bg: "bg-sky-50",     text: "text-sky-600",    dot: "bg-sky-400" },
};

interface Props {
  plan: NotesheetPlan;
  onPlanChange: (updated: NotesheetPlan) => void;
  onReset: () => void;
}

export default function NotesheetPreview({ plan, onPlanChange, onReset }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"student" | "teacher_key" | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Stagger cards in on mount
  useEffect(() => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll(".section-card");
    animate(cards, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 420,
      delay: stagger(55, { start: 60 }),
      easing: "easeOutQuart",
    });
  }, []);

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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-stone-900 tracking-tight leading-snug">
            {plan.title}
          </h2>
          <p className="text-[13px] text-stone-400 mt-0.5">
            {plan.subject}{plan.grade_band ? ` · ${plan.grade_band}` : ""}
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[12px] text-stone-400 hover:text-stone-700 transition-colors shrink-0 mt-0.5"
        >
          <RotateCcw size={11} />
          New
        </button>
      </div>

      {/* Essential question */}
      <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-violet-50/30 px-4 py-3.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-1">Essential Question</p>
        <p className="text-[13px] text-stone-700 italic leading-relaxed">{plan.essential_question}</p>
      </div>

      {/* Section cards */}
      <div ref={listRef} className="flex flex-col gap-2">
        {plan.sections.map((section) => {
          const colors = TYPE_COLORS[section.type] ?? { bg: "bg-stone-50", text: "text-stone-500", dot: "bg-stone-400" };
          return (
            <div
              key={section.id}
              className="section-card group rounded-xl border border-stone-100 bg-white px-4 py-3.5 hover:border-stone-200 hover:shadow-sm transition-all cursor-default"
              style={{ opacity: 0 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Type badge */}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text} mb-1.5`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    {TYPE_LABELS[section.type] ?? section.type}
                  </span>

                  {section.heading && (
                    <p className="text-[13px] font-semibold text-stone-800 mb-0.5">{section.heading}</p>
                  )}
                  <p className="text-[13px] text-stone-500 line-clamp-2 leading-relaxed">
                    {section.student_prompt}
                  </p>
                </div>
                <button
                  onClick={() => setEditingId(section.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                >
                  <Pencil size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Download actions */}
      <div className="flex gap-2.5 pt-2 sticky bottom-4">
        <button
          onClick={() => exportPdf("student")}
          disabled={!!exporting}
          className={[
            "flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-semibold text-white transition-all",
            "bg-gradient-to-br from-violet-500 to-violet-700 shadow-md shadow-violet-200",
            "hover:shadow-lg hover:shadow-violet-300 hover:-translate-y-0.5",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
          ].join(" ")}
        >
          {exporting === "student" ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={14} />
          )}
          Student PDF
        </button>
        <button
          onClick={() => exportPdf("teacher_key")}
          disabled={!!exporting}
          className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3.5 text-[13px] font-medium text-stone-600 hover:border-stone-300 hover:bg-stone-50 hover:-translate-y-0.5 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {exporting === "teacher_key" ? (
            <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          ) : (
            <FileText size={14} />
          )}
          Key
        </button>
      </div>

      {/* Section editor modal */}
      {editing && (
        <NotesheetSectionEditor
          section={editing}
          onSave={updateSection}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* Print animation overlay */}
      <PrintAnimation visible={!!exporting} mode={exporting ?? "student"} />
    </div>
  );
}
