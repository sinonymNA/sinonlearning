"use client";

import { useState } from "react";
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

const inputCls = "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder-stone-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all";
const labelCls = "text-xs font-semibold uppercase tracking-widest text-stone-400";

interface Props {
  section: NotesheetSection;
  onSave: (updated: NotesheetSection) => void;
  onClose: () => void;
}

export default function NotesheetSectionEditor({ section, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<NotesheetSection>({ ...section });

  function update<K extends keyof NotesheetSection>(key: K, val: NotesheetSection[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">Edit Section</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
            <X size={18} />
          </button>
        </div>

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

        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Heading (optional)</span>
          <input
            type="text"
            value={draft.heading ?? ""}
            onChange={(e) => update("heading", e.target.value || undefined)}
            className={inputCls}
            placeholder="Section heading"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Student Prompt</span>
          <textarea
            rows={3}
            value={draft.student_prompt}
            onChange={(e) => update("student_prompt", e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Answer Key Notes</span>
          <textarea
            rows={3}
            value={draft.answer_key_notes}
            onChange={(e) => update("answer_key_notes", e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </label>

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

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-stone-200 px-4 py-2.5 text-sm text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            className="flex-1 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors shadow-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
