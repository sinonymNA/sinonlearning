"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface KoraFlowStage {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function KoraFlowDiagram({ stages }: { stages: KoraFlowStage[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stages.map((stage, i) => (
        <motion.div
          key={stage.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: reduceMotion ? 0 : i * 0.08 }}
          className="group relative overflow-hidden rounded-2xl border border-navy-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(13,27,46,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_12px_32px_rgba(13,27,46,0.08)]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              {stage.icon}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-violet-500/80">
              Stage {String(i + 1).padStart(2, "0")}
            </span>
          </div>
          <p className="mt-4 text-sm font-semibold text-navy-900">{stage.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-navy-700/70">{stage.description}</p>

          {i < stages.length - 1 && (
            <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 text-navy-900/15 lg:block">
              →
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
