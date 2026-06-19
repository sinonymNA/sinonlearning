"use client";

import { X } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/stackedEvents";
import type { PropertyType, StackedState } from "@/lib/stackedTypes";

const RISK_STYLE: Record<string, string> = {
  Low: "text-teal-300",
  Medium: "text-amber-300",
  High: "text-rose-300",
};

export default function StackedPropertyModal({
  state,
  onBuy,
  onClose,
}: {
  state: StackedState;
  onBuy: (type: PropertyType) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-navy-950 p-7">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-medium text-white">Buy a property</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PROPERTY_TYPES.map((def) => {
            const affordable = state.cash >= def.downPayment;
            return (
              <div
                key={def.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-4"
              >
                <p className="font-display text-base font-medium text-white">{def.label}</p>
                <p className={`mt-1 text-xs font-medium ${RISK_STYLE[def.riskLabel]}`}>{def.riskLabel} risk</p>
                <p className="mt-3 text-xs text-white/50">Purchase price</p>
                <p className="text-sm text-white">${def.purchasePrice.toLocaleString()}</p>
                <p className="mt-2 text-xs text-white/50">Down payment</p>
                <p className="text-sm text-white">${def.downPayment.toLocaleString()}</p>
                <p className="mt-2 text-xs text-white/50">Cash flow</p>
                <p className="text-sm text-teal-300">+${def.baseMonthlyCashFlow}/mo</p>
                <button
                  onClick={() => onBuy(def.id)}
                  disabled={!affordable}
                  className="mt-4 rounded-full bg-teal-300 px-4 py-2 text-xs font-medium text-navy-950 transition-colors hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {affordable ? "Buy" : "Not enough cash"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
