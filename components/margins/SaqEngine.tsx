"use client";

import { MessageCircle, Search, Link2, Check } from "lucide-react";

const moves = [
  { short: "Answer it", academic: "Claim", icon: MessageCircle },
  { short: "Prove it", academic: "Evidence", icon: Search },
  { short: "Connect it", academic: "Reasoning", icon: Link2 },
];

export default function SaqEngine({ stage }: { stage: number }) {
  return (
    <section className="course-panel overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-r from-[#102827] via-[#163b38] to-[#102827] p-4 text-white shadow-sm" aria-label="The three moves of a full-credit SAQ">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-teal-300">The 3-point routine</p>
          <p className="mt-0.5 text-xs text-white/55">Say it like a person. Then make each move visible.</p>
        </div>
        <span className="hidden rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold text-white/65 sm:block">A full SAQ is three small answers</span>
      </div>
      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <div className="absolute left-[16%] right-[16%] top-5 h-px bg-white/10" />
        {moves.map((move, index) => {
          const Icon = move.icon;
          const learned = index <= stage;
          return <div key={move.short} className="relative text-center">
            <span className={`relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-700 ${learned ? "border-teal-200 bg-teal-300 text-[#102827] shadow-[0_0_24px_rgba(94,234,212,.28)]" : "border-white/15 bg-[#183331] text-white/35"}`}>
              {index < stage ? <Check size={16} strokeWidth={3}/> : <Icon size={16}/>} 
            </span>
            <p className={`mt-2 text-xs font-bold ${learned ? "text-white" : "text-white/35"}`}>{move.short}</p>
            <p className="text-[9px] uppercase tracking-[.16em] text-teal-200/45">{move.academic}</p>
          </div>;
        })}
      </div>
    </section>
  );
}
