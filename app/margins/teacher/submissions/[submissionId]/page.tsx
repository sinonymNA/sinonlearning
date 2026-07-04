import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  getCurrentUser,
} from "@/lib/marginsAuth";
import {
  getSubmissionById,
  getAssignmentById,
  getClassById,
  getGradingBySubmission,
  getUserById,
} from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import AnnotatedEssay from "@/components/margins/AnnotatedEssay";
import GradingReport from "@/components/margins/GradingReport";
import OverrideScoreForm from "@/components/margins/OverrideScoreForm";
import TriggerGradeButton from "@/components/margins/TriggerGradeButton";

export default async function TeacherSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "teacher") redirect("/margins/student");

  const { submissionId } = await params;
  const submission = await getSubmissionById(submissionId);
  if (!submission) notFound();

  const assignment = await getAssignmentById(submission.assignment_id);
  if (!assignment) notFound();
  const cls = await getClassById(assignment.class_id);
  if (!cls || cls.teacher_id !== user.id) notFound();

  const [student, grading] = await Promise.all([
    getUserById(submission.student_id),
    getGradingBySubmission(submissionId),
  ]);

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="teacher" homeHref="/margins/teacher" />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/margins/teacher/assignments/${assignment.id}`}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← {assignment.title}
        </Link>
        <h1 className="mt-3 mb-8 text-xl font-bold text-stone-900">
          {student?.name ?? "Student"}&rsquo;s {assignment.essay_type}
        </h1>

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
            <OverrideScoreForm
              submissionId={submissionId}
              currentScore={grading.teacher_override_score ?? grading.overall_score}
              maxScore={grading.max_score}
              currentNotes={grading.teacher_notes}
            />
            <AnnotatedEssay essayText={submission.essay_text} annotations={grading.annotations} />
          </div>
        )}
      </main>
    </div>
  );
}
