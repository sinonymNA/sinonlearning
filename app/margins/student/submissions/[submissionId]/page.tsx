import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getSubmissionById, getAssignmentById, getGradingBySubmission } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import AnnotatedEssay from "@/components/margins/AnnotatedEssay";
import GradingReport from "@/components/margins/GradingReport";
import TriggerGradeButton from "@/components/margins/TriggerGradeButton";

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

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="student" homeHref="/margins/student" />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/margins/student" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          ← All assignments
        </Link>
        <h1 className="mt-3 mb-8 text-xl font-bold text-stone-900">{assignment.title}</h1>

        {!grading ? (
          <TriggerGradeButton submissionId={submissionId} />
        ) : (
          <div className="flex flex-col gap-6">
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
            <AnnotatedEssay essayText={submission.essay_text} annotations={grading.annotations} />
          </div>
        )}
      </main>
    </div>
  );
}
