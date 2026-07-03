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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f1420] p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Edit Section</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <X size={18} />
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Section Type</span>
          <select
            value={draft.type}
            onChange={(e) => update("type", e.target.value as NotesheetSectionType)}
            className="rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none focus:border-teal-400/60"
          >
            {SECTION_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-[#0f1420]">{t.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Heading (optional)</span>
          <input
            type="text"
            value={draft.heading ?? ""}
            onChange={(e) => update("heading", e.target.value || undefined)}
            className="rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-400/60"
            placeholder="Section heading"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Student Prompt</span>
          <textarea
            rows={3}
            value={draft.student_prompt}
            onChange={(e) => update("student_prompt", e.target.value)}
            className="rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-400/60 resize-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Answer Key Notes</span>
          <textarea
            rows={3}
            value={draft.answer_key_notes}
            onChange={(e) => update("answer_key_notes", e.target.value)}
            className="rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-400/60 resize-none"
          />
        </label>

        {draft.type === "numbered_response" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Number of Lines</span>
            <input
              type="number"
              min={1}
              max={20}
              value={draft.num_lines ?? 5}
              onChange={(e) => update("num_lines", parseInt(e.target.value))}
              className="rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none focus:border-teal-400/60 w-24"
            />
          </label>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/60 hover:border-white/30 hover:text-white/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            className="flex-1 rounded-full bg-teal-300 px-4 py-2.5 text-sm font-medium text-navy-950 hover:bg-teal-200 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
