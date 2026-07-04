"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

const floatCards = [
  { label: "Teacher Intent", sub: "What I want my students to learn", x: "-6%", y: "8%", delay: 0 },
  { label: "Lesson Blueprint", sub: "Structured, reviewable, yours", x: "74%", y: "2%", delay: 0.4 },
  { label: "Classroom Artifact", sub: "Ready to teach tomorrow", x: "78%", y: "64%", delay: 0.8 },
  { label: "Teacher Revision", sub: "You always have the last word", x: "-2%", y: "68%", delay: 1.2 },
];

const comets = [
  { top: "18%", delay: 0 },
  { top: "52%", delay: 1.4 },
  { top: "80%", delay: 2.8 },
];

export default function KoraHero({
  eyebrow = "Introducing KORA",
  headline,
  subtext,
  children,
  logo,
}: {
  eyebrow?: string;
  headline: ReactNode;
  subtext: string;
  children?: ReactNode;
  logo?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="bg-circuit relative overflow-hidden bg-navy-950 px-6 pt-20 pb-24 lg:px-8 lg:pt-28 lg:pb-32">
      <div className="absolute left-1/4 top-0 -z-10 h-[420px] w-[420px] -translate-y-1/3 rounded-full bg-teal-400/15 blur-[130px]" />
      <div className="absolute -right-20 top-1/3 -z-10 h-80 w-80 rounded-full bg-purple-500/15 blur-[120px]" />
      <div className="absolute -left-16 bottom-0 -z-10 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-[110px]" />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(94,234,212,0.18) 0%, rgba(168,85,247,0.08) 45%, transparent 70%)",
        }}
        animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {!reduceMotion &&
        comets.map((c, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute left-0 h-px w-40 bg-gradient-to-r from-transparent via-teal-300/70 to-transparent"
            style={{ top: c.top }}
            initial={{ x: "-20%", opacity: 0 }}
            animate={{ x: "120%", opacity: [0, 1, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: c.delay, ease: "easeInOut" }}
          />
        ))}

      {floatCards.map((card, i) => (
        <motion.div
          key={card.label}
          className="pointer-events-none absolute hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md lg:block"
          style={{ left: card.x, top: card.y }}
          initial={{ opacity: 0, y: 10 }}
          animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -10, 0] }}
          transition={
            reduceMotion
              ? { duration: 0.6, delay: card.delay }
              : { duration: 4 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: card.delay }
          }
        >
          <p className="text-xs font-semibold text-teal-200">{card.label}</p>
          <p className="mt-1 text-[11px] text-white/50">{card.sub}</p>
        </motion.div>
      ))}

      <div className="relative mx-auto max-w-3xl text-center">
        {logo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "backOut" }}
            className="mb-8 flex justify-center"
          >
            {logo}
          </motion.div>
        )}
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: logo ? 0.15 : 0 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-400/10 px-3.5 py-1.5 text-xs font-medium text-teal-200"
        >
          <Sparkles size={12} />
          {eyebrow}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-display text-4xl font-medium leading-[1.1] text-white sm:text-5xl lg:text-6xl"
        >
          {headline}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65"
        >
          {subtext}
        </motion.p>

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
