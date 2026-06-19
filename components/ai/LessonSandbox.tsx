"use client";

import { Sparkles } from "lucide-react";
import type { AILessonSandbox } from "@/data/aiCourses";
import DecisionBoundarySandbox from "@/components/ai/sandboxes/DecisionBoundarySandbox";
import NeuralNetworkPlayground from "@/components/ai/sandboxes/NeuralNetworkPlayground";
import BiasDetectiveSandbox from "@/components/ai/sandboxes/BiasDetectiveSandbox";
import CalibrationSandbox from "@/components/ai/sandboxes/CalibrationSandbox";

export default function LessonSandbox({ sandbox }: { sandbox: AILessonSandbox }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-purple-300/20 bg-white/[0.03] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-400/15 blur-3xl" />
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-purple-300/80">
        <Sparkles size={12} />
        Interactive Sandbox
      </p>
      <h3 className="mt-2 font-display text-xl font-medium text-white">{sandbox.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{sandbox.description}</p>
      <div className="mt-6">
        {sandbox.type === "decision-boundary" && <DecisionBoundarySandbox />}
        {sandbox.type === "neural-network" && <NeuralNetworkPlayground />}
        {sandbox.type === "bias-detective" && <BiasDetectiveSandbox />}
        {sandbox.type === "calibration" && <CalibrationSandbox />}
      </div>
    </div>
  );
}
