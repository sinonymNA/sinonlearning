"use client";

import { useRef } from "react";
import { Palette, MessagesSquare, ImagePlus, Download } from "lucide-react";
import { useMountReveal } from "@/lib/marginsMotion";

const STEPS = [
  {
    icon: Palette,
    title: "Pick a theme",
    description: "Choose one of our beautiful, ready-made themes — colors and fonts are handled for you.",
  },
  {
    icon: MessagesSquare,
    title: "Add your content",
    description: "Type it in yourself, or chat with KORA step-by-step and let it write a first draft.",
  },
  {
    icon: ImagePlus,
    title: "Find the right images",
    description: "Search the web right from the editor and add real, topical images with one click.",
  },
  {
    icon: Download,
    title: "Export & present",
    description: "Download a real .pptx file — open it in PowerPoint, or upload it to Google Drive to convert to Slides.",
  },
];

export default function HowSliderWorks() {
  const ref = useRef<HTMLDivElement>(null);
  useMountReveal(ref, ".how-step", { stagger: 90, translateY: 16, duration: 420 });

  return (
    <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/60 to-pink-50/40 p-6">
      <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-1">How Slider works</p>
      <h2 className="text-lg font-bold text-stone-900 mb-5">From idea to presentation in four steps</h2>
      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="how-step relative rounded-xl bg-white/80 border border-white p-4 flex flex-col gap-2"
            style={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 text-white">
                <step.icon size={17} strokeWidth={2} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-300">Step {i + 1}</span>
            </div>
            <p className="text-sm font-semibold text-stone-800">{step.title}</p>
            <p className="text-[12px] text-stone-500 leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
