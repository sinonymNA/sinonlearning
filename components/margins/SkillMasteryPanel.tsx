"use client";

import { useRef } from "react";
import { useMountReveal } from "@/lib/marginsMotion";
import { AP_SKILL_IDS, AP_SKILL_LABELS } from "@/lib/marginsPracticeCourses";
import type { MasteryLevel } from "@/lib/marginsDb";

interface SkillMasteryEntry {
  skill: string;
  level: MasteryLevel;
}

interface Props {
  mastery: SkillMasteryEntry[];
  title?: string;
}

const LEVEL_INFO: Record<MasteryLevel, { label: string; pct: number; barClass: string; pillClass: string }> = {
  not_yet_shown: { label: "Not yet shown", pct: 8, barClass: "bg-stone-200", pillClass: "bg-stone-100 text-stone-500" },
  emerging: { label: "Emerging", pct: 38, barClass: "bg-teal-200", pillClass: "bg-teal-50 text-teal-600" },
  solid: { label: "Solid", pct: 68, barClass: "bg-teal-400", pillClass: "bg-teal-100 text-teal-700" },
  strong: { label: "Strong", pct: 100, barClass: "bg-teal-600", pillClass: "bg-teal-600/10 text-teal-700" },
};

export default function SkillMasteryPanel({ mastery, title = "Skill mastery" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  useMountReveal(containerRef, ".skill-row", { stagger: 80, translateY: 12, duration: 380 });

  const bySkill = new Map(mastery.map((m) => [m.skill, m.level]));

  return (
    <div ref={containerRef} className="rounded-2xl border border-teal-100 bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600 mb-4">{title}</p>
      <div className="flex flex-col gap-3.5">
        {AP_SKILL_IDS.map((skill) => {
          const level = bySkill.get(skill) ?? "not_yet_shown";
          const info = LEVEL_INFO[level];
          return (
            <div key={skill} className="skill-row" style={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-stone-700">{AP_SKILL_LABELS[skill]}</span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${info.pillClass}`}
                >
                  {info.label}
                </span>
              </div>
              <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                <div className={`h-full rounded-full ${info.barClass}`} style={{ width: `${info.pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
