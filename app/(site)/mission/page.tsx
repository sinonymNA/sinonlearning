import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, GraduationCap, School } from "lucide-react";
import PageHero from "@/components/PageHero";
import PillarCard from "@/components/PillarCard";
import FeatureCard from "@/components/FeatureCard";
import RelatedResources from "@/components/RelatedResources";
import FadeIn from "@/components/FadeIn";
import { missionTopics } from "@/data/missionTopics";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mission — Sinon Learning",
  description:
    "Sinon Learning's mission: a fundamental right to great learning, teacher-first AI, and a classroom that stays human.",
  alternates: { canonical: `${SITE_URL}/mission` },
};

const pillars = [
  {
    icon: HeartHandshake,
    title: "Free core learning resources",
    description: "The essential curriculum library stays free, always.",
    tint: "teal" as const,
  },
  {
    icon: GraduationCap,
    title: "Built by a real teacher",
    description: "Designed from real classroom experience, not guesswork.",
    tint: "rose" as const,
  },
  {
    icon: School,
    title: "Designed for real classrooms",
    description: "Practical, usable, and ready for the way teachers actually teach.",
    tint: "amber" as const,
  },
];

const otherTopics = missionTopics.filter((topic) => topic.slug !== "kora-constitution");

export default function MissionPage() {
  return (
    <div className="bg-cream-50">
      <PageHero
        eyebrow="Mission"
        title="Great learning is a fundamental right, not a line item."
        description="A student's education should not depend on what their school district can afford, and a teacher should not have to spend their own money to provide it. That belief is the foundation everything else at Sinon Learning is built on."
      />

      <section className="bg-cream-100 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {pillars.map((pillar, i) => (
              <FadeIn key={pillar.title} delay={i * 0.08}>
                <PillarCard {...pillar} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <FadeIn>
            <p className="font-display text-2xl font-medium leading-snug text-navy-900 sm:text-3xl">
              &ldquo;A student&rsquo;s learning should never be limited by what their school district can
              afford.&rdquo;
            </p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <p className="font-display text-2xl font-medium leading-snug text-navy-900 sm:text-3xl">
              &ldquo;AI should make teachers more powerful, not more disposable.&rdquo;
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-navy-950 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">
              The KORA Constitution
            </p>
            <h2 className="mt-4 font-display text-2xl font-medium text-white sm:text-3xl">
              Eight principles that govern how KORA is built.
            </h2>
            <Link
              href="/mission/kora-constitution"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-300 px-6 py-3 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
            >
              Read the Constitution
              <ArrowRight size={14} />
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otherTopics.map((topic) => (
              <FadeIn key={topic.slug}>
                <FeatureCard
                  item={{
                    title: topic.title,
                    description: topic.description,
                    status: "Available",
                    href: `/mission/${topic.slug}`,
                  }}
                />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <RelatedResources
            title="Keep exploring"
            links={[
              { label: "Research", href: "/research" },
              { label: "KORA Model", href: "/research/kora-model" },
              { label: "Curriculum", href: "/curriculum" },
            ]}
          />
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <FadeIn>
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-navy-900/8 bg-white px-8 py-14 text-center shadow-[0_30px_60px_-15px_rgba(13,27,46,0.12)] sm:px-16">
            <div className="absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/15 blur-[100px]" />
            <h2 className="font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
              Built for every classroom, not just the ones that can pay for it.
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/curriculum"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-navy-950 transition-colors hover:bg-amber-400"
              >
                Explore Curriculum
              </Link>
              <Link
                href="/research/kora-model"
                className="inline-flex items-center gap-2 rounded-full border border-navy-900/15 bg-white px-6 py-3 text-sm font-medium text-navy-900 transition-colors hover:border-teal-600/40 hover:text-teal-700"
              >
                Meet KORA
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
