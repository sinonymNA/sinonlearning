"use client";

import { Check, MessageCircle, Search, Link2, Split } from "lucide-react";
import {
  WRITING_MECHANICS_SKILL_IDS,
  WRITING_MECHANICS_LABELS,
  type WritingMechanicsSkillId,
} from "@/lib/marginsPracticeCourses";
import type { MasteryLevel } from "@/lib/marginsDb";

export interface LiveMechanicsEntry {
  skill: string;
  level: MasteryLevel;
}

const order: Record<MasteryLevel, number> = { not_yet_shown: 0, emerging: 1, solid: 2, strong: 3 };
const language: Record<MasteryLevel, string> = {
  not_yet_shown: "Up next",
  emerging: "With help",
  solid: "On your own",
  strong: "Exam ready",
};

const icons: Record<WritingMechanicsSkillId, typeof MessageCircle> = {
  claim: MessageCircle,
  evidence: Search,
  reasoning: Link2,
  identify_vs_explain: Split,
};

export default function SaqSkillRail({ mastery, pulseSkill }: { mastery: LiveMechanicsEntry[]; pulseSkill?: string | null }) {
  const bySkill = new Map(mastery.map((entry) => [entry.skill, entry.level]));
  return (
    <aside className="rounded-2xl border border-stone-200 bg-[#132a2a] p-4 text-white shadow-sm" aria-label="Live SAQ skills">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-teal-300">Your writing toolkit</p>
          <p className="mt-1 text-xs text-white/55">Every clean rep strengthens a move.</p>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-teal-100">Live</span>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {WRITING_MECHANICS_SKILL_IDS.map((skill) => {
          const level = bySkill.get(skill) ?? "not_yet_shown";
          const Icon = icons[skill];
          const active = pulseSkill === skill;
          return (
            <div key={skill} className={`relative overflow-hidden rounded-xl border p-3 transition-all duration-500 ${active ? "scale-[1.02] border-teal-300 bg-teal-300/15 shadow-[0_0_28px_rgba(94,234,212,.2)]" : "border-white/10 bg-white/[.04]"}`}>
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${order[level] >= 2 ? "bg-teal-300 text-[#132a2a]" : "bg-white/10 text-teal-200"}`}>
                  {level === "strong" ? <Check size={14} strokeWidth={3}/> : <Icon size={14}/>} 
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-white">{WRITING_MECHANICS_LABELS[skill]}</p>
                  <p className="text-[9px] uppercase tracking-wider text-white/45">{language[level]}</p>
                </div>
              </div>
              <div className="mt-2 flex gap-1" aria-label={`${WRITING_MECHANICS_LABELS[skill]}: ${language[level]}`}>
                {[1,2,3].map((step) => <span key={step} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step <= order[level] ? "bg-teal-300" : "bg-white/10"}`}/>) }
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
