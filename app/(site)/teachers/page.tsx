import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import MarginsLogo from "@/components/MarginsLogo";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Teachers — Sinon Learning",
  description:
    "Apps built for how you actually teach — Scaffold notes generator, KORA Game, classroom simulations, and daily classroom tools.",
  alternates: { canonical: `${SITE_URL}/teachers` },
};

function ScaffoldWordmark({ light = false }: { light?: boolean }) {
  return (
    <span
      className="font-extrabold tracking-tight select-none text-3xl"
      style={
        light
          ? { color: "#fff" }
          : {
              background: "linear-gradient(90deg, #9061F9 0%, #5B21B6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }
      }
    >
      [scaffold]
    </span>
  );
}

const tools = [
  {
    slug: "scaffold",
    href: "/notesheet",
    status: "live" as const,
    bgClass: "bg-gradient-to-br from-violet-500 to-violet-700",
    logo: <ScaffoldWordmark light />,
    logoSub: "Notes Generator",
    name: "Scaffold",
    tagline: "Upload a slideshow — KORA reads the lesson and builds a student notesheet in seconds.",
  },
  {
    slug: "margins",
    href: "/margins",
    status: "live" as const,
    bgClass: "bg-gradient-to-br from-stone-100 to-stone-200",
    logo: <MarginsLogo width={230} />,
    logoSubClass: "text-stone-400",
    logoSub: "AP Writing & Grading",
    name: "Margins",
    tagline: "Classes, rubric-based DBQ/LEQ/SAQ assignments, and KORA-graded, annotated feedback for students.",
  },
  {
    slug: "kora-game",
    href: null,
    status: "soon" as const,
    bgClass: "bg-gradient-to-br from-indigo-900 to-indigo-700",
    logo: (
      <div className="rounded-2xl bg-white/15 px-6 py-3 backdrop-blur-sm">
        <Image src="/kora-logo.png" alt="KORA" width={120} height={45} style={{ width: 120, height: "auto" }} />
      </div>
    ),
    logoSub: "KORA Game",
    name: "KORA Game",
    tagline: "Students type answers in a live game. KORA scores depth of understanding, not just recall.",
  },
  {
    slug: "simulations",
    href: "/simulations",
    status: "live" as const,
    bgClass: "bg-gradient-to-br from-teal-500 to-teal-700",
    logo: (
      <svg viewBox="0 0 48 48" className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="28" width="8" height="16" rx="2" />
        <rect x="20" y="18" width="8" height="26" rx="2" />
        <rect x="36" y="8" width="8" height="36" rx="2" />
        <polyline points="8,20 20,14 36,6" />
      </svg>
    ),
    logoSub: "Simulations & Games",
    name: "Simulations & Games",
    tagline: "Live economics simulators — Lemonade Stand, Stock Market, and more — built for classroom use.",
  },
  {
    slug: "classroom-tools",
    href: "/tools",
    status: "live" as const,
    bgClass: "bg-gradient-to-br from-amber-500 to-amber-600",
    logo: (
      <svg viewBox="0 0 48 48" className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="44" height="30" rx="4" />
        <line x1="16" y1="42" x2="32" y2="42" />
        <line x1="24" y1="36" x2="24" y2="42" />
        <line x1="10" y1="18" x2="10" y2="22" />
        <line x1="24" y1="14" x2="24" y2="22" />
        <line x1="38" y1="10" x2="38" y2="22" />
      </svg>
    ),
    logoSub: "Classroom Tools",
    name: "Classroom Tools",
    tagline: "Classboard, Game Show Generator, and a growing set of daily classroom utilities.",
  },
];

export default function TeachersPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page header */}
      <div className="px-6 pt-16 pb-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
              For Teachers
            </p>
            <h1 className="font-display text-4xl font-medium text-navy-900 tracking-tight leading-tight">
              Apps built for how you actually teach.
            </h1>
            <p className="mt-3 text-lg text-navy-700/70 max-w-lg">
              Each tool does one thing well — pick it up, use it, and get back to teaching.
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
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-widest mt-1 ${
                        "logoSubClass" in tool ? tool.logoSubClass : "text-white/60"
                      }`}
                    >
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
