interface RubricRow {
  category: string;
  points_earned: number;
  points_possible: number;
  justification: string;
}

interface Props {
  overallScore: number;
  maxScore: number;
  rubricBreakdown: RubricRow[];
  overallFeedback: string;
  strengths: string[];
  nextSteps: string[];
  teacherOverrideScore?: number | null;
  teacherNotes?: string | null;
}

export default function GradingReport({
  overallScore,
  maxScore,
  rubricBreakdown,
  overallFeedback,
  strengths,
  nextSteps,
  teacherOverrideScore,
  teacherNotes,
}: Props) {
  const displayScore = teacherOverrideScore ?? overallScore;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-rose-500 mb-1">
            {teacherOverrideScore != null ? "Teacher score" : "KORA draft score"}
          </p>
          <p className="text-3xl font-bold text-stone-900">
            {displayScore}
            <span className="text-lg text-stone-400 font-medium">/{maxScore}</span>
          </p>
        </div>
        {teacherOverrideScore == null && (
          <span className="rounded-full bg-white border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-600">
            Draft — awaiting teacher review
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-stone-100 bg-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Rubric breakdown</p>
        <div className="flex flex-col gap-3">
          {rubricBreakdown.map((row) => (
            <div key={row.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-stone-800">{row.category}</span>
                <span className="text-sm text-stone-500">
                  {row.points_earned}/{row.points_possible}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                  style={{ width: `${row.points_possible > 0 ? (row.points_earned / row.points_possible) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[13px] text-stone-500 mt-1.5 leading-relaxed">{row.justification}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-100 bg-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Overall feedback</p>
        <p className="text-[14px] text-stone-700 leading-relaxed">{overallFeedback}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Strengths</p>
          <ul className="text-[13px] text-stone-700 leading-relaxed list-disc list-inside space-y-1">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-sky-600 mb-2">Next steps</p>
          <ul className="text-[13px] text-stone-700 leading-relaxed list-disc list-inside space-y-1">
            {nextSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      {teacherNotes && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-2">Note from your teacher</p>
          <p className="text-[14px] text-stone-700 leading-relaxed">{teacherNotes}</p>
        </div>
      )}
    </div>
  );
}
