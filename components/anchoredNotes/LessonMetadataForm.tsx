"use client";

import type { AnchoredNotesProject } from "@/lib/anchoredNotesTypes";

type Metadata = Pick<AnchoredNotesProject, "title" | "course" | "lessonNumber" | "unit" | "gradeLevel" | "teacherName">;

interface LessonMetadataFormProps {
  metadata: Metadata;
  onChange: (patch: Partial<Metadata>) => void;
}

const FIELDS: { key: keyof Metadata; label: string; placeholder: string }[] = [
  { key: "title", label: "Lesson title", placeholder: "e.g. Lesson 1.2 — Causes of the Mongol Expansion" },
  { key: "course", label: "Course", placeholder: "e.g. AP World History" },
  { key: "lessonNumber", label: "Lesson #", placeholder: "e.g. 1.2" },
  { key: "unit", label: "Unit", placeholder: "e.g. Unit 1: The Global Tapestry" },
  { key: "gradeLevel", label: "Grade level", placeholder: "e.g. 9th-10th" },
  { key: "teacherName", label: "Teacher name", placeholder: "Optional" },
];

export default function LessonMetadataForm({ metadata, onChange }: LessonMetadataFormProps) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="mb-3 text-sm font-semibold text-navy-900">Lesson details</p>
      <p className="mb-3 text-xs text-navy-700/60">Optional — fills in the header on your generated notes.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={`anchored-meta-${field.key}`} className="mb-1 block text-xs font-medium text-navy-700/70">
              {field.label}
            </label>
            <input
              id={`anchored-meta-${field.key}`}
              type="text"
              value={metadata[field.key]}
              onChange={(e) => onChange({ [field.key]: e.target.value })}
              placeholder={field.placeholder}
              className="w-full rounded-lg border border-navy-900/10 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-400/60"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
