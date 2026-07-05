import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getSubmissionById, getAssignmentById, getGradingBySubmission, getAttemptChain } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import AnnotatedEssay from "@/components/margins/AnnotatedEssay";
import GradingReport from "@/components/margins/GradingReport";
import TriggerGradeButton from "@/components/margins/TriggerGradeButton";
import RevisionCTA from "@/components/margins/RevisionCTA";

export default async function StudentSubmissionPage({
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

  const grading = await getGradingBySubmission(submissionId);
  const chain = await getAttemptChain(assignment.id, user.id);
  const latest = chain[chain.length - 1];
  const isLatestAttempt = !latest || latest.id === submission.id;
  const remainingRevisions = assignment.max_revisions - (chain.length - 1);

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="student" homeHref="/margins/student" />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/margins/student" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          ← All assignments
        </Link>
        <h1 className="mt-3 mb-6 text-xl font-bold text-stone-900">
          {assignment.title}
          {submission.attempt_number > 1 && (
            <span className="text-stone-400 font-normal text-base"> (attempt {submission.attempt_number})</span>
          )}
        </h1>

        {!isLatestAttempt && (
          <Link
            href={`/margins/student/submissions/${latest.id}`}
            className="mb-6 block rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[13px] text-amber-700 hover:bg-amber-100 transition-colors"
          >
            This was a previous attempt — see your latest attempt →
          </Link>
        )}

        {!grading ? (
          <TriggerGradeButton submissionId={submissionId} />
        ) : (
          <div className="flex flex-col gap-6">
            <AnnotatedEssay essayText={submission.essay_text} annotations={grading.annotations} />
            <GradingReport
              overallScore={grading.overall_score}
              maxScore={grading.max_score}
              rubricBreakdown={grading.rubric_breakdown}
              overallFeedback={grading.overall_feedback}
              strengths={grading.strengths}
              nextSteps={grading.next_steps}
              teacherOverrideScore={grading.teacher_override_score}
              teacherNotes={grading.teacher_notes}
            />
            {isLatestAttempt && <RevisionCTA submissionId={submissionId} remaining={remainingRevisions} />}
          </div>
        )}
      </main>
    </div>
  );
}
