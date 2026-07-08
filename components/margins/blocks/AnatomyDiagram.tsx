interface Props {
  claim: string;
  evidence: string;
  reasoning: string;
  highlight?: "claim" | "evidence" | "reasoning";
}

const STEPS = [
  { key: "claim" as const, label: "Claim" },
  { key: "evidence" as const, label: "Evidence" },
  { key: "reasoning" as const, label: "Reasoning" },
];

export default function AnatomyDiagram({ claim, evidence, reasoning, highlight }: Props) {
  const values: Record<"claim" | "evidence" | "reasoning", string> = { claim, evidence, reasoning };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      {STEPS.map((step, i) => {
        const dimmed = highlight != null && highlight !== step.key;
        return (
          <div key={step.key} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div
              className={`flex-1 rounded-xl border p-3 transition-opacity ${
                dimmed ? "border-stone-100 bg-stone-50 opacity-40" : "border-teal-100 bg-white"
              }`}
            >
              <p
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  dimmed ? "text-stone-400" : "text-teal-600"
                }`}
              >
                {step.label}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-stone-700">{values[step.key]}</p>
            </div>
            {i < STEPS.length - 1 && (
              <span className="hidden shrink-0 text-lg text-stone-300 sm:block">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
