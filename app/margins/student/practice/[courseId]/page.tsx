import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getOrCreatePracticeProgress } from "@/lib/marginsDb";
import { getPracticeCourse } from "@/lib/marginsPracticeCourses";
import MarginsHeader from "@/components/margins/MarginsHeader";
import PracticeCourseView from "@/components/margins/PracticeCourseView";

export default async function PracticeCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "student") redirect("/margins/teacher");

  const { courseId } = await params;
  const course = getPracticeCourse(courseId);
  if (!course) notFound();

  const progress = await getOrCreatePracticeProgress(user.id, courseId);

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="student" homeHref="/margins/student" />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-xl font-bold text-stone-900 mb-1">{course.title}</h1>
        <p className="text-sm text-stone-400 mb-6">{course.description}</p>

        <PracticeCourseView courseId={courseId} course={course} initialCurrentModule={progress.current_module} />
      </main>
    </div>
  );
}
