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
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-colors duration-300 hover:border-teal-300/30"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/10 text-teal-300">
              {stage.icon}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-teal-300/60">
              Stage {String(i + 1).padStart(2, "0")}
            </span>
          </div>
          <p className="mt-4 text-sm font-semibold text-white">{stage.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/60">{stage.description}</p>

          {i < stages.length - 1 && (
            <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 text-white/15 lg:block">
              →
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
