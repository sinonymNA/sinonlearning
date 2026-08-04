import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAssignmentById, getClassById, getOrCreateDraftSubmission, isStudentInClass } from "@/lib/marginsDb";
import ApwhHeader from "@/components/apwh/ApwhHeader";
import ApwhClassNav from "@/components/apwh/ApwhClassNav";
import EssayEditor from "@/components/margins/EssayEditor";

export default async function ApwhAssignmentPage({ params }: { params: Promise<{ classId: string; assignmentId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/apwh/login");
  if (user.role !== "student") redirect("/apwh/teacher");
  const { classId, assignmentId } = await params;
  const [cls, assignment] = await Promise.all([getClassById(classId), getAssignmentById(assignmentId)]);
  if (!cls || !assignment || assignment.class_id !== classId || !(await isStudentInClass(classId, user.id))) notFound();
  const submission = await getOrCreateDraftSubmission(assignmentId, user.id);
  if (submission.status !== "draft") redirect(`/apwh/classes/${classId}/margins/submissions/${submission.id}`);
  return <div className="apwh-dashboard-page"><ApwhHeader name={user.name} role="student" /><main className="apwh-margins-editor"><ApwhClassNav classId={classId} active="margins" /><p className="apwh-editor-class">{cls.name} · {assignment.essay_type}</p><h1>{assignment.title}</h1><EssayEditor submissionId={submission.id} initialText={submission.essay_text} promptText={assignment.prompt_text} documents={assignment.documents} returnBase={`/apwh/classes/${classId}/margins`} /></main></div>;
}
