import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ApwhClassNav from "@/components/apwh/ApwhClassNav";
import ApwhHeader from "@/components/apwh/ApwhHeader";
import RevisionWizard from "@/components/margins/RevisionWizard";
import TriggerRevisionPlanButton from "@/components/margins/TriggerRevisionPlanButton";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getAssignmentById,
  getAttemptCount,
  getGradingBySubmission,
  getRevisionPlanBySubmission,
  getSubmissionById,
  isStudentInClass,
} from "@/lib/marginsDb";

export default async function ApwhRevisePage({
  params,
}: {
  params: Promise<{ classId: string; submissionId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/apwh/login");
  if (user.role !== "student") redirect("/apwh/teacher");

  const { classId, submissionId } = await params;
  const submission = await getSubmissionById(submissionId);
  if (!submission || submission.student_id !== user.id || !(await isStudentInClass(classId, user.id))) notFound();

  const assignment = await getAssignmentById(submission.assignment_id);
  if (!assignment || assignment.class_id !== classId) notFound();

  const resultHref = `/apwh/classes/${classId}/margins/submissions/${submissionId}`;
  if (submission.status !== "graded") redirect(resultHref);
  if ((await getAttemptCount(assignment.id, user.id)) - 1 >= assignment.max_revisions) redirect(resultHref);

  const grading = await getGradingBySubmission(submissionId);
  if (!grading) redirect(resultHref);

  const plan = await getRevisionPlanBySubmission(submissionId);
  const returnBase = `/apwh/classes/${classId}/margins`;

  return (
    <div className="apwh-dashboard-page">
      <ApwhHeader name={user.name} role="student" />
      <main className="apwh-margins-results">
        <ApwhClassNav classId={classId} active="margins" />
        <Link href={resultHref} className="apwh-result-back">
          &larr; Back to your feedback
        </Link>
        <h1>Revise: {assignment.title}</h1>
        {!plan ? (
          <TriggerRevisionPlanButton submissionId={submissionId} />
        ) : (
          <RevisionWizard
            gradedSubmissionId={submissionId}
            steps={plan.steps}
            initialCurrentStep={plan.current_step}
            initialResponses={plan.student_responses}
            returnBase={returnBase}
          />
        )}
      </main>
    </div>
  );
}
