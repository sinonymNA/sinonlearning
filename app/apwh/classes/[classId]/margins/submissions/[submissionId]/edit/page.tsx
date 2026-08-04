import { notFound, redirect } from "next/navigation";
import ApwhClassNav from "@/components/apwh/ApwhClassNav";
import ApwhHeader from "@/components/apwh/ApwhHeader";
import EssayEditor from "@/components/margins/EssayEditor";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getAssignmentById,
  getRevisionPlanBySubmission,
  getSubmissionById,
  isStudentInClass,
} from "@/lib/marginsDb";

export default async function ApwhRevisionEditPage({
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
  if (submission.status !== "draft") redirect(`/apwh/classes/${classId}/margins/submissions/${submissionId}`);

  const assignment = await getAssignmentById(submission.assignment_id);
  if (!assignment || assignment.class_id !== classId) notFound();

  const plan = submission.parent_submission_id
    ? await getRevisionPlanBySubmission(submission.parent_submission_id)
    : undefined;
  const checklist = plan?.steps.map((step, index) => ({
    restatement: step.restatement,
    response: plan.student_responses[index] ?? "",
  }));

  return (
    <div className="apwh-dashboard-page">
      <ApwhHeader name={user.name} role="student" />
      <main className="apwh-margins-editor">
        <ApwhClassNav classId={classId} active="margins" />
        <p className="apwh-editor-class">REVISION &middot; ATTEMPT {submission.attempt_number}</p>
        <h1>Revising: {assignment.title}</h1>
        <EssayEditor
          submissionId={submission.id}
          initialText={submission.essay_text}
          promptText={assignment.prompt_text}
          documents={assignment.documents}
          revisionChecklist={checklist}
          returnBase={`/apwh/classes/${classId}/margins`}
        />
      </main>
    </div>
  );
}
