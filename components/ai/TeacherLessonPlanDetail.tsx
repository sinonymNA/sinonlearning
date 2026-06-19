import { Target, BookOpen, ListChecks, ClipboardCheck } from "lucide-react";
import type { AILesson } from "@/data/aiCourses";

export default function TeacherLessonPlanDetail({ lesson }: { lesson: AILesson }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.02]">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-white/70 transition-colors group-open:text-white sm:px-6">
        For Teachers: Full Lesson Plan Detail
      </summary>
      <div className="border-t border-white/10 px-5 pb-7 pt-5 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-300/80">
              <Target size={13} />
              Objectives
            </div>
            <ul className="mt-3 space-y-2">
              {lesson.objectives.map((obj) => (
                <li key={obj} className="flex gap-2 text-sm leading-relaxed text-white/75">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-300" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-purple-300/80">
              <BookOpen size={13} />
              Key Vocabulary
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {lesson.vocabulary.map((word) => (
                <span
                  key={word}
                  className="rounded-full border border-purple-300/20 bg-purple-300/5 px-3 py-1 text-xs font-medium text-purple-100"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/80">
            <ListChecks size={13} />
            Lesson Flow
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lesson.flow.map((step, i) => (
              <div key={step.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold text-amber-200/90">
                  {i + 1}. {step.label}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/65">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-teal-300/15 bg-teal-300/5 p-4">
          <ClipboardCheck size={15} className="mt-0.5 shrink-0 text-teal-300" />
          <p className="text-sm leading-relaxed text-white/75">
            <span className="font-semibold text-teal-200">Assessment: </span>
            {lesson.assessment}
          </p>
        </div>
      </div>
    </details>
  );
}
