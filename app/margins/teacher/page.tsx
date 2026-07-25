import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ArrowRight, GraduationCap, FileText, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getClassSummariesByTeacher,
  getRecentActivityForTeacher,
  getDistinctStudentCountForTeacher,
} from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import NewClassButton from "@/components/margins/NewClassButton";
import RevealGroup from "@/components/margins/RevealGroup";
import RelayLaunchCard from "@/components/margins/RelayLaunchCard";
import EmptyState from "@/components/margins/EmptyState";
import TeacherStatRow from "@/components/margins/TeacherStatRow";
import { accentForKey } from "@/components/margins/moduleThemes";

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  submitted: { label: "Needs grading", cls: "bg-amber-50 text-amber-700" },
  graded: { label: "Graded", cls: "bg-emerald-50 text-emerald-600" },
};

// Teachers overwhelmingly register with an honorific, and "Welcome back, Ms."
// is worse than no greeting at all. Keep the title attached to the surname.
const HONORIFICS = new Set(["mr", "mr.", "mrs", "mrs.", "ms", "ms.", "miss", "dr", "dr.", "prof", "prof.", "coach"]);

function greetingName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "there";
  if (parts.length > 1 && HONORIFICS.has(parts[0].toLowerCase())) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0];
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "teacher") redirect("/margins/student");

  const [classes, activity, studentCount] = await Promise.all([
    getClassSummariesByTeacher(user.id),
    getRecentActivityForTeacher(user.id),
    getDistinctStudentCountForTeacher(user.id),
  ]);

  // Assignments and pending work sum cleanly across classes; students do not —
  // one student in two of your classes is still one student, so that count
  // comes from its own DISTINCT query.
  const totals = classes.reduce(
    (acc, c) => ({
      assignments: acc.assignments + c.assignment_count,
      awaiting: acc.awaiting + c.awaiting_count,
    }),
    { assignments: 0, awaiting: 0 }
  );

  const displayName = greetingName(user.name);

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="teacher" homeHref="/margins/teacher" />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-900">
              {classes.length === 0 ? `Welcome, ${displayName}` : `Welcome back, ${displayName}`}
            </h1>
            <p className="mt-0.5 text-sm text-stone-400">
              {totals.awaiting > 0
                ? `${totals.awaiting} submission${totals.awaiting === 1 ? "" : "s"} waiting on you.`
                : classes.length === 0
                  ? "Create a class, share the code, and build assignments."
                  : "Nothing waiting — you're all caught up."}
            </p>
          </div>
          <NewClassButton />
        </div>

        {classes.length > 0 && (
          <RevealGroup className="mb-9" stagger={0} translateY={12}>
            <div className="reveal-item" style={{ opacity: 0 }}>
              <TeacherStatRow
                studentCount={studentCount}
                assignmentCount={totals.assignments}
                awaitingCount={totals.awaiting}
              />
            </div>
          </RevealGroup>
        )}

        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-stone-400">
          Your classes
        </h2>

        {classes.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            accent={accentForKey("students")}
            title="Start with a class"
            body="A class gives you a join code to hand out. Once students are in, you can set DBQ, LEQ, and SAQ assignments and KORA grades every draft against the College Board rubric."
            action={<NewClassButton />}
            hints={["Takes about a minute", "Students join with a code — no setup for them"]}
          />
        ) : (
          <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2" stagger={70} translateY={16}>
            {classes.map((cls) => {
              const accent = accentForKey(cls.id);
              return (
                <Link
                  key={cls.id}
                  href={`/margins/teacher/classes/${cls.id}`}
                  className={`reveal-item group rounded-2xl border border-stone-100 bg-white p-5 transition-all hover:shadow-md ${accent.hoverBorder}`}
                  style={{ opacity: 0 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* Colour is the class's identity, hashed from its id so it
                          survives creating or deleting a sibling. */}
                      <span className={`mb-2 block h-1.5 w-8 rounded-full ${accent.pill}`} />
                      <h3 className="truncate font-semibold text-stone-900">{cls.name}</h3>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-400">
                        <Users size={12} />
                        Join code:{" "}
                        <span className={`font-mono font-semibold ${accent.labelText}`}>{cls.join_code}</span>
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="mt-1 shrink-0 text-stone-300 transition-colors group-hover:text-stone-500"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-stone-100 pt-3 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {cls.student_count} student{cls.student_count === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={11} /> {cls.assignment_count} assignment{cls.assignment_count === 1 ? "" : "s"}
                    </span>
                    {cls.awaiting_count > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                        <Clock size={10} /> {cls.awaiting_count} to grade
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </RevealGroup>
        )}

        {activity.length > 0 && (
          <RevealGroup className="mt-10" stagger={50} translateY={12}>
            <h2 className="reveal-item mb-3 text-[11px] font-bold uppercase tracking-widest text-stone-400" style={{ opacity: 0 }}>
              Recent activity
            </h2>
            <div className="reveal-item overflow-hidden rounded-2xl border border-stone-100 bg-white" style={{ opacity: 0 }}>
              {activity.map((a, i) => {
                const status = STATUS_STYLE[a.status] ?? { label: a.status, cls: "bg-stone-100 text-stone-500" };
                return (
                  <Link
                    key={a.submission_id}
                    href={`/margins/teacher/submissions/${a.submission_id}`}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-stone-50 ${i > 0 ? "border-t border-stone-100" : ""}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] text-stone-800">
                        <span className="font-semibold">{a.student_name}</span>
                        <span className="text-stone-400"> · {a.assignment_title}</span>
                      </span>
                      <span className="block truncate text-[11px] text-stone-400">
                        {a.essay_type} · {a.class_name} · {timeAgo(a.happened_at)}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.cls}`}>
                      {status.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </RevealGroup>
        )}

        <RevealGroup className="mt-10" stagger={0} translateY={16}>
          <div className="reveal-item" style={{ opacity: 0 }}>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-stone-400">
              Run it live
            </h2>
            <RelayLaunchCard role="teacher" />
          </div>
        </RevealGroup>
      </main>
    </div>
  );
}
