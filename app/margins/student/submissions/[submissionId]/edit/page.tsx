import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getSubmissionById, getAssignmentById, getRevisionPlanBySubmission } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import EssayEditor from "@/components/margins/EssayEditor";

export default async function EditRevisionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "student") redirect("/margins/teacher");

  const { submissionId } = await params;
  const submission = await getSubmissionById(submissionId);
  if (!submission || submission.student_id !== user.id) notFound();
  if (submission.status !== "draft") redirect(`/margins/student/submissions/${submissionId}`);

  const assignment = await getAssignmentById(submission.assignment_id);
  if (!assignment) notFound();

  // The revision plan (restatement + student's response for each step) is
  // keyed by the graded parent submission, not this new draft.
  const plan = submission.parent_submission_id
    ? await getRevisionPlanBySubmission(submission.parent_submission_id)
    : undefined;
  const revisionChecklist = plan?.steps.map((step, i) => ({
    restatement: step.restatement,
    response: plan.student_responses[i] ?? "",
  }));

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="student" homeHref="/margins/student" />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/margins/student" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          ← All assignments
        </Link>
        <h1 className="mt-3 mb-6 text-xl font-bold text-stone-900">
          Revising: {assignment.title} <span className="text-stone-400 font-normal">(attempt {submission.attempt_number})</span>
        </h1>

        <EssayEditor
          submissionId={submission.id}
          initialText={submission.essay_text}
          promptText={assignment.prompt_text}
          documents={assignment.documents}
          revisionChecklist={revisionChecklist}
        />
      </main>
    </div>
  );
}
