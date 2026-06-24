"use client";

import { Plus, Trash2 } from "lucide-react";
import DocPage from "./DocPage";
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
    <DocPage>
      <h2 className="font-display text-3xl text-navy-900">Teacher Guide</h2>

      <Section label="Overview">
        <textarea
          value={guide.overview}
          onChange={(e) => onChange({ overview: e.target.value })}
          placeholder="What's this lesson about, at a glance?"
          rows={3}
          className="w-full resize-none bg-transparent text-base leading-relaxed text-navy-800 placeholder:text-navy-700/30 focus-visible:outline-none"
        />
      </Section>

      <Section label="Objectives">
        <EditableList
          label="objective"
          items={guide.objectives}
          onItemChange={(i, v) => updateListItem("objectives", i, v)}
          onAdd={() => addListItem("objectives")}
          onRemove={(i) => removeListItem("objectives", i)}
        />
      </Section>

      <Section label="Materials">
        <EditableList
          label="material"
          items={guide.materials}
          onItemChange={(i, v) => updateListItem("materials", i, v)}
          onAdd={() => addListItem("materials")}
          onRemove={(i) => removeListItem("materials", i)}
        />
      </Section>

      <Section label="Timing notes" last>
        <textarea
          value={guide.timingNotes}
          onChange={(e) => onChange({ timingNotes: e.target.value })}
          rows={2}
          placeholder="How should the class period be paced?"
          className="w-full resize-none bg-transparent text-base leading-relaxed text-navy-800 placeholder:text-navy-700/30 focus-visible:outline-none"
        />
      </Section>
    </DocPage>
  );
}

function Section({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`mt-6 border-b border-navy-900/6 pb-6 ${last ? "border-0 pb-0" : ""}`}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-700/45">{label}</h3>
      {children}
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
    <div>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={index} className="group flex items-center gap-2">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
            <input
              value={item}
              onChange={(e) => onItemChange(index, e.target.value)}
              className="w-full bg-transparent text-base text-navy-800 placeholder:text-navy-700/30 focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${label}`}
              className="text-navy-700/0 transition group-hover:text-navy-700/30 hover:text-rose-600"
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
        <Plus size={12} /> Add {label}
      </button>
    </div>
  );
}
