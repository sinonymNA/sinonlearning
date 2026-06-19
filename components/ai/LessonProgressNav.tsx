"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { AILesson } from "@/data/aiCourses";
import { useAILessonProgress } from "@/hooks/useAILessonProgress";

export default function LessonProgressNav({
  courseSlug,
  lessonSlug,
  prevLesson,
  nextLesson,
}: {
  courseSlug: string;
  lessonSlug: string;
  prevLesson?: AILesson;
  nextLesson?: AILesson;
}) {
  const { progress, markComplete } = useAILessonProgress(courseSlug, lessonSlug);

  return (
    <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <button
        onClick={() => markComplete(!progress.completed)}
        className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
          progress.completed
            ? "border-teal-300/40 bg-teal-300/10 text-teal-200"
            : "border-white/15 text-white/70 hover:border-white/30"
        }`}
      >
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
            progress.completed ? "border-teal-300 bg-teal-300 text-navy-950" : "border-white/30"
          }`}
        >
          {progress.completed && <Check size={10} />}
        </span>
        {progress.completed ? "Lesson Complete" : "Mark Lesson Complete"}
      </button>

      <div className="flex items-center gap-3">
        {prevLesson ? (
          <Link
            href={`/ai/${courseSlug}/lessons/${prevLesson.slug}`}
            className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 transition-colors hover:border-white/25 hover:text-white"
          >
            <ArrowLeft size={14} /> Previous
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full border border-white/5 px-4 py-2 text-sm text-white/20">
            <ArrowLeft size={14} /> Previous
          </span>
        )}
        {nextLesson ? (
          <Link
            href={`/ai/${courseSlug}/lessons/${nextLesson.slug}`}
            className="flex items-center gap-1.5 rounded-full bg-teal-300 px-4 py-2 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
          >
            Next <ArrowRight size={14} />
          </Link>
        ) : (
          <Link
            href={`/ai/${courseSlug}`}
            className="flex items-center gap-1.5 rounded-full bg-teal-300 px-4 py-2 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
          >
            Back to Course
          </Link>
        )}
      </div>
    </div>
  );
}
