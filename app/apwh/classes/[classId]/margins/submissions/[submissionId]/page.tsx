import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAssignmentById, getAttemptChain, getGradingBySubmission, getSubmissionById, isStudentInClass } from "@/lib/marginsDb";
import ApwhHeader from "@/components/apwh/ApwhHeader";
import ApwhClassNav from "@/components/apwh/ApwhClassNav";
import AnnotatedEssay from "@/components/margins/AnnotatedEssay";
import GradingReport from "@/components/margins/GradingReport";
import TriggerGradeButton from "@/components/margins/TriggerGradeButton";
import RevisionCTA from "@/components/margins/RevisionCTA";

export default async function ApwhSubmissionPage({ params }: { params: Promise<{ classId: string; submissionId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/apwh/login");
  if (user.role !== "student") redirect("/apwh/teacher");
  const { classId, submissionId } = await params;
  const submission = await getSubmissionById(submissionId);
  if (!submission || submission.student_id !== user.id || !(await isStudentInClass(classId, user.id))) notFound();
  const assignment = await getAssignmentById(submission.assignment_id);
  if (!assignment || assignment.class_id !== classId) notFound();
  const [grading, chain] = await Promise.all([getGradingBySubmission(submissionId), getAttemptChain(assignment.id, user.id)]);
  const latest = chain[chain.length - 1];
  const isLatest = !latest || latest.id === submission.id;
  return <div className="apwh-dashboard-page"><ApwhHeader name={user.name} role="student" /><main className="apwh-margins-results"><ApwhClassNav classId={classId} active="margins" /><Link href={`/apwh/classes/${classId}/margins`} className="apwh-result-back">← {assignment.essay_type} desk</Link><h1>{assignment.title}</h1>{!grading ? <TriggerGradeButton submissionId={submissionId} /> : <div className="apwh-result-stack"><AnnotatedEssay essayText={submission.essay_text} annotations={grading.annotations} /><GradingReport overallScore={grading.overall_score} maxScore={grading.max_score} rubricBreakdown={grading.rubric_breakdown} overallFeedback={grading.overall_feedback} strengths={grading.strengths} nextSteps={grading.next_steps} teacherOverrideScore={grading.teacher_override_score} teacherNotes={grading.teacher_notes} essayType={assignment.essay_type} />{isLatest && <RevisionCTA submissionId={submissionId} remaining={assignment.max_revisions - (chain.length - 1)} returnBase={`/apwh/classes/${classId}/margins`} />}</div>}</main></div>;
}
