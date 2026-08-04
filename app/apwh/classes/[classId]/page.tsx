import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, FilePenLine,
  Gamepad2, LibraryBig, Map, MessageSquareQuote, Radio, Sparkles,
} from "lucide-react";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getAssignmentsForStudent, getClassById, getClassesByStudent,
  isStudentInClass,
} from "@/lib/marginsDb";
import { ensureApwhProfile, getDispatch, getLatestDispatch } from "@/lib/apwhDb";
import { daysUntil, displaySchoolDate, easternDateString } from "@/lib/apwhDate";
import ApwhHeader from "@/components/apwh/ApwhHeader";

const statusLabel: Record<string, string> = {
  draft: "In progress", submitted: "Submitted", graded: "Feedback ready",
};

export default async function ApwhClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/apwh/login");
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  if (user.role === "teacher") {
    if (cls.teacher_id !== user.id) notFound();
  } else if (!(await isStudentInClass(classId, user.id))) {
    notFound();
  }

  const today = easternDateString();
  const [profile, todaysDispatch, assignments, studentClasses] = await Promise.all([
    ensureApwhProfile(classId),
    getDispatch(classId, today),
    user.role === "student" ? getAssignmentsForStudent(user.id) : Promise.resolve([]),
    user.role === "student" ? getClassesByStudent(user.id) : Promise.resolve([]),
  ]);
  const dispatch = todaysDispatch ?? await getLatestDispatch(classId);
  const classAssignments = assignments.filter((assignment) => assignment.class_id === classId).slice(0, 4);
  const examDays = daysUntil(profile.exam_date);
  const fallbackAgenda = ["Check the board for your warm-up", "Open today's class materials", "Complete your exit reflection"];

  return (
    <div className="apwh-dashboard-page">
      <ApwhHeader name={user.name} role={user.role} />
      <main className="apwh-dashboard">
        <div className="apwh-dashboard-topline">
          <div>
            <span className="apwh-class-label">{profile.course_title}</span>
            <h1>{cls.name}{profile.period_label ? ` · ${profile.period_label}` : ""}</h1>
          </div>
          <div className="apwh-topline-meta">
            <span><CalendarDays size={15} /> {displaySchoolDate(today)}</span>
            {examDays !== null && <span className="apwh-exam-chip"><strong>{examDays}</strong> days to the AP exam</span>}
            {user.role === "teacher" && <Link href={`/apwh/teacher/classes/${classId}`}>Edit dispatch</Link>}
          </div>
        </div>

        {studentClasses.length > 1 && (
          <nav className="apwh-class-switcher" aria-label="Your classes">
            {studentClasses.map((item) => <Link key={item.id} href={`/apwh/classes/${item.id}`} className={item.id === classId ? "active" : ""}>{item.name}</Link>)}
          </nav>
        )}

        <section className="apwh-dispatch-grid">
          <article className="apwh-daily-dispatch">
            <div className="apwh-dispatch-watermark" aria-hidden="true">{today.slice(5).replace("-", ".")}</div>
            <header>
              <span>{dispatch?.eyebrow ?? "TODAY IN AP WORLD"}</span>
              <small>{profile.current_unit}</small>
            </header>
            <h2>{dispatch?.title ?? "Your next chapter begins here."}</h2>
            <p className="apwh-objective">{dispatch?.objective || "Your teacher will post today's historical question and objective here."}</p>
            <div className="apwh-agenda">
              <p>THE ROUTE</p>
              <ol>{(dispatch?.agenda?.length ? dispatch.agenda : fallbackAgenda).map((item, index) => <li key={`${item}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol>
            </div>
            <Link href={dispatch?.start_href ?? "/margins/student"} className="apwh-dispatch-cta">
              <span><small>START HERE</small><strong>{dispatch?.start_label ?? "Open today's work"}</strong></span>
              <ArrowRight size={24} />
            </Link>
          </article>

          <aside className="apwh-dashboard-rail">
            {dispatch?.announcement && (
              <article className="apwh-announcement">
                <MessageSquareQuote size={21} /><div><span>FROM YOUR TEACHER</span><p>{dispatch.announcement}</p></div>
              </article>
            )}
            <article className="apwh-field-kit">
              <header><span>THE FIELD KIT</span><small>Tools for today</small></header>
              <div>
                <Link href="/margins/student/practice"><FilePenLine /><span><strong>SAQ Studio</strong><small>Build the next sentence</small></span><ArrowRight /></Link>
                <Link href="/tools/source-room/join"><LibraryBig /><span><strong>Source Room</strong><small>Analyze evidence live</small></span><ArrowRight /></Link>
                <Link href="/margins/relay/join"><Radio /><span><strong>Essay Relay</strong><small>Write as a team</small></span><ArrowRight /></Link>
                <Link href="/capsule"><Gamepad2 /><span><strong>Capsule</strong><small>Review through play</small></span><ArrowRight /></Link>
              </div>
            </article>
            <article className="apwh-unit-card">
              <Map size={22} />
              <span><small>WHERE WE ARE</small><strong>{profile.current_unit}</strong><em>{profile.school_year}</em></span>
            </article>
          </aside>
        </section>

        <section className="apwh-work-section">
          <header><div><span>YOUR WORK</span><h2>Writing in progress</h2></div><Link href="/margins/student">Open Margins <ArrowRight size={15} /></Link></header>
          {classAssignments.length ? (
            <div className="apwh-assignment-list">
              {classAssignments.map((assignment) => (
                <Link href={`/margins/student/assignments/${assignment.id}`} key={assignment.id}>
                  <span className={`apwh-type-tag type-${assignment.essay_type.toLowerCase()}`}>{assignment.essay_type}</span>
                  <div><strong>{assignment.title}</strong><small>{assignment.submission_status ? statusLabel[assignment.submission_status] : "Not started"}</small></div>
                  {assignment.submission_status === "graded" ? <Sparkles /> : assignment.submission_status === "submitted" ? <Clock3 /> : <CheckCircle2 />}
                </Link>
              ))}
            </div>
          ) : (
            <div className="apwh-empty-work"><BookOpen /><div><strong>No writing assignment is waiting.</strong><p>Use SAQ Studio for low-stakes practice whenever you want.</p></div><Link href="/margins/student/practice">Practice now</Link></div>
          )}
        </section>
      </main>
    </div>
  );
}
