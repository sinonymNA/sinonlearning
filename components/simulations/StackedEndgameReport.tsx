"use client";

import { useMemo } from "react";
import { RotateCcw, Award } from "lucide-react";
import { biggestDecision, classifyArchetype, netWorth, runHeadlessSimulation } from "@/lib/stackedEngine";
import { PERSONALITY_PRESETS } from "@/lib/stackedEvents";
import type { Archetype, StackedState } from "@/lib/stackedTypes";
import StackedNetWorthChart from "./StackedNetWorthChart";

const ARCHETYPE_COPY: Record<Archetype, { label: string; description: string }> = {
  lifestyleChaser: {
    label: "Lifestyle Chaser",
    description: "A big salary funded a big lifestyle — but wealth didn't keep pace with income.",
  },
  steadyBuilder: {
    label: "Steady Builder",
    description: "Consistent saving and investing built a strong financial foundation.",
  },
  millionaire: {
    label: "Millionaire",
    description: "Net worth crossed $1,000,000 — compounding did the heavy lifting.",
  },
  financialFreedom: {
    label: "Financial Freedom",
    description: "Passive income now covers your monthly expenses. The asset snowball worked.",
  },
  realEstateMogul: {
    label: "Real Estate Mogul",
    description: "Five or more properties — a real estate empire built two years at a time.",
  },
};

export default function StackedEndgameReport({
  state,
  onPlayAgain,
}: {
  state: StackedState;
  onPlayAgain: () => void;
}) {
  const preset = PERSONALITY_PRESETS.find((p) => p.id === state.personality) ?? PERSONALITY_PRESETS[3];
  const archetype = classifyArchetype(state);
  const copy = ARCHETYPE_COPY[archetype];
  const decision = biggestDecision(state);
  const finalNetWorth = netWorth(state);

  const benchmarks = useMemo(() => {
    const spender = runHeadlessSimulation({
      personality: state.personality,
      allocation: { emergency: 0, investing: 10, realEstate: 0, lifestyle: 90 },
      buysProperty: false,
    });
    const saver = runHeadlessSimulation({
      personality: state.personality,
      allocation: { emergency: 50, investing: 30, realEstate: 20, lifestyle: 0 },
      buysProperty: true,
    });
    const investor = runHeadlessSimulation({
      personality: state.personality,
      allocation: { emergency: 10, investing: 70, realEstate: 20, lifestyle: 0 },
      buysProperty: true,
    });
    return [
      { label: "Spender", netWorth: netWorth(spender) },
      { label: "Saver", netWorth: netWorth(saver) },
      { label: "Investor", netWorth: netWorth(investor) },
      { label: "You", netWorth: finalNetWorth },
    ].sort((a, b) => a.netWorth - b.netWorth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.personality]);

  const maxBenchmark = Math.max(...benchmarks.map((b) => b.netWorth), 1);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-teal-300/70">
        <Award size={13} />
        Age {state.age} Report
      </span>
      <h2 className="mt-3 font-display text-2xl font-medium text-white">{copy.label}</h2>
      <p className="mt-2 text-white/65">{copy.description}</p>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-white/40">Your financial story</p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs text-white/40">Age 22</p>
            <p className="mt-1 font-display text-xl font-medium text-white">
              ${preset.startingSalary.toLocaleString()}/yr
            </p>
            <p className="mt-1 text-xs text-white/50">
              Net worth ${preset.startingCash.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs text-white/40">Age {state.age}</p>
            <p className="mt-1 font-display text-xl font-medium text-teal-300">
              ${Math.round(state.salary).toLocaleString()}/yr
            </p>
            <p className="mt-1 text-xs text-white/50">
              Net worth ${Math.round(finalNetWorth).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-white/40">Biggest decision</p>
        <p className="mt-2 text-sm leading-relaxed text-white/75">{decision}</p>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-white/40">Net worth over time</p>
        <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <StackedNetWorthChart history={state.history} />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-white/40">Compare yourself</p>
        <div className="mt-3 space-y-2">
          {benchmarks.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className={`w-16 text-xs font-medium ${b.label === "You" ? "text-teal-300" : "text-white/50"}`}>
                {b.label}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${b.label === "You" ? "bg-teal-300" : "bg-white/25"}`}
                  style={{ width: `${Math.max(2, (b.netWorth / maxBenchmark) * 100)}%` }}
                />
              </div>
              <span className="w-24 text-right text-xs text-white/60">
                ${Math.round(b.netWorth).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onPlayAgain}
        className="mt-8 flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
      >
        <RotateCcw size={15} />
        Play again
      </button>
    </div>
  );
}
