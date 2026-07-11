import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Students — Sinon Learning",
  description:
    "Apps built for you, not just your classroom — Margins writing practice, digital textbooks, simulations, and AI literacy.",
  alternates: { canonical: `${SITE_URL}/students` },
};
import { ArrowUpRight, BookOpen, Sparkles, Coins, NotebookPen, ListChecks, Lightbulb, HardHat } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import MarginsLogo from "@/components/MarginsLogo";
import DashLogo from "@/components/DashLogo";

const icon = (children: React.ReactNode) => (
  <svg viewBox="0 0 48 48" className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

type Tool = {
  slug: string;
  href: string | null;
  status: "live" | "soon";
  bgClass: string;
  logo: React.ReactNode;
  logoSubClass?: string;
  logoSub: string;
  name: string;
  tagline: string;
};

const featuredTools: Tool[] = [
  {
    slug: "margins",
    href: "/margins",
    status: "live",
    bgClass: "bg-gradient-to-br from-stone-100 to-stone-200",
    logo: <MarginsLogo width={230} />,
    logoSubClass: "text-stone-400",
    logoSub: "AP Writing & Grading",
    name: "Margins",
    tagline: "Write DBQ, LEQ, and SAQ essays and get KORA-graded, annotated feedback against your teacher's rubric.",
  },
  {
    slug: "dash-jamboard",
    href: "/dash/join",
    status: "live",
    bgClass: "bg-[#4ac57b]",
    logo: <DashLogo width={190} />,
    logoSub: "Classroom Jamboard",
    name: "Dash Jamboard",
    tagline: "Join your class's live jamboard with a code — post sticky notes, images, and links everyone sees instantly.",
  },
  {
    slug: "life-budget",
    href: "/simulations/life-budget",
    status: "live",
    bgClass: "bg-white",
    logo: (
      <Image
        src="/pf-portfolio-logo.png"
        alt="Personal Finance Portfolio"
        width={200}
        height={200}
        className="object-contain"
        style={{ maxHeight: 160 }}
      />
    ),
    logoSub: "Personal Finance",
    logoSubClass: "text-stone-400",
    name: "Personal Finance Portfolio",
    tagline: "Work through 9 real-world modules — paycheck, budget, banking, credit, investing, and more.",
  },
];

const moreTools: Tool[] = [
  {
    slug: "digital-textbooks",
    href: "/textbooks",
    status: "live",
    bgClass: "bg-gradient-to-br from-sky-500 to-sky-700",
    logo: <BookOpen size={48} strokeWidth={1.75} className="text-white" />,
    logoSub: "Digital Textbooks",
    name: "Digital Textbooks",
    tagline: "Modern, readable textbooks built for the screen — browse the growing library.",
  },
  {
    slug: "simulations",
    href: "/simulations",
    status: "live",
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
    status: "live",
    bgClass: "bg-gradient-to-br from-indigo-500 to-indigo-700",
    logo: <Sparkles size={44} strokeWidth={1.75} className="text-white" />,
    logoSub: "AI Literacy",
    name: "AI Literacy for Students",
    tagline: "Understand the AI you already use every day — where it helps, and where it fails.",
  },
  {
    slug: "personal-finance-tools",
    href: "/simulations/stock-market-basics",
    status: "live",
    bgClass: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    logo: <Coins size={44} strokeWidth={1.75} className="text-white" />,
    logoSub: "Personal Finance",
    name: "Personal Finance Tools",
    tagline: "Start with $10,000 in cash and build a portfolio using real, live stock prices.",
  },
  {
    slug: "study-guides",
    href: null,
    status: "soon",
    bgClass: "bg-gradient-to-br from-stone-500 to-stone-600",
    logo: <NotebookPen size={44} strokeWidth={1.75} className="text-white" />,
    logoSub: "Study Guides",
    name: "Study Guides",
    tagline: "Clear, visual guides that distill each unit into the key ideas you need before a test.",
  },
  {
    slug: "practice-activities",
    href: null,
    status: "soon",
    bgClass: "bg-gradient-to-br from-stone-500 to-stone-600",
    logo: <ListChecks size={44} strokeWidth={1.75} className="text-white" />,
    logoSub: "Practice Activities",
    name: "Practice Activities",
    tagline: "Short, focused practice tied directly to Sinon Learning's curriculum units.",
  },
  {
    slug: "explainers",
    href: null,
    status: "soon",
    bgClass: "bg-gradient-to-br from-stone-500 to-stone-600",
    logo: <Lightbulb size={44} strokeWidth={1.75} className="text-white" />,
    logoSub: "Explainers",
    name: "Explainers",
    tagline: "Short, clear breakdowns of tricky ideas from across the curriculum.",
  },
];

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const inner = (
    <div
      className={[
        "group flex flex-col rounded-3xl border bg-white overflow-hidden transition-all duration-300",
        tool.href
          ? "border-stone-100 hover:border-stone-200 hover:shadow-2xl hover:-translate-y-1.5 hover:-rotate-1 cursor-pointer"
          : "border-stone-100 opacity-80",
      ].join(" ")}
    >
      <div className={`h-52 flex flex-col items-center justify-center gap-2.5 ${tool.bgClass}`}>
        {tool.logo}
        <span
          className={`text-[11px] font-semibold uppercase tracking-widest mt-1 ${
            tool.logoSubClass ?? "text-white/60"
          }`}
        >
          {tool.logoSub}
        </span>
      </div>
      <div className="p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold text-navy-900">{tool.name}</h3>
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
              <ArrowUpRight size={16} className="text-stone-300 group-hover:text-stone-600 transition-colors" />
            )}
          </div>
        </div>
        <p className="text-[13px] text-stone-500 leading-relaxed">{tool.tagline}</p>
      </div>
    </div>
  );

  return (
    <FadeIn delay={index * 0.07}>
      {tool.href ? <Link href={tool.href} className="block">{inner}</Link> : inner}
    </FadeIn>
  );
}

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

      {/* Featured tools */}
      <div className="px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Under construction divider */}
      <div className="px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-stone-200" />
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200">
                <HardHat size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
                  Under Construction
                </span>
              </div>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <p className="text-center text-[12px] text-stone-400 mt-2 mb-10">
              More tools in the works — check back soon.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* More tools */}
      <div className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {moreTools.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
