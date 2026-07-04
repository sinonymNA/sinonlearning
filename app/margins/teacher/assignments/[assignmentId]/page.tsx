import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAssignmentById, getClassById, getSubmissionsByAssignment, getGradingBySubmission } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";

const STATUS_LABEL: Record<string, string> = {
  draft: "Drafting",
  submitted: "Submitted — awaiting grade",
  graded: "Graded",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-stone-100 text-stone-500",
  submitted: "bg-amber-50 text-amber-600",
  graded: "bg-emerald-50 text-emerald-600",
};

export default async function TeacherAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "teacher") redirect("/margins/student");

  const { assignmentId } = await params;
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) notFound();
  const cls = await getClassById(assignment.class_id);
  if (!cls || cls.teacher_id !== user.id) notFound();

  const submissions = await getSubmissionsByAssignment(assignmentId);
  const withScores = await Promise.all(
    submissions.map(async (s) => ({
      ...s,
      grading: s.status === "graded" ? await getGradingBySubmission(s.id) : undefined,
    }))
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="teacher" homeHref="/margins/teacher" />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/margins/teacher/classes/${cls.id}`}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← {cls.name}
        </Link>
        <h1 className="mt-3 text-xl font-bold text-stone-900">{assignment.title}</h1>
        <p className="text-sm text-stone-400 mt-1 mb-8">{assignment.essay_type} · {submissions.length} submission{submissions.length === 1 ? "" : "s"}</p>

        {withScores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center">
            <p className="text-stone-400 text-sm">No students have started this assignment yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {withScores.map((s) => {
              const score = s.grading
                ? s.grading.teacher_override_score ?? s.grading.overall_score
                : null;
              return (
                <Link
                  key={s.id}
                  href={`/margins/teacher/submissions/${s.id}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3.5 hover:border-violet-200 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-stone-800">{s.student_name}</p>
                  <div className="flex items-center gap-3">
                    {score !== null && s.grading && (
                      <span className="text-sm font-semibold text-stone-700">
                        {score}/{s.grading.max_score}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLOR[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
