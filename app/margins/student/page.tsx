import { redirect } from "next/navigation";
import Link from "next/link";
import { NotebookPen, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassesByStudent, getAssignmentsForStudent } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import JoinClassButton from "@/components/margins/JoinClassButton";
import RevealGroup from "@/components/margins/RevealGroup";
import RelayLaunchCard from "@/components/margins/RelayLaunchCard";

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

        <RevealGroup className="mt-10 flex flex-col gap-3" stagger={70} translateY={16}>
          <div className="reveal-item" style={{ opacity: 0 }}>
            <RelayLaunchCard role="student" />
          </div>
          <Link
            href="/margins/student/practice"
            className="reveal-item group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-teal-700/20 bg-gradient-to-br from-teal-600 via-teal-700 to-violet-700 px-6 py-6 shadow-md shadow-teal-900/10 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            style={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }}
            />
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
            <div className="absolute -right-3 bottom-0 h-20 w-20 rounded-full bg-white/10" />
            <span className="relative shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 text-white ring-1 ring-white/30 rotate-[-6deg] shadow-sm">
              <Search size={24} strokeWidth={2} />
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal-100">Practice with Scout · not graded</p>
              <p className="text-lg font-bold text-white mt-1">How to Write an SAQ</p>
              <p className="text-[13px] text-teal-50/90 mt-0.5">
                Solve a mystery, one sentence at a time — the &ldquo;Claim to Point&rdquo; course.
              </p>
            </div>
            <span className="relative shrink-0 text-white text-lg group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </RevealGroup>
      </main>
    </div>
  );
}
