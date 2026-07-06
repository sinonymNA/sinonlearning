"use client";

import { useRef } from "react";
import { MessagesSquare, LayoutList, ImagePlus, Mic, Clapperboard, ArrowRight } from "lucide-react";
import { useMountReveal } from "@/lib/marginsMotion";

const STEPS = [
  {
    icon: MessagesSquare,
    title: "Script with KORA",
    description: "Tell KORA your topic and grade. It drafts the beats and the narration you'll read.",
  },
  {
    icon: LayoutList,
    title: "Shape the beats",
    description: "Each beat is a clean animation template — a title, bullets, a diagram. Tweak the words.",
  },
  {
    icon: ImagePlus,
    title: "Add the images",
    description: "KORA suggests what to show. Search the web or upload your own, one click per beat.",
  },
  {
    icon: Mic,
    title: "Record the voice-over",
    description: "The synced teleprompter plays your video while your script scrolls — you just read.",
  },
  {
    icon: Clapperboard,
    title: "Produce the video",
    description: "Reel renders the animations, muxes your narration, and hands you a downloadable MP4.",
  },
];

export default function HowReelWorks() {
  const ref = useRef<HTMLDivElement>(null);
  useMountReveal(ref, ".how-step", { stagger: 90, translateY: 16, duration: 420 });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-7 sm:p-8">
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />

      <div className="relative">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300">How Reel works</p>
        <h2 className="mb-7 text-xl font-bold text-white sm:text-2xl">
          From a topic to a narrated explainer in five steps
        </h2>

        <div ref={ref} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <div key={step.title} className="how-step relative" style={{ opacity: 0 }}>
              <div className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-lg shadow-slate-950/40">
                    <step.icon size={18} strokeWidth={2} />
                  </span>
                  <span className="text-[26px] font-bold leading-none text-white/10">{i + 1}</span>
                </div>
                <p className="text-[15px] font-semibold text-white">{step.title}</p>
                <p className="text-[12.5px] leading-relaxed text-white/60">{step.description}</p>
              </div>
              {i < STEPS.length - 1 && (
                <span className="absolute top-1/2 -right-3 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950 text-white/40 lg:flex">
                  <ArrowRight size={12} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
