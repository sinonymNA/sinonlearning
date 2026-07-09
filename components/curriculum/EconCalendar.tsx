"use client";

import { useMemo, useState } from "react";
import FadeIn from "@/components/FadeIn";
import { calendarDays, economicsUnits, type CalendarDay, type CalendarDayType } from "@/data/economicsCourse";

const MONTHS: { year: number; month: number; label: string }[] = [
  { year: 2026, month: 7, label: "August 2026" },
  { year: 2026, month: 8, label: "September 2026" },
  { year: 2026, month: 9, label: "October 2026" },
  { year: 2026, month: 10, label: "November 2026" },
  { year: 2026, month: 11, label: "December 2026" },
];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const TYPE_LABEL: Record<CalendarDayType, string> = {
  lesson: "Lesson",
  inquiry: "Inquiry day",
  flex: "Flex / review",
  exam: "Exam",
  presentation: "Presentation",
  buffer: "Buffer",
  break: "Break",
};

const TYPE_STYLES: Record<CalendarDayType, string> = {
  lesson: "border-navy-900/10 bg-white hover:border-econ-300",
  inquiry: "border-amber-200 bg-amber-50 hover:border-amber-300",
  flex: "border-stone-200 bg-stone-50 hover:border-stone-300",
  exam: "border-rose-200 bg-rose-50 hover:border-rose-300",
  presentation: "border-violet-200 bg-violet-50 hover:border-violet-300",
  buffer: "border-stone-200 bg-stone-100/60 hover:border-stone-300",
  break: "border-stone-200 bg-stone-100/60 hover:border-stone-300",
};

const LEGEND: { type: CalendarDayType; label: string }[] = [
  { type: "lesson", label: "Lesson" },
  { type: "inquiry", label: "Inquiry Day" },
  { type: "flex", label: "Flex / Review" },
  { type: "exam", label: "Exam" },
  { type: "presentation", label: "Presentation" },
  { type: "buffer", label: "Buffer / Break" },
];

function buildMonthGrid(year: number, month: number, byDate: Map<string, CalendarDay>) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (CalendarDay | null)[][] = [];
  let currentWeek: (CalendarDay | null)[] = [null, null, null, null, null];
  let lastCol = -1;
  let hasContent = false;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    const col = dow - 1;
    if (col <= lastCol) {
      if (hasContent) weeks.push(currentWeek);
      currentWeek = [null, null, null, null, null];
      hasContent = false;
    }
    const iso = date.toISOString().slice(0, 10);
    const entry = byDate.get(iso);
    currentWeek[col] = entry ?? { date: iso, title: "", type: "buffer" as CalendarDayType };
    lastCol = col;
    hasContent = true;
  }
  if (hasContent) weeks.push(currentWeek);
  return weeks;
}

function formatFullDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function EconCalendar() {
  const [selected, setSelected] = useState<CalendarDay | null>(
    calendarDays.find((d) => d.date === "2026-08-05") ?? null
  );

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const d of calendarDays) map.set(d.date, d);
    return map;
  }, []);

  const unitForSelected = selected?.unit
    ? economicsUnits.find((u) => u.number === selected.unit)
    : undefined;

  return (
    <section className="bg-cream-50 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-econ-700">
            Semester at a glance
          </span>
          <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
            Aug 5 – Dec 18, 2026 &middot; 80 scheduled days
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-700/70">
            Tap any day to see what's actually taught. Every lesson, exam, flex day, and break is
            mapped out for the full semester.
          </p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {LEGEND.map((item) => (
              <span key={item.type} className="flex items-center gap-1.5 text-xs text-navy-700/60">
                <span className={`h-2.5 w-2.5 rounded-full border ${TYPE_STYLES[item.type]}`} />
                {item.label}
              </span>
            ))}
          </div>
        </FadeIn>

        <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr] lg:items-start">
          <FadeIn delay={0.08}>
            <div className="space-y-8">
              {MONTHS.map(({ year, month, label }) => {
                const weeks = buildMonthGrid(year, month, byDate);
                return (
                  <div key={label}>
                    <p className="mb-2 text-sm font-semibold text-navy-900">{label}</p>
                    <div className="grid grid-cols-5 gap-1.5 text-[10px] font-medium uppercase tracking-wide text-navy-700/40">
                      {WEEKDAY_LABELS.map((w) => (
                        <div key={w} className="px-1 pb-1 text-center">
                          {w}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {weeks.flatMap((week, wi) =>
                        week.map((day, ci) => {
                          if (!day || !day.title) {
                            return <div key={`${wi}-${ci}`} className="aspect-square rounded-lg" />;
                          }
                          const dayNum = new Date(`${day.date}T00:00:00`).getDate();
                          const isSelected = selected?.date === day.date;
                          return (
                            <button
                              key={day.date}
                              type="button"
                              onClick={() => setSelected(day)}
                              className={`flex aspect-square flex-col items-start justify-between rounded-lg border p-1.5 text-left transition-colors ${TYPE_STYLES[day.type]} ${
                                isSelected ? "ring-2 ring-econ-500 ring-offset-1" : ""
                              }`}
                            >
                              <span className="text-[10px] font-semibold text-navy-900/70">{dayNum}</span>
                              {day.code && (
                                <span className="hidden text-[9px] font-medium text-navy-700/50 sm:block">
                                  {day.code}
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div className="sticky top-6 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(13,27,46,0.04)]">
              {selected ? (
                <>
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-econ-700/70">
                    {TYPE_LABEL[selected.type]}
                    {selected.code ? ` · ${selected.code}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-navy-700/50">{formatFullDate(selected.date)}</p>
                  <p className="mt-3 font-display text-xl font-medium leading-snug text-navy-900">
                    {selected.title}
                  </p>
                  {unitForSelected && (
                    <div className="mt-4 flex items-center gap-2 border-t border-navy-900/8 pt-4 text-sm text-navy-700/70">
                      <unitForSelected.icon size={15} className="text-econ-600" />
                      Unit {unitForSelected.number}: {unitForSelected.title}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-navy-700/60">Tap a day on the calendar to see what's taught.</p>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
