"use client";

import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Pencil, Download, FileText, RotateCcw, Lightbulb, ChevronDown } from "lucide-react";
import type { NotesheetPlan, NotesheetSection, WorksheetDesignBrief } from "@/lib/notesheetTypes";
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
  structured_concept_box: "Concept Box",
  graph_box: "Graph",
  acronym_scaffold: "Acronym",
  labeled_comparison_table: "Comparison Table",
  frayer_model: "Frayer Model",
  t_chart: "T-Chart",
  sequence_box: "Sequence",
  cause_effect_box: "Cause & Effect",
  timeline_box: "Timeline",
  exit_ticket: "Exit Ticket",
  spectrum_bar: "Spectrum",
  mind_map_box: "Mind Map",
};

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  warmup_box:               { bg: "bg-violet-50",  text: "text-violet-600", dot: "bg-violet-400" },
  fill_blank:               { bg: "bg-blue-50",    text: "text-blue-600",   dot: "bg-blue-400" },
  numbered_response:        { bg: "bg-emerald-50", text: "text-emerald-600",dot: "bg-emerald-400" },
  content_box:              { bg: "bg-amber-50",   text: "text-amber-600",  dot: "bg-amber-400" },
  two_column_box:           { bg: "bg-pink-50",    text: "text-pink-600",   dot: "bg-pink-400" },
  drawing_box:              { bg: "bg-orange-50",  text: "text-orange-600", dot: "bg-orange-400" },
  three_column_box:         { bg: "bg-sky-50",     text: "text-sky-600",    dot: "bg-sky-400" },
  structured_concept_box:   { bg: "bg-indigo-50",  text: "text-indigo-600", dot: "bg-indigo-400" },
  graph_box:                { bg: "bg-teal-50",    text: "text-teal-600",   dot: "bg-teal-400" },
  acronym_scaffold:         { bg: "bg-fuchsia-50", text: "text-fuchsia-600",dot: "bg-fuchsia-400" },
  labeled_comparison_table: { bg: "bg-rose-50",    text: "text-rose-600",   dot: "bg-rose-400" },
  frayer_model:             { bg: "bg-cyan-50",    text: "text-cyan-600",   dot: "bg-cyan-400" },
  t_chart:                  { bg: "bg-green-50",   text: "text-green-600",  dot: "bg-green-400" },
  sequence_box:             { bg: "bg-purple-50",  text: "text-purple-600", dot: "bg-purple-400" },
  cause_effect_box:         { bg: "bg-red-50",     text: "text-red-600",    dot: "bg-red-400" },
  timeline_box:             { bg: "bg-sky-50",     text: "text-sky-700",    dot: "bg-sky-500" },
  exit_ticket:              { bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-500" },
  spectrum_bar:             { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500" },
  mind_map_box:             { bg: "bg-violet-50",  text: "text-violet-700", dot: "bg-violet-500" },
};

interface Props {
  plan: NotesheetPlan;
  onPlanChange: (updated: NotesheetPlan) => void;
  onReset: () => void;
  /** Present only on the describe-a-worksheet path — KORA's design reasoning. */
  designBrief?: WorksheetDesignBrief | null;
}

export default function NotesheetPreview({ plan, onPlanChange, onReset, designBrief }: Props) {
  const [briefOpen, setBriefOpen] = useState(false);
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
      easing: "outQuart",
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

      {/* KORA's design reasoning — describe-a-worksheet path only */}
      {designBrief && (
        <div className="rounded-xl border border-stone-200 bg-stone-50/60 overflow-hidden">
          <button
            onClick={() => setBriefOpen((o) => !o)}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-stone-100/60 transition-colors"
          >
            <Lightbulb size={14} className="shrink-0 text-amber-500" strokeWidth={2} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-stone-700">
                KORA built this as a {designBrief.worksheet_type.toLowerCase()}
              </p>
              {!briefOpen && (
                <p className="text-[12px] text-stone-400 truncate">{designBrief.design_rationale}</p>
              )}
            </div>
            <ChevronDown
              size={14}
              className={[
                "shrink-0 text-stone-400 transition-transform",
                briefOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>

          {briefOpen && (
            <div className="px-4 pb-4 pt-1 flex flex-col gap-3 border-t border-stone-200/70">
              {[
                { label: "Why this format", value: designBrief.design_rationale },
                { label: "Learning goal", value: designBrief.learning_goal },
                { label: "What students do", value: designBrief.student_experience },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">{label}</p>
                  <p className="text-[12.5px] text-stone-600 leading-relaxed">{value}</p>
                </div>
              ))}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
                  Section decisions
                </p>
                <ol className="flex flex-col gap-1.5">
                  {designBrief.section_plan.map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed">
                      <span className="shrink-0 text-stone-300 tabular-nums">{i + 1}.</span>
                      <span className="text-stone-600">
                        <span className="font-semibold text-stone-700">{s.heading}</span>
                        <span className="text-stone-400"> · {TYPE_LABELS[s.type] ?? s.type}</span>
                        <br />
                        {s.rationale}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

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
