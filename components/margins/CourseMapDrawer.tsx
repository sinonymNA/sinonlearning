"use client";

import { Lock, X } from "lucide-react";
import type { PracticeCourse } from "@/lib/marginsPracticeCourses";
import { getModuleTheme } from "./moduleThemes";

interface Props {
  course: PracticeCourse;
  moduleOrder: number;
  pageIndex: number;
  furthestModule: number;
  furthestPage: number;
  onNavigate: (moduleOrder: number, pageIndex: number) => void;
  onClose: () => void;
}

export default function CourseMapDrawer({
  course,
  moduleOrder,
  pageIndex,
  furthestModule,
  furthestPage,
  onNavigate,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-stone-900/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <p className="text-[15px] font-bold text-stone-900">Course map</p>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
            aria-label="Close course map"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[11px] text-stone-400">Tap any dot to revisit a page.</p>
          <div className="flex flex-col gap-2">
            {course.modules.map((m) => {
              const theme = getModuleTheme(m.id);
              const Icon = theme.icon;
              const unlocked = m.order <= furthestModule;
              const isCurrentModule = m.order === moduleOrder;

              return (
                <div
                  key={m.id}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    isCurrentModule ? `${theme.cardBorder} bg-stone-50/60` : "border-stone-100"
                  } ${!unlocked ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        unlocked ? theme.iconBg : "bg-stone-100"
                      }`}
                    >
                      {unlocked ? (
                        <Icon size={15} className={theme.iconText} />
                      ) : (
                        <Lock size={13} className="text-stone-400" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-semibold text-stone-800 truncate">{m.title}</p>
                        {m.optional && (
                          <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-stone-500">
                            Bonus
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-stone-400 line-clamp-2">{m.tagline}</p>

                      {unlocked && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {m.pages.map((_, pIdx) => {
                            const pageUnlocked = m.order < furthestModule || pIdx <= furthestPage;
                            if (!pageUnlocked) return null;
                            const isCurrentPage = isCurrentModule && pIdx === pageIndex;
                            return (
                              <button
                                key={pIdx}
                                onClick={() => onNavigate(m.order, pIdx)}
                                aria-label={`Go to ${m.title}, page ${pIdx + 1}`}
                                title={`Go to ${m.title}, page ${pIdx + 1}`}
                                className={`h-3 w-3 cursor-pointer rounded-full transition-transform hover:scale-125 ${
                                  isCurrentPage
                                    ? `${theme.pill} ring-2 ring-offset-1 ${theme.ring}`
                                    : `${theme.pill} opacity-40 hover:opacity-80`
                                }`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
