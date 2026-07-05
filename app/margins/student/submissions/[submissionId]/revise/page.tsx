import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getSubmissionById,
  getAssignmentById,
  getGradingBySubmission,
  getRevisionPlanBySubmission,
  getAttemptCount,
} from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import TriggerRevisionPlanButton from "@/components/margins/TriggerRevisionPlanButton";
import RevisionWizard from "@/components/margins/RevisionWizard";

export default async function ReviseSubmissionPage({
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

  const assignment = await getAssignmentById(submission.assignment_id);
  if (!assignment) notFound();

  if (submission.status !== "graded") redirect(`/margins/student/submissions/${submissionId}`);

  const attemptsUsed = (await getAttemptCount(assignment.id, user.id)) - 1;
  if (attemptsUsed >= assignment.max_revisions) redirect(`/margins/student/submissions/${submissionId}`);

  const grading = await getGradingBySubmission(submissionId);
  if (!grading) redirect(`/margins/student/submissions/${submissionId}`);

  const plan = await getRevisionPlanBySubmission(submissionId);

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="student" homeHref="/margins/student" />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href={`/margins/student/submissions/${submissionId}`}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← Back to your feedback
        </Link>
        <h1 className="mt-3 mb-2 text-xl font-bold text-stone-900">Revise: {assignment.title}</h1>
        <p className="text-sm text-stone-500 mb-8">
          Let&rsquo;s work through your growth areas one at a time — you&rsquo;ll plan each fix here, then write it
          into your essay.
        </p>

        {!plan ? (
          <TriggerRevisionPlanButton submissionId={submissionId} />
        ) : (
          <RevisionWizard
            gradedSubmissionId={submissionId}
            steps={plan.steps}
            initialCurrentStep={plan.current_step}
            initialResponses={plan.student_responses}
          />
        )}
      </main>
    </div>
  );
}
