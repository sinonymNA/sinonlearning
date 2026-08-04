import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassById, getOrCreatePracticeProgress, getWritingMechanicsForStudent, isStudentInClass } from "@/lib/marginsDb";
import { getPracticeCourse } from "@/lib/marginsPracticeCourses";
import ApwhHeader from "@/components/apwh/ApwhHeader";
import ApwhClassNav from "@/components/apwh/ApwhClassNav";
import PracticeCourseView from "@/components/margins/PracticeCourseView";

export default async function ApwhPracticePage({ params }: { params: Promise<{ classId: string; courseId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/apwh/login");
  if (user.role !== "student") redirect("/apwh/teacher");
  const { classId, courseId } = await params;
  const [cls, member] = await Promise.all([getClassById(classId), isStudentInClass(classId, user.id)]);
  const course = getPracticeCourse(courseId);
  if (!cls || !member || !course) notFound();
  const [progress, mechanics] = await Promise.all([getOrCreatePracticeProgress(user.id, courseId), getWritingMechanicsForStudent(user.id)]);
  return <div className="apwh-dashboard-page"><ApwhHeader name={user.name} role="student" /><main className="apwh-margins-editor"><ApwhClassNav classId={classId} active="margins" /><p className="apwh-editor-class">{cls.name} · SCOUT&apos;S PRACTICE LAB</p><h1>{course.title}</h1><p className="apwh-course-description">{course.description}</p><PracticeCourseView courseId={courseId} course={course} initialCurrentModule={progress.current_module} initialCurrentPage={progress.current_page} initialMechanics={mechanics.map(({ skill, level }) => ({ skill, level }))} /></main></div>;
}
