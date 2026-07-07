import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getSkillMasteryForStudent } from "@/lib/marginsDb";
import { PRACTICE_COURSES } from "@/lib/marginsPracticeCourses";
import MarginsHeader from "@/components/margins/MarginsHeader";
import RevealGroup from "@/components/margins/RevealGroup";
import SkillMasteryPanel from "@/components/margins/SkillMasteryPanel";

export default async function PracticeCoursesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "student") redirect("/margins/teacher");

  const mastery = await getSkillMasteryForStudent(user.id);

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="student" homeHref="/margins/student" />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6 mb-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600 mb-1">Meet Scout</p>
          <p className="text-[15px] text-stone-700 leading-relaxed">
            Scout's your practice coach — quick, low-stakes reps to build up your AP World History writing, one
            sentence at a time. No grades that count, just reps until it clicks.
          </p>
        </div>

        <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Courses</h2>
        <RevealGroup className="flex flex-col gap-2.5 mb-10" stagger={60} translateY={14}>
          {PRACTICE_COURSES.map((course) => (
            <Link
              key={course.id}
              href={`/margins/student/practice/${course.id}`}
              className="reveal-item group flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3.5 hover:border-teal-200 hover:shadow-sm transition-all"
              style={{ opacity: 0 }}
            >
              <div className="min-w-0">
                <p className="font-medium text-stone-800">{course.title}</p>
                <p className="text-xs text-stone-400 mt-0.5">{course.description}</p>
              </div>
              <span className="shrink-0 text-teal-500 text-sm">→</span>
            </Link>
          ))}
        </RevealGroup>

        <SkillMasteryPanel mastery={mastery} />
      </main>
    </div>
  );
}
