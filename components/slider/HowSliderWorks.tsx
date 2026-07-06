"use client";

import { useRef } from "react";
import { Palette, MessagesSquare, ImagePlus, Download, ArrowRight } from "lucide-react";
import { useMountReveal } from "@/lib/marginsMotion";

const STEPS = [
  {
    icon: Palette,
    title: "Pick a theme",
    description: "Choose a ready-made theme. Colors and fonts are handled for you.",
  },
  {
    icon: MessagesSquare,
    title: "Add your content",
    description: "Type it in yourself, or chat with KORA and let it draft the deck.",
  },
  {
    icon: ImagePlus,
    title: "Find the images",
    description: "Search the web right from the editor and add real images in one click.",
  },
  {
    icon: Download,
    title: "Export & present",
    description: "Download a real .pptx — open it in PowerPoint or convert it in Google Slides.",
  },
];

export default function HowSliderWorks() {
  const ref = useRef<HTMLDivElement>(null);
  useMountReveal(ref, ".how-step", { stagger: 90, translateY: 16, duration: 420 });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slider-900 via-slider-800 to-slider-950 p-7 sm:p-8">
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-slider-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-slider-400/15 blur-3xl" />

      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slider-300 mb-1.5">How Slider works</p>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-7">From idea to presentation in four steps</h2>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="how-step relative" style={{ opacity: 0 }}>
              <div className="h-full rounded-2xl bg-white/[0.07] border border-white/10 p-5 flex flex-col gap-3 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slider-400 to-slider-600 text-white shadow-lg shadow-slider-950/40">
                    <step.icon size={18} strokeWidth={2} />
                  </span>
                  <span className="text-[26px] font-bold text-white/10 leading-none">{i + 1}</span>
                </div>
                <p className="text-[15px] font-semibold text-white">{step.title}</p>
                <p className="text-[12.5px] text-white/60 leading-relaxed">{step.description}</p>
              </div>
              {i < STEPS.length - 1 && (
                <span className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-slider-950 border border-white/10 text-white/40">
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
