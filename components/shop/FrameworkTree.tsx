export interface FrameworkTreeSplit {
  label: string;
  caption: string;
}

export interface FrameworkTreeProps {
  root: string;
  branches: string[];
  convergeLabel: string;
  splits: FrameworkTreeSplit[];
}

// Pure CSS "tee connector" org chart — same abstraction level as the site's
// other diagrams (KoraFlowDiagram, KoraEvidenceModel): a big-picture map, not
// a literal wiring diagram. No SVG, no client JS, degrades to a simple
// stacked list on mobile via flex-col/flex-row.
export default function FrameworkTree({ root, branches, convergeLabel, splits }: FrameworkTreeProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mx-auto w-fit rounded-full border border-navy-900/15 bg-white px-6 py-3 text-sm font-semibold text-navy-900 shadow-sm">
        {root}
      </div>
      <div className="mx-auto h-8 w-px bg-navy-900/15" />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:border-t sm:border-navy-900/15">
        {branches.map((branch) => (
          <div key={branch} className="flex flex-1 flex-col items-center text-center">
            <div className="h-6 w-px bg-navy-900/15" />
            <div className="rounded-2xl border border-navy-900/10 bg-cream-50 px-5 py-3 text-sm font-medium text-navy-800">
              {branch}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-6 flex max-w-md flex-col items-center border-t border-navy-900/15 pt-6">
        <div className="h-6 w-px bg-navy-900/15" />
        <div className="rounded-full border border-amber-300 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-800 shadow-sm">
          {convergeLabel}
        </div>
      </div>

      <div className="mx-auto h-8 w-px bg-navy-900/15" />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:border-t sm:border-navy-900/15">
        {splits.map((split) => (
          <div key={split.label} className="flex flex-1 flex-col items-center text-center">
            <div className="h-6 w-px bg-navy-900/15" />
            <div className="rounded-2xl border border-navy-900/10 bg-white px-5 py-3 text-sm font-semibold text-navy-900 shadow-[0_1px_2px_rgba(13,27,46,0.04)]">
              {split.label}
            </div>
            <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-navy-700/60">{split.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
