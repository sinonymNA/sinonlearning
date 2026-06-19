"use client";

import type { AILessonActivity } from "@/data/aiCourses";
import QuizActivity from "@/components/ai/activities/QuizActivity";
import ReflectionActivity from "@/components/ai/activities/ReflectionActivity";
import GuessTheRuleActivity from "@/components/ai/activities/GuessTheRuleActivity";
import ChecklistActivity from "@/components/ai/activities/ChecklistActivity";

export default function LessonActivity({
  courseSlug,
  lessonSlug,
  activity,
}: {
  courseSlug: string;
  lessonSlug: string;
  activity: AILessonActivity;
}) {
  const props = { courseSlug, lessonSlug, activity };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300/80">Try It Yourself</p>
      <h3 className="mt-2 font-display text-xl font-medium text-white">{activity.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{activity.instructions}</p>
      <div className="mt-6">
        {activity.type === "quiz" && <QuizActivity {...props} />}
        {activity.type === "reflection" && <ReflectionActivity {...props} />}
        {activity.type === "guess-the-rule" && <GuessTheRuleActivity {...props} />}
        {activity.type === "checklist" && <ChecklistActivity {...props} />}
      </div>
    </div>
  );
}
