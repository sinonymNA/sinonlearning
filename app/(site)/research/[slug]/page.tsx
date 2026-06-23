import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import ComingSoonBadge from "@/components/ComingSoonBadge";
import RelatedResources from "@/components/RelatedResources";
import { getResearchTopicBySlug } from "@/data/research";
import { SITE_URL } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getResearchTopicBySlug(slug);
  if (!entry) return {};

  return {
    title: `${entry.title} — Sinon Learning`,
    description: entry.description,
    alternates: { canonical: `${SITE_URL}/research/${entry.slug}` },
  };
}

const RESEARCH_TO_PRACTICE_SECTIONS = [
  {
    label: "The Big Idea",
    body:
      "Retrieval practice—actively pulling information out of memory instead of just re-reading it—builds longer-lasting learning than almost any other study habit. A quick, low-stakes recall task beats a second pass through the notes.",
  },
  {
    label: "What the Research Says",
    body:
      "Decades of cognitive science research, much of it summarized in work by Roediger and Karpicke, show that students who practice recalling information score higher on delayed tests than students who simply restudy the same material—even when the restudy group spends more total time on the material.",
  },
  {
    label: "Why It Matters",
    body:
      "Most students default to re-reading and highlighting because it feels productive, but feeling productive and actually retaining information are two different things. Retrieval practice closes that gap, and it costs nothing extra to implement.",
  },
  {
    label: "What Teachers Can Do Tomorrow",
    body:
      "Open class with a two-minute, no-stakes recall warm-up: 'Write down everything you remember from yesterday before we look at any notes.' Then check it against the real material together. No grading, no prep beyond yesterday's lesson.",
  },
  {
    label: "What Not to Overclaim",
    body:
      "Retrieval practice is not a silver bullet, and it does not replace good initial instruction—a student can only retrieve what was actually taught well in the first place. It also works best spaced out over days, not crammed into a single class period.",
  },
  {
    label: "Classroom Example",
    body:
      "In an Everyday Economics unit on supply and demand, a teacher closes Monday's lesson by having students jot down three things they learned with no notes in front of them. Wednesday, before introducing elasticity, students get sixty seconds to recall Monday's three ideas before the new material connects to them.",
  },
];

export default async function ResearchTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getResearchTopicBySlug(slug);
  if (!entry) notFound();

  return (
    <div className="bg-navy-950">
      <section className="bg-circuit relative overflow-hidden px-6 pt-16 pb-16 lg:px-8 lg:pt-24">
        <div className="absolute left-1/3 top-0 -z-10 h-96 w-96 -translate-y-1/3 rounded-full bg-teal-400/15 blur-[120px]" />
        <div className="absolute -right-20 top-40 -z-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[110px]" />

        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <Link
              href="/research"
              className="group inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-teal-200"
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              All Research
            </Link>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="mt-6">
              {entry.status === "Coming Soon" && <ComingSoonBadge theme="dark" />}
            </div>
            <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-white sm:text-5xl">
              {entry.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/65">
              {entry.description}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {entry.externalHref ? (
            <FadeIn>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
                <p className="text-white/65">{entry.tagline}</p>
                <Link
                  href={entry.externalHref}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
                >
                  Open {entry.title}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </FadeIn>
          ) : entry.slug === "research-to-practice" ? (
            <div className="space-y-6">
              {RESEARCH_TO_PRACTICE_SECTIONS.map((section, index) => (
                <FadeIn key={section.label} delay={index * 0.05}>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-teal-300/70">
                      {section.label}
                    </span>
                    <p className="mt-3 leading-relaxed text-white/75">{section.body}</p>
                  </div>
                </FadeIn>
              ))}
              <FadeIn delay={RESEARCH_TO_PRACTICE_SECTIONS.length * 0.05}>
                <RelatedResources
                  theme="dark"
                  title="Keep exploring"
                  links={[
                    { label: "Teaching Lab", href: "/teaching-lab" },
                    { label: "Classroom Tools", href: "/tools" },
                    { label: "Curriculum", href: "/curriculum" },
                  ]}
                />
              </FadeIn>
            </div>
          ) : (
            <FadeIn>
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
                <p className="text-white/55">
                  {entry.title} is still in development. {entry.tagline}
                </p>
                <Link
                  href="/research"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
                >
                  Back to Research
                </Link>
              </div>
            </FadeIn>
          )}
        </div>
      </section>
    </div>
  );
}
