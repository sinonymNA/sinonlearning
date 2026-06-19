"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { AIFlagshipCourse } from "@/data/aiCourses";
import { readAllLessonProgress } from "@/lib/aiProgress";

export default function CourseSyllabus({ course }: { course: AIFlagshipCourse }) {
  const [completedSlugs] = useState<Set<string>>(() => {
    const lessonSlugs = course.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.slug));
    const progress = readAllLessonProgress(course.slug, lessonSlugs);
    return new Set(Object.entries(progress).filter(([, p]) => p.completed).map(([slug]) => slug));
  });

  return (
    <div className="space-y-14">
      {course.units.map((unit) => (
        <div key={unit.title}>
          <div className="mb-6">
            <h3 className="font-display text-2xl font-medium text-white">{unit.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{unit.summary}</p>
          </div>

          <div className="space-y-3">
            {unit.lessons.map((lesson) => {
              const isComplete = completedSlugs.has(lesson.slug);
              return (
                <Link
                  key={lesson.day}
                  href={`/ai/${course.slug}/lessons/${lesson.slug}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 transition-colors hover:border-teal-300/30 hover:bg-white/[0.04] sm:px-6"
                >
                  <div className="flex items-center gap-4 sm:gap-5">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                        isComplete
                          ? "bg-gradient-to-br from-teal-300 to-purple-300 text-navy-950"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {isComplete ? <Check size={14} /> : String(lesson.day).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-display text-base font-medium text-white/90 sm:text-lg">{lesson.title}</p>
                      <p className="mt-0.5 hidden text-xs text-white/40 sm:block">
                        Day {lesson.day} · {lesson.essentialQuestion}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-white/30" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
