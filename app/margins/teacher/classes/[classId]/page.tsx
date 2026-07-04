import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassById, getClassRoster, getAssignmentsByClass } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";

const TYPE_COLORS: Record<string, string> = {
  DBQ: "bg-violet-50 text-violet-600",
  LEQ: "bg-teal-50 text-teal-600",
  SAQ: "bg-amber-50 text-amber-600",
};

export default async function TeacherClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "teacher") redirect("/margins/student");

  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls || cls.teacher_id !== user.id) notFound();

  const [roster, assignments] = await Promise.all([
    getClassRoster(cls.id),
    getAssignmentsByClass(cls.id),
  ]);

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="teacher" homeHref="/margins/teacher" />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/margins/teacher" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          ← All classes
        </Link>

        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">{cls.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-400">
              <Users size={13} />
              Join code: <span className="font-mono font-semibold text-rose-600">{cls.join_code}</span>
              <span className="text-stone-300">·</span>
              {roster.length} student{roster.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href={`/margins/teacher/classes/${cls.id}/assignments/new`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-200 hover:shadow-md transition-all shrink-0"
          >
            <Plus size={14} />
            New assignment
          </Link>
        </div>

        <section className="mt-8">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Assignments</h2>
          {assignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center">
              <p className="text-stone-400 text-sm">No assignments yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {assignments.map((a) => (
                <Link
                  key={a.id}
                  href={`/margins/teacher/assignments/${a.id}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3.5 hover:border-rose-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${TYPE_COLORS[a.essay_type]}`}>
                      {a.essay_type}
                    </span>
                    <p className="font-medium text-stone-800 truncate">{a.title}</p>
                  </div>
                  <FileText size={14} className="text-stone-300 group-hover:text-rose-500 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Roster</h2>
          {roster.length === 0 ? (
            <p className="text-sm text-stone-400">Share the join code above with your students.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roster.map((s) => (
                <span key={s.id} className="rounded-full border border-stone-100 bg-white px-3.5 py-1.5 text-sm text-stone-600">
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
