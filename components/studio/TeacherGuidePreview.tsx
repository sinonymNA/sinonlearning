"use client";

import { Plus, Trash2 } from "lucide-react";
import type { TeacherGuide } from "@/lib/studioTypes";

interface TeacherGuidePreviewProps {
  guide: TeacherGuide;
  onChange: (patch: Partial<TeacherGuide>) => void;
}

export default function TeacherGuidePreview({ guide, onChange }: TeacherGuidePreviewProps) {
  const updateListItem = (
    key: "objectives" | "materials",
    index: number,
    value: string
  ) => {
    const next = [...guide[key]];
    next[index] = value;
    onChange({ [key]: next } as Partial<TeacherGuide>);
  };

  const addListItem = (key: "objectives" | "materials") => {
    onChange({ [key]: [...guide[key], ""] } as Partial<TeacherGuide>);
  };

  const removeListItem = (key: "objectives" | "materials", index: number) => {
    onChange({ [key]: guide[key].filter((_, i) => i !== index) } as Partial<TeacherGuide>);
  };

  return (
    <div className="glass-panel rounded-3xl border border-navy-900/8 p-6 sm:p-8">
      <h2 className="font-display text-2xl text-navy-900">Teacher Guide</h2>

      <label className="mt-5 block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-700/50">
          Overview
        </span>
        <textarea
          value={guide.overview}
          onChange={(e) => onChange({ overview: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-xl border border-navy-900/10 bg-white/60 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        />
      </label>

      <EditableList
        label="Objectives"
        items={guide.objectives}
        onItemChange={(i, v) => updateListItem("objectives", i, v)}
        onAdd={() => addListItem("objectives")}
        onRemove={(i) => removeListItem("objectives", i)}
      />

      <EditableList
        label="Materials"
        items={guide.materials}
        onItemChange={(i, v) => updateListItem("materials", i, v)}
        onAdd={() => addListItem("materials")}
        onRemove={(i) => removeListItem("materials", i)}
      />

      <label className="mt-5 block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-700/50">
          Timing notes
        </span>
        <textarea
          value={guide.timingNotes}
          onChange={(e) => onChange({ timingNotes: e.target.value })}
          rows={2}
          className="w-full resize-none rounded-xl border border-navy-900/10 bg-white/60 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        />
      </label>
    </div>
  );
}

function EditableList({
  label,
  items,
  onItemChange,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  onItemChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="mt-5">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-700/50">
        {label}
      </span>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
            <input
              value={item}
              onChange={(e) => onItemChange(index, e.target.value)}
              className="w-full bg-transparent text-sm text-navy-800 focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${label.toLowerCase()} item`}
              className="text-navy-700/30 hover:text-rose-600"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
      >
        <Plus size={12} /> Add {label.toLowerCase()} item
      </button>
    </div>
  );
}
