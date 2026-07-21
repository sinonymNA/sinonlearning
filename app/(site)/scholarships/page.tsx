import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";
import PageHero from "@/components/PageHero";
import FadeIn from "@/components/FadeIn";
import ProfileWizard from "@/components/scholarships/ProfileWizard";
import { Search, Trophy, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "Scholarship Finder — Sinon Learning",
  description:
    "Find local and niche scholarships where 10–50 people apply, not 10,000. We show you Win Probability so you can focus on the ones you'll actually get.",
  alternates: { canonical: `${SITE_URL}/scholarships` },
};

const HOW_IT_WORKS = [
  {
    icon: <Search size={22} />,
    title: "We filter for low competition",
    body: "Every scholarship in our database has an estimated applicant count. We surface local community awards, heritage club scholarships, and niche criteria programs — places where a dozen people apply.",
  },
  {
    icon: <Target size={22} />,
    title: "You tell us about yourself",
    body: "State, grade, heritage, major, activities — the more you tell us, the better we match. Heritage scholarships in particular are hidden gems: a qualifying pool of 20 vs. 20,000.",
  },
  {
    icon: <Trophy size={22} />,
    title: "We show Win Probability",
    body: "Every result card shows a green, teal, amber, or slate badge — Very High to Low odds based on our estimate of how many people apply. Sort by odds, not just dollar amount.",
  },
];

export default function ScholarshipsPage() {
  return (
    <>
      <PageHero
        eyebrow="Free Scholarship Finder"
        title="Find Scholarships You'll Actually Win"
        description="We skip the 50,000-applicant national pools and find the local and niche ones where your odds are actually good."
        align="center"
      />

      {/* Stats bar */}
      <FadeIn>
        <div className="border-b border-navy-900/6 bg-white">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-6 py-4 text-sm text-navy-800/60">
            <span className="font-semibold text-navy-900">100+ curated scholarships</span>
            <span>·</span>
            <span>Win probability scoring</span>
            <span>·</span>
            <span>No account required</span>
          </div>
        </div>
      </FadeIn>

      {/* Wizard section */}
      <section className="bg-cream-50 px-6 py-16 lg:py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-8">
          <FadeIn>
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold text-navy-900 lg:text-3xl">
                Tell us about yourself
              </h2>
              <p className="mt-2 text-navy-800/60">
                Takes about 2 minutes. No email required.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <ProfileWizard />
          </FadeIn>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <h2 className="mb-10 text-center font-display text-2xl font-semibold text-navy-900">
              How it works
            </h2>
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <div className="flex flex-col gap-3 rounded-2xl border border-navy-900/8 bg-cream-50 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-navy-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-navy-800/65">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
