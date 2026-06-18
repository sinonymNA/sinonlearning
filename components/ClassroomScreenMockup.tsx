"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Shuffle, BarChart3, ClipboardCheck } from "lucide-react";

const agenda = [
  { time: "9:00", label: "Warm-up: Opportunity Cost" },
  { time: "9:10", label: "Mini-lesson: Supply & Demand" },
  { time: "9:30", label: "Group activity" },
  { time: "9:50", label: "Exit ticket" },
];

const pollResults = [
  { label: "Got it", value: 64 },
  { label: "Mostly", value: 27 },
  { label: "Need help", value: 9 },
];

export default function ClassroomScreenMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative"
    >
      <div className="absolute left-1/2 top-1/2 -z-10 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/15 blur-[100px]" />

      <div className="relative overflow-hidden rounded-[28px] border border-navy-900/10 bg-navy-950 p-4 shadow-[0_30px_60px_-15px_rgba(13,27,46,0.3)] sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.04] to-transparent" />
        <div className="mb-4 flex items-center justify-between px-1">
          <span className="text-xs font-medium uppercase tracking-wide text-cream-200/50">
            Classboard
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-teal-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
            </span>
            Period 3 · Economics
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Agenda */}
          <motion.div
            whileHover={{ y: -3 }}
            className="rounded-2xl bg-cream-50 p-4 sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-center gap-2 text-navy-900">
              <CalendarCheck size={16} className="text-teal-600" />
              <p className="text-sm font-semibold">Today&apos;s Agenda</p>
            </div>
            <ul className="mt-3 space-y-2">
              {agenda.map((item) => (
                <li key={item.label} className="flex gap-3 text-sm text-navy-800/85">
                  <span className="w-12 shrink-0 text-navy-700/50">{item.time}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Timer */}
          <motion.div
            whileHover={{ y: -3 }}
            className="flex flex-col items-center justify-center rounded-2xl bg-cream-50 p-4"
          >
            <p className="text-xs font-semibold text-navy-700/60">Timer</p>
            <p className="mt-2 font-display text-4xl font-medium text-navy-900">06:42</p>
            <p className="mt-1 text-xs text-navy-700/50">Group activity</p>
          </motion.div>

          {/* Random Student */}
          <motion.div
            whileHover={{ y: -3 }}
            className="flex flex-col items-center justify-center rounded-2xl bg-cream-50 p-4"
          >
            <div className="flex items-center gap-2 text-navy-900">
              <Shuffle size={16} className="text-teal-600" />
              <p className="text-xs font-semibold">Random Student</p>
            </div>
            <p className="mt-3 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800">
              Jordan M.
            </p>
          </motion.div>

          {/* Quick Poll */}
          <motion.div
            whileHover={{ y: -3 }}
            className="rounded-2xl bg-cream-50 p-4 sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-center gap-2 text-navy-900">
              <BarChart3 size={16} className="text-teal-600" />
              <p className="text-sm font-semibold">Quick Poll: How&apos;s the lesson going?</p>
            </div>
            <div className="mt-3 space-y-2">
              {pollResults.map((result) => (
                <div key={result.label} className="flex items-center gap-3 text-xs text-navy-700/70">
                  <span className="w-16 shrink-0">{result.label}</span>
                  <div className="h-2 flex-1 rounded-full bg-navy-900/8">
                    <div
                      className="h-2 rounded-full bg-teal-500"
                      style={{ width: `${result.value}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right">{result.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Exit Ticket */}
          <motion.div
            whileHover={{ y: -3 }}
            className="rounded-2xl bg-cream-50 p-4 sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-center gap-2 text-navy-900">
              <ClipboardCheck size={16} className="text-teal-600" />
              <p className="text-sm font-semibold">Exit Ticket</p>
            </div>
            <p className="mt-3 text-sm text-navy-700/70">
              In one sentence, explain how a change in supply affects price.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
