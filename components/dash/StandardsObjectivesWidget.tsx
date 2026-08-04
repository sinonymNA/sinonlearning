"use client";

import { Plus, Trash2 } from "lucide-react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

interface CourseTargets {
  id: string;
  course: string;
  standards: string;
  objectives: string;
}

const defaultCourses: CourseTargets[] = [
  {
    id: "course-1",
    course: "Course 1",
    standards: "",
    objectives: "",
  },
];

export default function StandardsObjectivesWidget({
  storageKey = "classboard:standards-objectives",
}: {
  storageKey?: string;
}) {
  const [courses, setCourses] = useLocalStorageState<CourseTargets[]>(storageKey, defaultCourses);

  function updateCourse(id: string, field: keyof Omit<CourseTargets, "id">, value: string) {
    setCourses((current) => current.map((course) => (course.id === id ? { ...course, [field]: value } : course)));
  }

  function addCourse() {
    setCourses((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        course: `Course ${current.length + 1}`,
        standards: "",
        objectives: "",
      },
    ]);
  }

  function removeCourse(id: string) {
    setCourses((current) => current.filter((course) => course.id !== id));
  }

  return (
    <div className="flex max-h-[65vh] w-[390px] flex-col gap-3 overflow-y-auto pr-1">
      {courses.map((course, index) => (
        <section key={course.id} className="rounded-xl border border-navy-900/10 bg-cream-50/55 p-3.5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-[10px] font-bold text-green-700">
              {index + 1}
            </span>
            <input
              value={course.course}
              onChange={(event) => updateCourse(course.id, "course", event.target.value)}
              aria-label={`Course ${index + 1} name`}
              placeholder="Course name or period"
              className="min-w-0 flex-1 border-0 border-b border-navy-900/10 bg-transparent px-1 py-1 text-sm font-semibold text-navy-900 outline-none focus:border-green-500"
            />
            {courses.length > 1 && (
              <button
                type="button"
                onClick={() => removeCourse(course.id)}
                aria-label={`Remove ${course.course || `course ${index + 1}`}`}
                className="rounded-md p-1 text-navy-700/30 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy-700/55">Standards</span>
            <textarea
              value={course.standards}
              onChange={(event) => updateCourse(course.id, "standards", event.target.value)}
              rows={3}
              placeholder="Paste standards here, one per line..."
              className="mt-1.5 w-full resize-y rounded-lg border border-navy-900/10 bg-white px-2.5 py-2 text-xs leading-relaxed text-navy-900 outline-none placeholder:text-navy-700/30 focus:border-green-500/60"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-green-700">Student objectives</span>
            <div className="mt-1.5 rounded-lg border border-green-600/15 bg-green-500/5 p-2.5">
              <p className="mb-1.5 text-[11px] font-semibold text-green-800">Students will be able to...</p>
              <textarea
                value={course.objectives}
                onChange={(event) => updateCourse(course.id, "objectives", event.target.value)}
                rows={3}
                placeholder={"explain causes of...\ncompare two...\nsupport a claim with..."}
                className="w-full resize-y border-0 bg-transparent text-xs leading-relaxed text-navy-900 outline-none placeholder:text-navy-700/30"
              />
            </div>
          </label>
        </section>
      ))}

      <button
        type="button"
        onClick={addCourse}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-green-600/35 px-3 py-2.5 text-xs font-semibold text-green-700 transition-colors hover:border-green-600 hover:bg-green-500/5"
      >
        <Plus size={14} /> Add another course
      </button>
    </div>
  );
}
