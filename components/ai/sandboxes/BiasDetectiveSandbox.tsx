"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import {
  CANDIDATES,
  agreementWithTrueMerit,
  averageRankByGroup,
  modelScore,
  rankByScore,
  type FeatureKey,
} from "@/lib/biasDetective";

const FEATURES: { key: FeatureKey; label: string; isProxy: boolean }[] = [
  { key: "gpa", label: "GPA", isProxy: false },
  { key: "experience", label: "Years Experience", isProxy: false },
  { key: "schoolTier", label: "School Tier", isProxy: true },
  { key: "zipTier", label: "Zip Code Tier", isProxy: true },
];

export default function BiasDetectiveSandbox() {
  const [active, setActive] = useState<Set<FeatureKey>>(new Set(["gpa", "experience", "schoolTier", "zipTier"]));

  const toggle = (key: FeatureKey) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev; // require at least one feature
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const activeFeatures = useMemo(() => Array.from(active), [active]);
  const ranked = useMemo(
    () => rankByScore(CANDIDATES, (c) => modelScore(c, activeFeatures)),
    [activeFeatures]
  );
  const avgRank = useMemo(() => averageRankByGroup(ranked), [ranked]);
  const agreement = useMemo(() => agreementWithTrueMerit(CANDIDATES, activeFeatures), [activeFeatures]);
  const gap = Math.abs(avgRank["Group 1"] - avgRank["Group 2"]);
  const activeProxyCount = FEATURES.filter((f) => f.isProxy && active.has(f.key)).length;

  let insight: string;
  if (activeProxyCount === 0) {
    insight = "With both school and zip tier turned off, the ranking now lines up almost entirely with true merit (GPA + experience) — the group gap has nearly disappeared.";
  } else if (activeProxyCount === 1) {
    insight = "Turning off one proxy feature narrowed the gap, but it didn't close it — the remaining proxy still quietly correlates with group, so bias leaks through a different door.";
  } else {
    insight = "With both School Tier and Zip Code Tier active, the model is ranking by historical privilege as much as by actual qualifications — even though neither group is more qualified in this data.";
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-white/50">Which features should the model use?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FEATURES.map((f) => {
            const isActive = active.has(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggle(f.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? f.isProxy
                      ? "border-amber-300/40 bg-amber-300/15 text-amber-100"
                      : "border-teal-300/40 bg-teal-300/15 text-teal-100"
                    : "border-white/10 bg-white/[0.02] text-white/35"
                }`}
              >
                {f.label}
                {f.isProxy && <span className="text-[10px] uppercase tracking-wide opacity-70">proxy</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-white/45">Avg. rank — Group 1</p>
          <p className="mt-1 font-display text-2xl font-medium text-white">{avgRank["Group 1"].toFixed(1)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-white/45">Avg. rank — Group 2</p>
          <p className="mt-1 font-display text-2xl font-medium text-white">{avgRank["Group 2"].toFixed(1)}</p>
        </div>
        <div
          className={`rounded-2xl border p-4 text-center ${
            gap > 2 ? "border-rose-300/30 bg-rose-300/10" : "border-teal-300/30 bg-teal-300/10"
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-white/45">Ranking matches true merit</p>
          <p className="mt-1 font-display text-2xl font-medium text-white">{Math.round(agreement * 100)}%</p>
        </div>
      </div>

      <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/65">
        {insight}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-3 py-2">Rank</th>
              <th className="px-3 py-2">Candidate</th>
              <th className="px-3 py-2">Group</th>
              <th className="px-3 py-2">GPA</th>
              <th className="px-3 py-2">Exp.</th>
              <th className="px-3 py-2">School</th>
              <th className="px-3 py-2">Zip</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((c, i) => (
              <tr key={c.id} className={`border-t border-white/5 ${i < 5 ? "bg-teal-300/5" : ""}`}>
                <td className="px-3 py-2 text-white/70">
                  {i < 5 ? <Trophy size={12} className="mr-1 inline text-teal-300" /> : null}
                  {i + 1}
                </td>
                <td className="px-3 py-2 text-white/90">{c.name}</td>
                <td className="px-3 py-2 text-white/50">{c.group}</td>
                <td className="px-3 py-2 text-white/50">{c.gpa.toFixed(1)}</td>
                <td className="px-3 py-2 text-white/50">{c.experience}</td>
                <td className="px-3 py-2 text-white/50">{c.schoolTier}</td>
                <td className="px-3 py-2 text-white/50">{c.zipTier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
