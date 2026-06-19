"use client";

import { ArrowRight, Home } from "lucide-react";
import { discretionaryIncome } from "@/lib/stackedEngine";
import { PROPERTY_UNLOCK_CASH } from "@/lib/stackedTypes";
import type { Allocation, StackedState } from "@/lib/stackedTypes";

const SLIDERS: { key: keyof Allocation; label: string }[] = [
  { key: "emergency", label: "Emergency Fund" },
  { key: "investing", label: "Investments" },
  { key: "realEstate", label: "Real Estate Fund" },
  { key: "lifestyle", label: "Lifestyle Spending" },
];

function rebalance(allocation: Allocation, changedKey: keyof Allocation, newValue: number): Allocation {
  const otherKeys = SLIDERS.map((s) => s.key).filter((k) => k !== changedKey);
  const remaining = 100 - newValue;
  const otherTotal = otherKeys.reduce((sum, k) => sum + allocation[k], 0);

  const next: Allocation = { ...allocation, [changedKey]: newValue };
  if (otherTotal === 0) {
    const share = remaining / otherKeys.length;
    otherKeys.forEach((k) => {
      next[k] = share;
    });
  } else {
    otherKeys.forEach((k) => {
      next[k] = (allocation[k] / otherTotal) * remaining;
    });
  }
  return next;
}

export default function StackedAllocationPanel({
  state,
  onAllocationChange,
  onAdvance,
  onOpenPropertyModal,
}: {
  state: StackedState;
  onAllocationChange: (allocation: Allocation) => void;
  onAdvance: () => void;
  onOpenPropertyModal: () => void;
}) {
  const discretionary = discretionaryIncome(state);
  const canBuyProperty = state.cash >= PROPERTY_UNLOCK_CASH;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Allocate this turn&rsquo;s cash</p>
        <span className="font-display text-lg font-medium text-teal-300">
          ${Math.round(discretionary).toLocaleString()} available
        </span>
      </div>
      <p className="mt-1.5 text-xs text-white/45">
        Sliders are linked — they always add up to 100%.
      </p>

      <div className="mt-5 space-y-4">
        {SLIDERS.map((slider) => (
          <div key={slider.key}>
            <label className="flex items-center justify-between text-sm font-medium text-white/80">
              {slider.label}
              <span className="text-teal-300">{Math.round(state.allocation[slider.key])}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={state.allocation[slider.key]}
              onChange={(e) =>
                onAllocationChange(rebalance(state.allocation, slider.key, Number(e.target.value)))
              }
              className="mt-2 w-full accent-teal-400"
            />
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button
          onClick={onAdvance}
          className="flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
        >
          Advance 2 Years
          <ArrowRight size={15} />
        </button>

        <button
          onClick={onOpenPropertyModal}
          disabled={!canBuyProperty}
          className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Home size={15} />
          {canBuyProperty
            ? "Buy Property"
            : `Buy Property (need $${PROPERTY_UNLOCK_CASH.toLocaleString()} cash)`}
        </button>
      </div>
    </div>
  );
}
