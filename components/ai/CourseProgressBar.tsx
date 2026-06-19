"use client";

import { useState } from "react";
import { readAllLessonProgress } from "@/lib/aiProgress";

export default function CourseProgressBar({
  courseSlug,
  lessonSlugs,
}: {
  courseSlug: string;
  lessonSlugs: string[];
}) {
  const [completedCount] = useState(() => {
    const progress = readAllLessonProgress(courseSlug, lessonSlugs);
    return Object.values(progress).filter((p) => p.completed).length;
  });

  const total = lessonSlugs.length;
  const pct = total === 0 ? 0 : (completedCount / total) * 100;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-white/80">Your Progress</span>
        <span className="text-white/50">
          {completedCount} of {total} lessons complete
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-300 to-purple-300 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
