"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { AILessonActivity } from "@/data/aiCourses";
import { useAILessonProgress } from "@/hooks/useAILessonProgress";

interface ChecklistState {
  checkedIds: string[];
}

export default function ChecklistActivity({
  courseSlug,
  lessonSlug,
  activity,
}: {
  courseSlug: string;
  lessonSlug: string;
  activity: AILessonActivity;
}) {
  const { progress, saveActivityState, markComplete } = useAILessonProgress(courseSlug, lessonSlug);
  const stored = progress.activityState as ChecklistState | undefined;
  const items = activity.checklist ?? [];
  const [checkedIds, setCheckedIds] = useState<string[]>(stored?.checkedIds ?? []);

  const toggle = (id: string) => {
    const next = checkedIds.includes(id) ? checkedIds.filter((c) => c !== id) : [...checkedIds, id];
    setCheckedIds(next);
    saveActivityState({ checkedIds: next });
    if (next.length === items.length) markComplete(true);
  };

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const checked = checkedIds.includes(item.id);
        return (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              checked
                ? "border-teal-300/30 bg-teal-300/10 text-white"
                : "border-white/10 bg-white/[0.02] text-white/75 hover:border-white/25"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                checked ? "border-teal-300 bg-teal-300 text-navy-950" : "border-white/25"
              }`}
            >
              {checked && <Check size={12} />}
            </span>
            {item.label}
          </button>
        );
      })}
      <p className="pt-1 text-xs text-white/40">
        {checkedIds.length} / {items.length} complete
      </p>
    </div>
  );
}
