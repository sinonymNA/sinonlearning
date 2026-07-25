import { Users, FileText, Clock } from "lucide-react";
import { accentForKey } from "./moduleThemes";

// Three numbers at the top of the teacher dashboard. Deliberately only three —
// this is orientation, not analytics. The one that matters is "awaiting you",
// which is the reason a teacher opens this page at all, so it gets emphasis
// when it's non-zero and goes quiet when there's nothing to do.

interface Props {
  studentCount: number;
  assignmentCount: number;
  awaitingCount: number;
}

export default function TeacherStatRow({ studentCount, assignmentCount, awaitingCount }: Props) {
  const tiles = [
    { key: "students", icon: Users, label: studentCount === 1 ? "Student" : "Students", value: studentCount },
    { key: "assignments", icon: FileText, label: assignmentCount === 1 ? "Assignment" : "Assignments", value: assignmentCount },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((t) => {
        const accent = accentForKey(t.key);
        return (
          <div key={t.key} className="rounded-2xl border border-stone-100 bg-white p-4">
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconText}`}>
              <t.icon size={15} strokeWidth={2} />
            </span>
            <p className="mt-2.5 text-[26px] font-bold leading-none text-stone-900 tabular-nums">{t.value}</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-stone-400">{t.label}</p>
          </div>
        );
      })}

      {/* Awaiting: the actionable one. Amber only when there's actually work. */}
      <div
        className={[
          "rounded-2xl border p-4 transition-colors",
          awaitingCount > 0 ? "border-amber-200 bg-amber-50" : "border-stone-100 bg-white",
        ].join(" ")}
      >
        <span
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-lg",
            awaitingCount > 0 ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-400",
          ].join(" ")}
        >
          <Clock size={15} strokeWidth={2} />
        </span>
        <p
          className={[
            "mt-2.5 text-[26px] font-bold leading-none tabular-nums",
            awaitingCount > 0 ? "text-amber-800" : "text-stone-900",
          ].join(" ")}
        >
          {awaitingCount}
        </p>
        <p
          className={[
            "mt-1 text-[11px] font-medium uppercase tracking-wider",
            awaitingCount > 0 ? "text-amber-700" : "text-stone-400",
          ].join(" ")}
        >
          Awaiting you
        </p>
      </div>
    </div>
  );
}
