import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, BookOpenCheck, FilePenLine, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getAssignmentsByClass, getAssignmentsForStudent, getClassById,
  isStudentInClass,
} from "@/lib/marginsDb";
import { PRACTICE_COURSES } from "@/lib/marginsPracticeCourses";
import ApwhHeader from "@/components/apwh/ApwhHeader";
import ApwhClassNav from "@/components/apwh/ApwhClassNav";

const statusLabel: Record<string, string> = {
  draft: "Continue draft", submitted: "Submitted", graded: "Feedback ready",
};

export default async function ApwhMarginsPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/apwh/login");
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();
  const preview = user.role === "teacher" && (await searchParams).preview === "student";
  if (user.role === "teacher") {
    if (cls.teacher_id !== user.id) notFound();
  } else if (!(await isStudentInClass(classId, user.id))) notFound();

  const assignments = user.role === "student"
    ? (await getAssignmentsForStudent(user.id)).filter((item) => item.class_id === classId)
    : await getAssignmentsByClass(classId);

  return (
    <div className="apwh-dashboard-page">
      <ApwhHeader name={user.name} role={user.role} />
      <main className="apwh-margins-page">
        {preview && <div className="apwh-preview-mode"><strong>Student demo</strong><span>This is the class-scoped Margins experience. Assignments are read-only in preview.</span><Link href={`/apwh/teacher/classes/${classId}`}>Exit demo</Link></div>}
        <div className="apwh-margins-masthead"><div><span>MARGINS · {cls.name.toUpperCase()}</span><h1>Write history.<br />See your next move.</h1><p>Every assignment, draft, and practice course stays connected to this AP World class.</p></div><div className="apwh-margin-glyph" aria-hidden="true"><i /><span>M</span></div></div>
        <ApwhClassNav classId={classId} active="margins" preview={preview} />

        <section className="apwh-margins-section">
          <header><div><span>CLASS ASSIGNMENTS</span><h2>On your desk</h2></div><small>{assignments.length} assignment{assignments.length === 1 ? "" : "s"}</small></header>
          {assignments.length ? <div className="apwh-margins-assignments">{assignments.map((assignment, index) => {
            const status = (assignment as { submission_status?: string | null }).submission_status ?? null;
            return <Link key={assignment.id} href={preview ? "#" : `/apwh/classes/${classId}/margins/assignments/${assignment.id}`} aria-disabled={preview}>
              <span className="apwh-assignment-index">{String(index + 1).padStart(2, "0")}</span>
              <span className={`apwh-type-tag type-${assignment.essay_type.toLowerCase()}`}>{assignment.essay_type}</span>
              <div><strong>{assignment.title}</strong><small>{status ? statusLabel[status] : "Ready to begin"}</small></div>
              <ArrowRight />
            </Link>;
          })}</div> : <div className="apwh-no-margins-work"><BookOpenCheck /><div><strong>Your desk is clear.</strong><p>Your teacher&apos;s next DBQ, LEQ, or SAQ will appear here.</p></div></div>}
        </section>

        <section className="apwh-margins-section" id="practice">
          <header><div><span>SCOUT&apos;S PRACTICE LAB</span><h2>Build it one sentence at a time</h2></div><Sparkles /></header>
          <div className="apwh-practice-cards">{PRACTICE_COURSES.map((course, index) => <Link key={course.id} href={preview ? "#" : `/apwh/classes/${classId}/margins/practice/${course.id}`} aria-disabled={preview}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{course.title}</strong><p>{course.description}</p></div><FilePenLine /></Link>)}</div>
        </section>
      </main>
    </div>
  );
}
