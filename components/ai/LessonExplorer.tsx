"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Target, BookOpen, ListChecks, ClipboardCheck } from "lucide-react";
import type { AIUnit } from "@/data/aiCourses";

export default function LessonExplorer({ units }: { units: AIUnit[] }) {
  const [openDay, setOpenDay] = useState<number>(1);

  return (
    <div className="space-y-14">
      {units.map((unit) => (
        <div key={unit.title}>
          <div className="mb-6">
            <h3 className="font-display text-2xl font-medium text-white">{unit.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{unit.summary}</p>
          </div>

          <div className="space-y-3">
            {unit.lessons.map((lesson) => {
              const isOpen = openDay === lesson.day;
              return (
                <div
                  key={lesson.day}
                  className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                    isOpen
                      ? "border-teal-300/30 bg-white/[0.04]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <button
                    onClick={() => setOpenDay(isOpen ? -1 : lesson.day)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                          isOpen
                            ? "bg-gradient-to-br from-teal-300 to-purple-300 text-navy-950"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {String(lesson.day).padStart(2, "0")}
                      </span>
                      <div>
                        <p className={`font-display text-base font-medium sm:text-lg ${isOpen ? "text-white" : "text-white/85"}`}>
                          {lesson.title}
                        </p>
                        <p className="mt-0.5 hidden text-xs text-white/40 sm:block">
                          Day {lesson.day} · {lesson.essentialQuestion}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-white/40 transition-transform duration-300 ${isOpen ? "rotate-180 text-teal-300" : ""}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/10 px-5 pb-7 pt-5 sm:px-6">
                          <p className="text-sm italic leading-relaxed text-white/60 sm:hidden">
                            {lesson.essentialQuestion}
                          </p>

                          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div>
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-300/80">
                                <Target size={13} />
                                Objectives
                              </div>
                              <ul className="mt-3 space-y-2">
                                {lesson.objectives.map((obj) => (
                                  <li key={obj} className="flex gap-2 text-sm leading-relaxed text-white/75">
                                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-300" />
                                    {obj}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-purple-300/80">
                                <BookOpen size={13} />
                                Key Vocabulary
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {lesson.vocabulary.map((word) => (
                                  <span
                                    key={word}
                                    className="rounded-full border border-purple-300/20 bg-purple-300/5 px-3 py-1 text-xs font-medium text-purple-100"
                                  >
                                    {word}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-6">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/80">
                              <ListChecks size={13} />
                              Lesson Flow
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {lesson.flow.map((step, i) => (
                                <div
                                  key={step.label}
                                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                                >
                                  <p className="text-xs font-semibold text-amber-200/90">
                                    {i + 1}. {step.label}
                                  </p>
                                  <p className="mt-1.5 text-sm leading-relaxed text-white/65">{step.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-teal-300/15 bg-teal-300/5 p-4">
                            <ClipboardCheck size={15} className="mt-0.5 shrink-0 text-teal-300" />
                            <p className="text-sm leading-relaxed text-white/75">
                              <span className="font-semibold text-teal-200">Assessment: </span>
                              {lesson.assessment}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
