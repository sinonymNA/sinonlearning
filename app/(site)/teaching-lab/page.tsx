import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import FeatureCard from "@/components/FeatureCard";
import RelatedResources from "@/components/RelatedResources";
import FadeIn from "@/components/FadeIn";
import { teachingLabTopics } from "@/data/teachingLab";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Teaching Lab — Sinon Learning",
  description:
    "A growing, practical space for teacher growth—classroom practice, lesson planning, and thoughtful AI use, built around real classroom challenges.",
  alternates: { canonical: `${SITE_URL}/teaching-lab` },
};

export default function TeachingLabPage() {
  return (
    <div className="bg-cream-50">
      <PageHero
        eyebrow="For Teacher Growth"
        title="A practical space for getting better at teaching."
        description="Teaching Lab isn't a credentialing program or a teacher academy—it's a growing, practical space for the everyday work of getting better at teaching: planning, classroom practice, and using new tools well."
      />

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teachingLabTopics.map((topic) => (
              <FadeIn key={topic.slug}>
                <FeatureCard
                  item={{
                    title: topic.title,
                    description: topic.description,
                    status: topic.status,
                    href: `/teaching-lab/${topic.slug}`,
                  }}
                />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <RelatedResources
            title="Keep exploring"
            links={[
              { label: "Teacher Tools", href: "/teacher-tools" },
              { label: "Curriculum", href: "/curriculum" },
              { label: "Research", href: "/research" },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
