"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { X } from "lucide-react";
import type { NotesheetSection, NotesheetSectionType } from "@/lib/notesheetTypes";

const SECTION_TYPES: { value: NotesheetSectionType; label: string }[] = [
  { value: "warmup_box", label: "Warm-up Box" },
  { value: "fill_blank", label: "Fill in the Blank" },
  { value: "numbered_response", label: "Numbered Response" },
  { value: "content_box", label: "Content Box" },
  { value: "two_column_box", label: "Two-Column Box" },
  { value: "drawing_box", label: "Drawing Box" },
  { value: "three_column_box", label: "Three-Column Box" },
];

const inputCls =
  "rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[13px] text-stone-800 placeholder-stone-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all";
const labelCls = "text-[11px] font-bold uppercase tracking-widest text-stone-400";

interface Props {
  section: NotesheetSection;
  onSave: (updated: NotesheetSection) => void;
  onClose: () => void;
}

export default function NotesheetSectionEditor({ section, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<NotesheetSection>({ ...section });
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Slide-up entrance
  useEffect(() => {
    if (backdropRef.current) {
      animate(backdropRef.current, {
        opacity: [0, 1],
        duration: 220,
        easing: "outQuart",
      });
    }
    if (panelRef.current) {
      animate(panelRef.current, {
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 380,
        easing: "outQuart",
      });
    }
  }, []);

  function close() {
    // Slide-down exit
    if (panelRef.current) {
      animate(panelRef.current, {
        translateY: [0, 30],
        opacity: [1, 0],
        duration: 220,
        easing: "inQuart",
        onComplete: onClose,
      });
    } else {
      onClose();
    }
    if (backdropRef.current) {
      animate(backdropRef.current, {
        opacity: [1, 0],
        duration: 200,
        easing: "inQuart",
      });
    }
  }

  function update<K extends keyof NotesheetSection>(key: K, val: NotesheetSection[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      style={{ opacity: 0 }}
      onClick={(e) => { if (e.target === backdropRef.current) close(); }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-lg rounded-2xl border border-stone-100 bg-white p-6 shadow-2xl flex flex-col gap-5"
        style={{ opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-stone-900">Edit Section</h2>
          <button
            onClick={close}
            aria-label="Close"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Type */}
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Section Type</span>
          <select
            value={draft.type}
            onChange={(e) => update("type", e.target.value as NotesheetSectionType)}
            className={inputCls}
          >
            {SECTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        {/* Heading */}
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Heading <span className="normal-case font-normal tracking-normal text-stone-300">(optional)</span></span>
          <input
            type="text"
            value={draft.heading ?? ""}
            onChange={(e) => update("heading", e.target.value || undefined)}
            className={inputCls}
            placeholder="e.g. The Agricultural Revolution"
          />
        </label>

        {/* Student prompt */}
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Student Prompt</span>
          <textarea
            rows={3}
            value={draft.student_prompt}
            onChange={(e) => update("student_prompt", e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </label>

        {/* Answer key */}
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Answer Key Notes</span>
          <textarea
            rows={2}
            value={draft.answer_key_notes}
            onChange={(e) => update("answer_key_notes", e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </label>

        {/* num_lines for numbered response */}
        {draft.type === "numbered_response" && (
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Number of Lines</span>
            <input
              type="number"
              min={1}
              max={20}
              value={draft.num_lines ?? 5}
              onChange={(e) => update("num_lines", parseInt(e.target.value))}
              className={`${inputCls} w-24`}
            />
          </label>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={close}
            className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-[13px] font-medium text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            className="flex-1 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-violet-200 hover:shadow-md transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
