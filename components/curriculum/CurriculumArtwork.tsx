"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeDollarSign, BookOpenCheck, Boxes, Building2, CalendarDays, Compass,
  Landmark, LineChart, Map, MessageCircleQuestion, Newspaper, Scale, Sparkles,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { Course } from "@/data/courses";

const iconSets = {
  "everyday-economics": [BadgeDollarSign, LineChart, Newspaper],
  "everyday-government": [Landmark, Scale, MessageCircleQuestion],
  "everyday-world-history": [Map, Compass, Building2],
  "everyday-us-history": [Newspaper, Landmark, BookOpenCheck],
  "everyday-geography": [Compass, Map, Building2],
  "everyday-lessons": [CalendarDays, Sparkles, BookOpenCheck],
  "full-course-packs": [Boxes, BookOpenCheck, CalendarDays],
} as const;

export default function CurriculumArtwork({ course, className = "", hero = false }: { course: Course; className?: string; hero?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [Primary, Secondary, Tertiary] = iconSets[course.slug as keyof typeof iconSets] ?? iconSets["everyday-lessons"];
  const style = {
    "--art-ink": course.visual.ink,
    "--art-accent": course.visual.accent,
    "--art-soft": course.visual.soft,
    "--art-glow": course.visual.glow,
  } as CSSProperties;

  return (
    <div style={style} className={`relative isolate overflow-hidden bg-[var(--art-soft)] ${hero ? "rounded-[2.5rem]" : "rounded-[1.75rem]"} ${className}`} aria-hidden="true">
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,var(--art-ink)_1px,transparent_0)] [background-size:22px_22px]" />
      <div className="absolute -right-[12%] -top-[22%] h-[66%] w-[66%] rounded-full bg-[var(--art-glow)] opacity-65 blur-2xl" />
      <div className="absolute -bottom-[28%] -left-[12%] h-[72%] w-[72%] rounded-full bg-[var(--art-accent)] opacity-25 blur-3xl" />
      <motion.div animate={reduceMotion ? undefined : { y: [0, -8, 0], rotate: [-5, -2, -5] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute left-[8%] top-[12%] w-[52%] -rotate-6 rounded-2xl border border-white/80 bg-white/90 p-[7%] shadow-[0_25px_60px_rgba(13,27,46,0.18)] backdrop-blur-sm">
        <div className="flex items-center justify-between"><Primary className="h-8 w-8 text-[var(--art-ink)] sm:h-10 sm:w-10" strokeWidth={1.7} /><span className="h-2 w-12 rounded-full bg-[var(--art-accent)] opacity-60" /></div>
        <div className="mt-5 space-y-2"><span className="block h-2 w-full rounded-full bg-[var(--art-ink)] opacity-15" /><span className="block h-2 w-4/5 rounded-full bg-[var(--art-ink)] opacity-15" /><span className="block h-2 w-2/3 rounded-full bg-[var(--art-ink)] opacity-15" /></div>
      </motion.div>
      <motion.div animate={reduceMotion ? undefined : { y: [0, 10, 0], rotate: [7, 4, 7] }} transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="absolute bottom-[9%] right-[7%] flex h-[43%] w-[43%] rotate-6 items-center justify-center rounded-[1.5rem] border border-white/80 bg-[var(--art-ink)] text-white shadow-[0_24px_50px_rgba(13,27,46,0.24)]">
        <Secondary className="h-[42%] w-[42%]" strokeWidth={1.35} />
        <div className="absolute inset-x-[18%] bottom-[14%] flex items-end gap-1.5">{[42, 68, 54, 84, 62].map((height, index) => <span key={index} className="flex-1 rounded-t bg-[var(--art-glow)]" style={{ height: `${height / 4}px` }} />)}</div>
      </motion.div>
      <motion.div animate={reduceMotion ? undefined : { x: [0, 5, 0], y: [0, -4, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute right-[13%] top-[10%] flex h-14 w-14 rotate-12 items-center justify-center rounded-2xl border border-white/70 bg-[var(--art-glow)] text-[var(--art-ink)] shadow-lg sm:h-16 sm:w-16"><Tertiary className="h-7 w-7" strokeWidth={1.8} /></motion.div>
      <div className="absolute bottom-[11%] left-[11%] h-3 w-[28%] -rotate-6 rounded-full bg-[var(--art-accent)]" />
      <div className="absolute bottom-[7%] left-[12%] h-2 w-[19%] -rotate-6 rounded-full bg-[var(--art-ink)] opacity-20" />
    </div>
  );
}
