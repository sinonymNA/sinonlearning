import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassesByTeacher } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import LearningLabAuthor from "@/components/margins/LearningLabAuthor";

export default async function LearningLabTeacherPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "teacher") redirect("/margins/student");
  const classes = await getClassesByTeacher(user.id);
  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="teacher" homeHref="/margins/teacher" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-bold text-stone-900">Learning Lab</h1>
        <p className="mt-1 mb-8 text-sm text-stone-500">Create teacher-directed Practice &amp; Relearn assignments.</p>
        {classes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center text-sm text-stone-500">Create a class first.</div>
        ) : (
          <LearningLabAuthor classId={classes[0].id} />
        )}
      </main>
    </div>
  );
}
