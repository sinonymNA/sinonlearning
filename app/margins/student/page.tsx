import { redirect } from "next/navigation";
import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassesByStudent, getAssignmentsForStudent } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import JoinClassButton from "@/components/margins/JoinClassButton";
import RevealGroup from "@/components/margins/RevealGroup";

const TYPE_COLORS: Record<string, string> = {
  DBQ: "bg-violet-50 text-violet-600",
  LEQ: "bg-teal-50 text-teal-600",
  SAQ: "bg-amber-50 text-amber-600",
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  draft: "In progress",
  submitted: "Grading…",
  graded: "Graded",
};

const STATUS_COLOR: Record<string, string> = {
  not_started: "bg-stone-100 text-stone-500",
  draft: "bg-amber-50 text-amber-600",
  submitted: "bg-sky-50 text-sky-600",
  graded: "bg-emerald-50 text-emerald-600",
};

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "student") redirect("/margins/teacher");

  const [classes, assignments] = await Promise.all([
    getClassesByStudent(user.id),
    getAssignmentsForStudent(user.id),
  ]);

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="student" homeHref="/margins/student" />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-stone-900">Your classes</h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {classes.length === 0 ? "Join a class with the code your teacher gives you." : `${classes.length} class${classes.length === 1 ? "" : "es"}`}
            </p>
          </div>
          <JoinClassButton />
        </div>

        {classes.length > 0 && (
          <RevealGroup className="flex flex-wrap gap-2 mb-10" stagger={40} translateY={8}>
            {classes.map((c) => (
              <span
                key={c.id}
                className="reveal-item rounded-full border border-stone-100 bg-white px-3.5 py-1.5 text-sm text-stone-600"
                style={{ opacity: 0 }}
              >
                {c.name}
              </span>
            ))}
          </RevealGroup>
        )}

        <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Your assignments</h2>
        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center flex flex-col items-center gap-3">
            <NotebookPen size={26} className="text-stone-300" strokeWidth={1.5} />
            <p className="text-stone-400 text-sm">No assignments yet.</p>
          </div>
        ) : (
          <RevealGroup className="flex flex-col gap-2.5" stagger={60} translateY={14}>
            {assignments.map((a) => {
              const status = a.submission_status ?? "not_started";
              return (
                <Link
                  key={a.id}
                  href={`/margins/student/assignments/${a.id}`}
                  className="reveal-item group flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3.5 hover:border-violet-200 hover:shadow-sm transition-all"
                  style={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${TYPE_COLORS[a.essay_type]}`}>
                      {a.essay_type}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-stone-800 truncate">{a.title}</p>
                      <p className="text-xs text-stone-400">{a.class_name}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLOR[status]}`}>
                    {STATUS_LABEL[status]}
                  </span>
                </Link>
              );
            })}
          </RevealGroup>
        )}

        <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3 mt-10">Practice</h2>
        <RevealGroup className="flex flex-col gap-2.5" stagger={60} translateY={14}>
          <Link
            href="/margins/student/practice"
            className="reveal-item group flex items-center justify-between gap-3 rounded-xl border border-teal-100 bg-white px-4 py-3.5 hover:border-teal-300 hover:shadow-sm transition-all"
            style={{ opacity: 0 }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-600">
                SCOUT
              </span>
              <div className="min-w-0">
                <p className="font-medium text-stone-800">Build your SAQ skills</p>
                <p className="text-xs text-stone-400">Quick reps, instant feedback, no pressure.</p>
              </div>
            </div>
            <span className="shrink-0 text-teal-500 text-sm">→</span>
          </Link>
        </RevealGroup>
      </main>
    </div>
  );
}
