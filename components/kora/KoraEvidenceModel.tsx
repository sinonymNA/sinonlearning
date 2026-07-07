"use client";

import { FlaskConical, ArrowRight } from "lucide-react";
import FadeIn from "@/components/FadeIn";

const DIMENSIONS = [
  { key: "accuracy", label: "Accuracy", description: "Did the student get the underlying fact or claim right?" },
  { key: "causality", label: "Causality", description: "Can they explain why or how, not just recite what?" },
  { key: "application", label: "Application", description: "Can they use the concept on a new, concrete case?" },
  { key: "transfer", label: "Transfer", description: "Does the idea generalize to a different context or domain?" },
  { key: "model_quality", label: "Model Quality", description: "Is their overall mental model coherent, or built on a shaky misconception?" },
];

const LEVELS = ["Not Yet Shown", "Emerging", "Solid", "Strong"];

export default function KoraEvidenceModel() {
  return (
    <section className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-600">Research in progress</p>
            <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-amber-400 via-rose-300 to-teal-500" />
            <h2 className="mt-6 font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
              How we&rsquo;re training KORA to see understanding.
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-5">
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-700">
              <FlaskConical size={12} />
              In progress
            </span>
            <p className="text-sm leading-relaxed text-navy-700/80">
              Every live KORA feature today — Slider, Reel, Margins, Scaffold, Game Shows — calls Claude directly, the
              same models this page describes elsewhere. What follows describes a <span className="font-semibold text-navy-900">separate research pipeline</span>,
              fine-tuning our own small model, that is <span className="font-semibold text-navy-900">not yet deployed</span> and does not power any
              feature a teacher can use today.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.14}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-lg leading-relaxed text-navy-700/75">
            Most AI grading collapses a student&rsquo;s understanding into right or wrong. We think that throws away
            the most useful signal a teacher could get. So instead of one score, we&rsquo;re training a model to
            evaluate a response across five separate dimensions of evidence.
          </p>
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {DIMENSIONS.map((d, i) => (
            <FadeIn key={d.key} delay={0.05 * i}>
              <div className="h-full rounded-2xl border border-navy-900/8 bg-white p-5 shadow-[0_1px_2px_rgba(13,27,46,0.04)]">
                <p className="font-mono text-[10px] uppercase tracking-widest text-violet-500/70">
                  Dimension {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm font-semibold text-navy-900">{d.label}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-navy-700/65">{d.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.2}>
          <div className="mt-10 rounded-3xl border border-navy-900/8 bg-cream-100 p-8 sm:p-10">
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-violet-600">
              A four-level scale, not a binary
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {LEVELS.map((level, i) => (
                <div key={level} className="flex items-center gap-2">
                  <span className="rounded-full border border-navy-900/10 bg-white px-4 py-2 text-sm font-medium text-navy-800">
                    {level}
                  </span>
                  {i < LEVELS.length - 1 && <ArrowRight size={14} className="text-navy-900/25" />}
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-navy-700/75">
              Each dimension is scored on this scale independently — a student can be <span className="font-medium text-navy-900">Strong</span> on
              Accuracy while still <span className="font-medium text-navy-900">Emerging</span> on Transfer. And because the scale is ordered, we
              don&rsquo;t just grade a probe right or wrong — we measure <span className="font-medium text-navy-900">how far off</span> a prediction
              is, and in which direction, using an ordinal-distance metric during evaluation rather than plain accuracy.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
