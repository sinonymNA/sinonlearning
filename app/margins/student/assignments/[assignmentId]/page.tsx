import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAssignmentById, getClassById, isStudentInClass, getOrCreateDraftSubmission } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import EssayEditor from "@/components/margins/EssayEditor";

export default async function StudentAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "student") redirect("/margins/teacher");

  const { assignmentId } = await params;
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) notFound();

  const cls = await getClassById(assignment.class_id);
  if (!cls) notFound();
  const member = await isStudentInClass(cls.id, user.id);
  if (!member) notFound();

  const submission = await getOrCreateDraftSubmission(assignmentId, user.id);
  if (submission.status !== "draft") {
    redirect(`/margins/student/submissions/${submission.id}`);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="student" homeHref="/margins/student" />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/margins/student" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          ← {cls.name}
        </Link>
        <h1 className="mt-3 mb-6 text-xl font-bold text-stone-900">{assignment.title}</h1>

        <EssayEditor
          submissionId={submission.id}
          initialText={submission.essay_text}
          promptText={assignment.prompt_text}
          documents={assignment.documents}
        />
      </main>
    </div>
  );
}
