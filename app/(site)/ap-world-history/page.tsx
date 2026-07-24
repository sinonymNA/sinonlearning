import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, PenLine, Globe } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import MarginsLogo from "@/components/MarginsLogo";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AP World History — Sinon Learning",
  description:
    "Your AP World History toolkit — write and get AI feedback on DBQ, LEQ, and SAQ essays in Margins, and practice timed HAPP source analysis in Source Room.",
  alternates: { canonical: `${SITE_URL}/ap-world-history` },
};

const HAPP_SKILLS = [
  {
    letter: "H",
    label: "Historical Context",
    color: "bg-teal-100 text-teal-800",
    desc: "What was happening before or around this source that shaped it?",
  },
  {
    letter: "A",
    label: "Audience",
    color: "bg-amber-100 text-amber-800",
    desc: "Who was this source meant for, and how did that affect what it said?",
  },
  {
    letter: "P",
    label: "Purpose",
    color: "bg-rose-100 text-rose-800",
    desc: "What was the author trying to accomplish by creating this source?",
  },
  {
    letter: "P",
    label: "Point of View",
    color: "bg-indigo-100 text-indigo-800",
    desc: "How does the author's identity, position, or experience shape the content?",
  },
];

const ESSAY_TYPES = [
  {
    abbr: "DBQ",
    name: "Document-Based Question",
    desc: "Analyze 7 documents and write an argument — the most writing-intensive question on the exam.",
    weight: "25% of exam score",
  },
  {
    abbr: "LEQ",
    name: "Long Essay Question",
    desc: "Take a position on a historical question and defend it with evidence over 4–5 paragraphs.",
    weight: "15% of exam score",
  },
  {
    abbr: "SAQ",
    name: "Short-Answer Question",
    desc: "Concise paragraph responses that test your ability to describe, explain, and evaluate.",
    weight: "20% of exam score",
  },
];

export default function ApWorldHistoryPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-navy-900 px-6 pt-16 pb-20 lg:px-8">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #5eead4 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 40%)" }}
        />
        <div className="relative mx-auto max-w-4xl">
          <FadeIn>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
                <Globe size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-cream-50/40">
                AP World History
              </span>
            </div>
            <h1 className="font-display text-4xl font-semibold text-cream-50 leading-tight sm:text-5xl">
              Your AP World History toolkit.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-cream-50/65 leading-relaxed">
              Write and get AI feedback on your essays in Margins. Practice timed HAPP
              source analysis in Source Room. Both tools are built around exactly what
              the AP exam tests.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Two main tools */}
      <div className="px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="mb-6 text-[11px] font-bold uppercase tracking-widest text-navy-900/40">
              Your Tools
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            {/* Margins card */}
            <FadeIn delay={0.05}>
              <Link href="/margins" className="group block h-full">
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-gradient-to-br from-stone-50 to-stone-100 px-8 py-12">
                    <MarginsLogo width={200} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                      AP Writing &amp; Grading
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-display text-lg font-semibold text-navy-900">Margins</h2>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        Live
                      </span>
                    </div>
                    <p className="text-sm text-navy-800/60 leading-relaxed mb-4">
                      Write DBQ, LEQ, and SAQ essays and get KORA-graded, annotated feedback
                      against your teacher&apos;s rubric. See exactly where you earned points
                      and what to fix.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {["DBQ", "LEQ", "SAQ"].map((t) => (
                        <span key={t} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-500">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 group-hover:gap-2.5 transition-all">
                      Open Margins
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </FadeIn>

            {/* Source Room card */}
            <FadeIn delay={0.1}>
              <Link href="/tools/source-room/join" className="group block h-full">
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-gradient-to-br from-teal-600 to-teal-700 px-8 py-12">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-white">
                      <BookOpen size={40} strokeWidth={1.5} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
                      Live Source Analysis
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-display text-lg font-semibold text-navy-900">Source Room</h2>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        Live
                      </span>
                    </div>
                    <p className="text-sm text-navy-800/60 leading-relaxed mb-4">
                      Join your teacher&apos;s live session with a code, read the primary source,
                      and answer timed HAPP questions. KORA grades each response and gives
                      you instant feedback.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {["HAPP", "Timed", "AI Graded"].map((t) => (
                        <span key={t} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 group-hover:gap-2.5 transition-all">
                      Join a Session
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </FadeIn>

          </div>
        </div>
      </div>

      {/* HAPP explainer */}
      <div className="border-t border-navy-900/8 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-navy-900/40">
              Source Analysis
            </p>
            <h2 className="font-display text-2xl font-semibold text-navy-900">
              The HAPP framework
            </h2>
            <p className="mt-2 max-w-xl text-sm text-navy-800/55 leading-relaxed">
              Every primary source on the AP exam is analyzed through four lenses. Source Room
              gives you timed practice on each one — with AI feedback on how you did.
            </p>
          </FadeIn>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {HAPP_SKILLS.map((skill, i) => (
              <FadeIn key={skill.label} delay={i * 0.06}>
                <div className="flex gap-4 rounded-xl border border-navy-900/8 bg-cream-50 p-4">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-black ${skill.color}`}>
                    {skill.letter}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{skill.label}</p>
                    <p className="mt-0.5 text-xs text-navy-800/50 leading-relaxed">{skill.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* Essay types */}
      <div className="px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-navy-900/40">
              Free Response Questions
            </p>
            <h2 className="font-display text-2xl font-semibold text-navy-900">
              The three essay types
            </h2>
            <p className="mt-2 max-w-xl text-sm text-navy-800/55 leading-relaxed">
              Together, DBQ + LEQ + SAQ make up 60% of your AP score. Margins gives you
              KORA-graded practice on all three.
            </p>
          </FadeIn>
          <div className="mt-8 flex flex-col gap-3">
            {ESSAY_TYPES.map((essay, i) => (
              <FadeIn key={essay.abbr} delay={i * 0.06}>
                <div className="flex gap-5 rounded-xl border border-navy-900/8 bg-white p-5">
                  <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-[13px] font-black tracking-wide text-cream-50">
                    {essay.abbr}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-navy-900">{essay.name}</p>
                      <span className="text-[10px] font-semibold text-navy-900/35">{essay.weight}</span>
                    </div>
                    <p className="mt-1 text-xs text-navy-800/55 leading-relaxed">{essay.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/margins"
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                <PenLine size={15} />
                Practice essays in Margins
              </Link>
              <Link
                href="/tools/source-room/join"
                className="inline-flex items-center gap-2 rounded-full border border-navy-900/15 bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 hover:border-teal-500/40 hover:text-teal-700 transition-colors"
              >
                <BookOpen size={15} />
                Join a Source Room session
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
