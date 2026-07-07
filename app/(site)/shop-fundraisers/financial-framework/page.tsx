import type { Metadata } from "next";
import Link from "next/link";
import { Quote, Clock, PiggyBank, TrendingUp, CircleCheck } from "lucide-react";
import PageHero from "@/components/PageHero";
import RoadmapCard from "@/components/RoadmapCard";
import RelatedResources from "@/components/RelatedResources";
import FadeIn from "@/components/FadeIn";
import FrameworkTree from "@/components/shop/FrameworkTree";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "The Financial Framework — Sinon Learning",
  description:
    "The Sinon Learning Financial Framework: the four pillars, where every dollar goes, the public promise, and the long-term plan for a self-funding education ecosystem.",
  alternates: { canonical: `${SITE_URL}/shop-fundraisers/financial-framework` },
};

interface Pillar {
  title: string;
  role: string;
  body: string;
  pills: string[];
  href?: string;
  linkLabel?: string;
}

const pillars: Pillar[] = [
  {
    title: "Free Education",
    role: "The Mission",
    body: "This side of Sinon Learning never exists to maximize profit. It's what people know Sinon Learning for, and it always will be — everything here is free, or has a very generous free tier.",
    pills: [
      "KORA",
      "Dash",
      "Slider",
      "Margins",
      "Reel",
      "Curriculum",
      "Textbooks",
      "WebQuests",
      "Interactive Maps",
      "Escape Rooms",
      "Study Tools",
      "Teacher Resources",
    ],
    href: "/curriculum",
    linkLabel: "Explore the free library",
  },
  {
    title: "Sinon Shop",
    role: "The Engine",
    body: "This exists to fund the mission. Dropshipping is simply fulfillment — not the brand. The brand promise is that every product is selected because it's useful for educators.",
    pills: [
      "Teacher Merchandise",
      "Classroom Gadgets",
      "Electronics",
      "AP World Products",
      "Classroom Games",
      "Office Supplies",
      "School Supplies",
      "Teacher Gifts",
      "Custom School Merchandise",
      "Sinon Originals",
    ],
  },
  {
    title: "School Fundraising",
    role: "Could become one of the largest parts of the business",
    body: "Schools receive a storefront. Families purchase products. Revenue splits 50/50 — the school keeps half, Sinon keeps half — and Sinon's half goes toward building free education. Everybody wins.",
    pills: ["School Storefronts", "Family Purchases", "50/50 Split", "Builds Free Education"],
  },
  {
    title: "Grants & Partnerships",
    role: "Purpose: expand free education",
    body: "Revenue from foundations, companies, philanthropy, corporate sponsorships, and educational partnerships — all aimed at one purpose: expanding free education.",
    pills: ["Foundations", "Companies", "Philanthropy", "Corporate Sponsorships", "Educational Partnerships"],
  },
];

