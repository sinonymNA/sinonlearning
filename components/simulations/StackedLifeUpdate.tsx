import { monthlyCashFlow, netWorth, propertyEquityTotal } from "@/lib/stackedEngine";
import type { StackedState } from "@/lib/stackedTypes";

export default function StackedLifeUpdate({ state }: { state: StackedState }) {
  const stats = [
    { label: "Age", value: `${state.age}` },
    { label: "Salary", value: `$${Math.round(state.salary).toLocaleString()}/yr` },
    { label: "Cash", value: `$${Math.round(state.cash).toLocaleString()}` },
    { label: "Investments", value: `$${Math.round(state.investments).toLocaleString()}` },
    { label: "Real Estate Equity", value: `$${Math.round(propertyEquityTotal(state)).toLocaleString()}` },
    { label: "Monthly Cash Flow", value: `$${Math.round(monthlyCashFlow(state)).toLocaleString()}/mo` },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-teal-300/70">
          Turn {state.turn} of 15 — Age {state.age}
        </span>
        <span className="font-display text-lg font-medium text-teal-300">
          Net Worth ${Math.round(netWorth(state)).toLocaleString()}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">{s.label}</p>
            <p className="mt-1 font-display text-lg font-medium text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
