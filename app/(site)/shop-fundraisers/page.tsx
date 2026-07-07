import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Store, School, Landmark } from "lucide-react";
import PageHero from "@/components/PageHero";
import PillarCard from "@/components/PillarCard";
import PromiseCard from "@/components/PromiseCard";
import RelatedResources from "@/components/RelatedResources";
import FadeIn from "@/components/FadeIn";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Shop & Fundraisers — Sinon Learning",
  description:
    "Sinon Shop and School Fundraising fund Sinon Learning's free-education mission — without ever putting curriculum or tools behind a paywall.",
  alternates: { canonical: `${SITE_URL}/shop-fundraisers` },
};

const pillars = [
  {
    icon: HeartHandshake,
    title: "Free Education",
    description: "The mission. KORA, Dash, Slider, Margins, curriculum, and every core tool — free, always.",
    tint: "teal" as const,
  },
  {
    icon: Store,
    title: "Sinon Shop",
    description: "The engine — teacher merchandise and classroom products, selected because they're useful for educators.",
    tint: "amber" as const,
  },
  {
    icon: School,
    title: "School Fundraising",
    description: "Schools get a storefront. Families buy products. Revenue splits 50/50 with the school.",
    tint: "amber" as const,
  },
  {
    icon: Landmark,
    title: "Grants & Partnerships",
    description: "Foundations, companies, and philanthropy — revenue whose purpose is expanding free education.",
    tint: "rose" as const,
  },
];

export default function ShopFundraisersPage() {
  return (
    <div className="bg-cream-50">
      <PageHero
        eyebrow="Shop & Fundraisers"
        title="A store that funds free education."
        description="A student's learning should never depend on what their family or school district can afford. Sinon Shop and School Fundraising exist to make sure of it — turning everyday purchases into free curriculum, free tools, and classroom grants."
      />

      <section className="bg-cream-100 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, i) => (
              <FadeIn key={pillar.title} delay={i * 0.08}>
                <PillarCard {...pillar} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-xl">
          <FadeIn>
            <PromiseCard
              quote="At least 50% of Sinon Learning's annual net profits are reinvested directly into improving education."
              attribution="The Sinon Learning Public Promise"
            />
          </FadeIn>
        </div>
      </section>

      <section className="bg-navy-950 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-300/80">
              The Financial Framework
            </p>
            <h2 className="mt-4 font-display text-2xl font-medium text-white sm:text-3xl">
              The four pillars, where every dollar goes, and the long-term plan.
            </h2>
            <Link
              href="/shop-fundraisers/financial-framework"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-medium text-navy-950 transition-colors hover:bg-amber-200"
            >
              Read the Financial Framework
              <ArrowRight size={14} />
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <RelatedResources
            title="Keep exploring"
            links={[
              { label: "Mission", href: "/mission" },
              { label: "Curriculum", href: "/curriculum" },
              { label: "Teachers", href: "/teachers" },
            ]}
          />
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <FadeIn>
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-navy-900/8 bg-white px-8 py-14 text-center shadow-[0_30px_60px_-15px_rgba(13,27,46,0.12)] sm:px-16">
            <div className="absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/15 blur-[100px]" />
            <h2 className="font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
              Every purchase helps build free education.
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/shop-fundraisers/financial-framework"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-navy-950 transition-colors hover:bg-amber-400"
              >
                Read the Financial Framework
              </Link>
              <Link
                href="/mission"
                className="inline-flex items-center gap-2 rounded-full border border-navy-900/15 bg-white px-6 py-3 text-sm font-medium text-navy-900 transition-colors hover:border-amber-600/40 hover:text-amber-700"
              >
                Our Mission
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
