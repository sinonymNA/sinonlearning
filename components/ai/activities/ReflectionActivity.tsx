"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { AILessonActivity } from "@/data/aiCourses";
import { useAILessonProgress } from "@/hooks/useAILessonProgress";

interface ReflectionState {
  text: string;
  savedAt: number;
}

export default function ReflectionActivity({
  courseSlug,
  lessonSlug,
  activity,
}: {
  courseSlug: string;
  lessonSlug: string;
  activity: AILessonActivity;
}) {
  const { progress, saveActivityState, markComplete } = useAILessonProgress(courseSlug, lessonSlug);
  const stored = progress.activityState as ReflectionState | undefined;
  const [text, setText] = useState(stored?.text ?? "");

  const save = () => {
    saveActivityState({ text, savedAt: Date.now() });
    if (text.trim().length > 0) markComplete(true);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-white/70">{activity.reflectionPrompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Write your response here..."
        className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/90 placeholder:text-white/30 focus:border-teal-300/40 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
        >
          Save Reflection
        </button>
        {progress.completed && (
          <span className="flex items-center gap-1.5 text-sm text-teal-300">
            <Check size={15} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
