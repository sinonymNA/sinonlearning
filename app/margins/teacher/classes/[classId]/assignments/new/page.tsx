import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassById } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import AssignmentWizard from "@/components/margins/AssignmentWizard";

export default async function NewAssignmentPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "teacher") redirect("/margins/student");

  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls || cls.teacher_id !== user.id) notFound();

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="teacher" homeHref="/margins/teacher" />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href={`/margins/teacher/classes/${cls.id}`}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← {cls.name}
        </Link>
        <h1 className="mt-3 text-xl font-bold text-stone-900">New assignment</h1>
        <p className="text-sm text-stone-400 mt-1 mb-8">
          Rubric fields are pre-filled from the College Board's published AP World History: Modern
          scoring guidelines — edit the wording to fit your unit.
        </p>

        <AssignmentWizard classId={cls.id} />
      </main>
    </div>
  );
}
