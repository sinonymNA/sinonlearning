import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Sparkles, Coins, NotebookPen, ListChecks, Lightbulb } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import MarginsLogo from "@/components/MarginsLogo";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Students — Sinon Learning",
  description:
    "Apps built for you, not just your classroom — Margins writing practice, digital textbooks, simulations, and AI literacy.",
  alternates: { canonical: `${SITE_URL}/students` },
};

const icon = (children: React.ReactNode) => (
  <svg viewBox="0 0 48 48" className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const tools = [
  {
    slug: "margins",
    href: "/margins",
    status: "live" as const,
    bgClass: "bg-gradient-to-br from-violet-500 to-violet-700",
    logo: (
      <div className="rounded-2xl bg-white px-5 py-3 shadow-sm">
        <MarginsLogo width={130} />
      </div>
    ),
    logoSub: "AP Writing & Grading",
    name: "Margins",
    tagline: "Write DBQ, LEQ, and SAQ essays and get KORA-graded, annotated feedback against your teacher's rubric.",
  },
  {
    slug: "digital-textbooks",
    href: "/textbooks",
    status: "live" as const,
    bgClass: "bg-gradient-to-br from-sky-500 to-sky-700",
    logo: <BookOpen size={48} strokeWidth={1.75} className="text-white" />,
    logoSub: "Digital Textbooks",
    name: "Digital Textbooks",
    tagline: "Modern, readable textbooks built for the screen — browse the growing library.",
  },
  {
    slug: "simulations",
    href: "/simulations",
    status: "live" as const,
    bgClass: "bg-gradient-to-br from-teal-500 to-teal-700",
    logo: icon(
      <>
        <rect x="4" y="28" width="8" height="16" rx="2" />
        <rect x="20" y="18" width="8" height="26" rx="2" />
        <rect x="36" y="8" width="8" height="36" rx="2" />
        <polyline points="8,20 20,14 36,6" />
      </>
    ),
    logoSub: "Simulations & Games",
    name: "Simulations & Games",
    tagline: "Run a lemonade stand, build a stock portfolio, and learn economics by doing it.",
  },
  {
    slug: "ai-literacy",
    href: "/ai",
    status: "live" as const,
    bgClass: "bg-gradient-to-br from-indigo-500 to-indigo-700",
    logo: <Sparkles size={44} strokeWidth={1.75} className="text-white" />,
    logoSub: "AI Literacy",
    name: "AI Literacy for Students",
    tagline: "Understand the AI you already use every day — where it helps, and where it fails.",
  },
  {
    slug: "personal-finance-tools",
    href: "/simulations/stock-market-basics",
    status: "live" as const,
    bgClass: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    logo: <Coins size={44} strokeWidth={1.75} className="text-white" />,
    logoSub: "Personal Finance",
    name: "Personal Finance Tools",
    tagline: "Start with $10,000 in cash and build a portfolio using real, live stock prices.",
  },
  {
    slug: "study-guides",
    href: null,
    status: "soon" as const,
    bgClass: "bg-gradient-to-br from-stone-500 to-stone-600",
    logo: <NotebookPen size={44} strokeWidth={1.75} className="text-white" />,
    logoSub: "Study Guides",
    name: "Study Guides",
    tagline: "Clear, visual guides that distill each unit into the key ideas you need before a test.",
  },
  {
    slug: "practice-activities",
    href: null,
    status: "soon" as const,
    bgClass: "bg-gradient-to-br from-stone-500 to-stone-600",
    logo: <ListChecks size={44} strokeWidth={1.75} className="text-white" />,
    logoSub: "Practice Activities",
    name: "Practice Activities",
    tagline: "Short, focused practice tied directly to Sinon Learning's curriculum units.",
  },
  {
    slug: "explainers",
    href: null,
    status: "soon" as const,
    bgClass: "bg-gradient-to-br from-stone-500 to-stone-600",
    logo: <Lightbulb size={44} strokeWidth={1.75} className="text-white" />,
    logoSub: "Explainers",
    name: "Explainers",
    tagline: "Short, clear breakdowns of tricky ideas from across the curriculum.",
  },
];

export default function StudentsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page header */}
      <div className="px-6 pt-16 pb-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
              For Students
            </p>
            <h1 className="font-display text-4xl font-medium text-navy-900 tracking-tight leading-tight">
              Apps built for you, not just your classroom.
            </h1>
            <p className="mt-3 text-lg text-navy-700/70 max-w-lg">
              Free to use, built to actually help you understand the material.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* App grid */}
      <div className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, i) => {
              const inner = (
                <div
                  className={[
                    "group flex flex-col rounded-3xl border bg-white overflow-hidden transition-all duration-300",
                    tool.href
                      ? "border-stone-100 hover:border-stone-200 hover:shadow-2xl hover:-translate-y-1.5 hover:-rotate-1 cursor-pointer"
                      : "border-stone-100 opacity-80",
                  ].join(" ")}
                >
                  {/* Logo area */}
                  <div
                    className={`h-52 flex flex-col items-center justify-center gap-2.5 ${tool.bgClass}`}
                  >
                    {tool.logo}
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60 mt-1">
                      {tool.logoSub}
                    </span>
                  </div>

                  {/* Info area */}
                  <div className="p-5 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-[15px] font-semibold text-navy-900">
                        {tool.name}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        {tool.status === "live" ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            Live
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
                            Soon
                          </span>
                        )}
                        {tool.href && (
                          <ArrowUpRight
                            size={16}
                            className="text-stone-300 group-hover:text-stone-600 transition-colors"
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] text-stone-500 leading-relaxed">
                      {tool.tagline}
                    </p>
                  </div>
                </div>
              );

              return (
                <FadeIn key={tool.slug} delay={i * 0.07}>
                  {tool.href ? (
                    <Link href={tool.href} className="block">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