export default function FinancialFrameworkPage() {
  return (
    <div className="bg-cream-50">
      <PageHero
        backHref="/shop-fundraisers"
        backLabel="Shop & Fundraisers"
        eyebrow="The Financial Framework"
        title="The Sinon Learning Financial Framework"
        description="How free education, Sinon Shop, School Fundraising, and Grants & Partnerships fit together — and exactly where every dollar goes."
      />

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <p className="font-display text-2xl font-medium leading-snug text-navy-900 sm:text-3xl">
              &ldquo;Our mission: to make the highest-quality educational resources in the world available to
              everyone for free.&rdquo;
            </p>
            <p className="mt-5 text-navy-700/80">
              Students should never be unable to learn because they can&rsquo;t afford software or curriculum.
              Everything below exists to keep that true, permanently.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-amber-600">
              The Four Pillars
            </p>
            <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400" />
            <h2 className="mt-6 text-center font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
              Four pillars, one mission.
            </h2>
          </FadeIn>

          <ol className="mt-12 space-y-4">
            {pillars.map((pillar, index) => (
              <FadeIn key={pillar.title} delay={index * 0.06}>
                <li className="flex gap-4 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(13,27,46,0.04)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 font-mono text-sm font-semibold text-amber-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-medium text-navy-900">{pillar.title}</p>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-navy-700/50">
                      {pillar.role}
                    </p>
                    <p className="mt-3 leading-relaxed text-navy-800">{pillar.body}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {pillar.pills.map((pill) => (
                        <span
                          key={pill}
                          className="rounded-full border border-navy-900/10 bg-cream-100 px-3 py-1 text-xs text-navy-700/70"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                    {pillar.href && (
                      <Link
                        href={pillar.href}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800"
                      >
                        {pillar.linkLabel} →
                      </Link>
                    )}
                  </div>
                </li>
              </FadeIn>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-cream-100 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-amber-600">
              Where Every Dollar Goes
            </p>
            <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400" />
            <h2 className="mt-6 text-center font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
              Here&rsquo;s exactly where every dollar goes.
            </h2>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div className="mt-10">
              <RoadmapCard
                variant="pills"
                steps={[
                  "Customer Purchase",
                  "Product Cost",
                  "Shipping",
                  "Credit Card Fees",
                  "Operating Expenses",
                  "Employee Payroll",
                  "Profit",
                ]}
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.14}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-navy-700/70">
              A founder&rsquo;s salary is a normal business expense before profits are calculated — Sinon Learning
              has to stay a healthy, sustainable business to keep this promise for the long run.
            </p>
          </FadeIn>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FadeIn delay={0.18}>
              <div className="h-full rounded-3xl border border-navy-900/8 bg-white p-8 shadow-[0_1px_2px_rgba(13,27,46,0.04)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <PiggyBank size={20} strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-navy-900">Mission Fund — 50%</h3>
                <ul className="mt-3 space-y-2">
                  {[
                    "Classroom grants",
                    "School supplies",
                    "Free curriculum",
                    "New software",
                    "Teacher & student scholarships",
                    "Underfunded schools",
                    "Educational research",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-navy-700/80">
                      <CircleCheck size={14} className="mt-0.5 shrink-0 text-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={0.24}>
              <div className="h-full rounded-3xl border border-navy-900/8 bg-white p-8 shadow-[0_1px_2px_rgba(13,27,46,0.04)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <TrendingUp size={20} strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-navy-900">Company Growth — 50%</h3>
                <ul className="mt-3 space-y-2">
                  {[
                    "Hiring developers",
                    "Paying salaries",
                    "New products",
                    "Marketing",
                    "Warehousing",
                    "Better customer support",
                    "Cash reserves",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-navy-700/80">
                      <CircleCheck size={14} className="mt-0.5 shrink-0 text-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-amber-600">
              The Public Promise
            </p>
            <div className="relative mt-8 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-teal-50 p-10 text-center shadow-[0_20px_50px_-20px_rgba(217,119,6,0.15)]">
              <Quote size={24} className="mx-auto text-amber-500" />
              <p className="mt-6 font-display text-2xl font-medium leading-snug text-navy-900 sm:text-3xl">
                &ldquo;At least 50% of Sinon Learning&rsquo;s annual net profits are reinvested directly into
                improving education.&rdquo;
              </p>
              <p className="mt-5 text-sm text-navy-700/60">
                We won&rsquo;t advertise &ldquo;half of every purchase is donated&rdquo; — that overpromises on a
                per-order basis. This commitment gives Sinon Learning flexibility from year to year while still
                making a meaningful, verifiable promise.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-cream-100 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-amber-600">
              What&rsquo;s next
            </p>
            <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400" />
            <h2 className="mt-6 text-center font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
              The Transparency Page we&rsquo;re building toward.
            </h2>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-5">
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-700">
                <Clock size={12} />
                Planned — not live yet
              </span>
              <p className="text-sm leading-relaxed text-navy-700/80">
                This could become one of the coolest pages on the site — but it doesn&rsquo;t exist yet. Here&rsquo;s
                the plan.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.14}>
            <p className="mx-auto mt-8 max-w-2xl text-center leading-relaxed text-navy-700/80">
              Each year, this page would show exactly where the money went: revenue, expenses, payroll, and the
              split between the Mission Fund and the Growth Fund.
            </p>
            <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
              {["Revenue", "Operating Expenses", "Payroll", "Mission Fund", "Growth Fund"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-navy-900/10 bg-white px-3 py-1 text-xs text-navy-700/70"
                >
                  {item}
                </span>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-center leading-relaxed text-navy-700/80">
              Alongside the numbers, an Impact section would track what that money actually did.
            </p>
            <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
              {[
                "Teachers Helped",
                "Students Helped",
                "Schools Supported",
                "Classroom Grants Awarded",
                "Apps Released",
                "Lessons Created",
                "Hours of Free Learning Delivered",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-navy-900/10 bg-white px-3 py-1 text-xs text-navy-700/70"
                >
                  {item}
                </span>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.26}>
            <p className="mx-auto mt-8 max-w-2xl text-center leading-relaxed text-navy-700/80">
              We&rsquo;d also love for every grant to get its own page — &ldquo;Mrs. Smith from Ohio received $500
              for new science lab supplies&rdquo; — so people can see exactly where their purchase went, one story
              at a time.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-amber-600">
              Long-Term Structure
            </p>
            <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400" />
            <h2 className="mt-6 text-center font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
              How it all fits together.
            </h2>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-14">
              <FrameworkTree
                root="Sinon Learning"
                branches={["Free Education", "Sinon Shop", "School Fundraising"]}
                convergeLabel="Revenue & Profit"
                splits={[
                  { label: "Mission Investment", caption: "Free apps • Grants • Tools" },
                  { label: "Company Growth", caption: "Employees • New products • Expansion" },
                ]}
              />
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-cream-100 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-amber-600">
              The Vision
            </p>
            <h2 className="mt-4 text-center font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
              A self-funding education ecosystem.
            </h2>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div className="mt-10">
              <RoadmapCard
                variant="numbered"
                steps={[
                  "Discover a free AP World lesson on Sinon",
                  "Use KORA to build a quiz",
                  "Buy a classroom gadget from Sinon Shop",
                  "Run a Sinon fundraiser for their school",
                  "Receive a classroom grant from Sinon the following year",
                  "Tell other teachers about it",
                ]}
              />
            </div>
          </FadeIn>

          <div className="mt-12 space-y-6 text-center">
            <FadeIn delay={0.16}>
              <p className="font-display text-2xl font-medium leading-snug text-navy-900 sm:text-3xl">
                &ldquo;Each piece reinforces the others.&rdquo;
              </p>
            </FadeIn>
            <FadeIn delay={0.22}>
              <p className="font-display text-2xl font-medium leading-snug text-navy-900 sm:text-3xl">
                &ldquo;This isn&rsquo;t just a store — it&rsquo;s a self-funding education ecosystem.&rdquo;
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-amber-600">
              Looking ahead
            </p>
          </FadeIn>
          <FadeIn delay={0.06}>
            <div className="mt-6 space-y-5 leading-relaxed text-navy-700/85">
              <p>
                One refinement we plan to make over time: separating the mission commitment from the business
                entity itself. That could mean a formal company policy, and later, a charitable foundation that
                receives the committed share of Sinon Learning&rsquo;s annual profits.
              </p>
              <p>
                That structure makes the promise easier to verify and maintain as the company grows — while Sinon
                Learning stays a healthy, profitable business that pays its employees, invests in new products, and
                keeps expanding.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <RelatedResources
            title="Keep exploring"
            links={[
              { label: "Mission", href: "/mission" },
              { label: "KORA Constitution", href: "/mission/kora-constitution" },
              { label: "Curriculum", href: "/curriculum" },
            ]}
          />
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <Link
              href="/shop-fundraisers"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-amber-400"
            >
              Back to Shop & Fundraisers
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
