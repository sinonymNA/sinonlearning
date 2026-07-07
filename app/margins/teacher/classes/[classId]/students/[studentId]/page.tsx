import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassById, isStudentInClass, getUserById, getSkillMasteryForStudent } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import SkillMasteryPanel from "@/components/margins/SkillMasteryPanel";

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ classId: string; studentId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "teacher") redirect("/margins/student");

  const { classId, studentId } = await params;
  const cls = await getClassById(classId);
  if (!cls || cls.teacher_id !== user.id) notFound();

  const [inClass, student] = await Promise.all([
    isStudentInClass(classId, studentId),
    getUserById(studentId),
  ]);
  if (!inClass || !student) notFound();

  const mastery = await getSkillMasteryForStudent(studentId);

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

        <h1 className="mt-3 text-xl font-bold text-stone-900 mb-1">{student.name}</h1>
        <p className="text-sm text-stone-400 mb-8">
          Skill mastery from Scout practice reps — course-agnostic, so it'll carry over as new practice courses ship.
        </p>

        <SkillMasteryPanel mastery={mastery} />
      </main>
    </div>
  );
}
