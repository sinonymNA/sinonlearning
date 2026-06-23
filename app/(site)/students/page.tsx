import type { Metadata } from "next";
import { BookOpen, Sparkles, Wallet } from "lucide-react";
import PageHero from "@/components/PageHero";
import FeatureCard from "@/components/FeatureCard";
import PillarCard from "@/components/PillarCard";
import RelatedResources from "@/components/RelatedResources";
import FadeIn from "@/components/FadeIn";
import { studentResources } from "@/data/students";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Students — Sinon Learning",
  description:
    "Digital textbooks, simulations, AI literacy, and a growing set of free resources built for students, not just for the classrooms they sit in.",
  alternates: { canonical: `${SITE_URL}/students` },
};

const pillars = [
  {
    icon: BookOpen,
    title: "Free, always",
    description: "The core resources every student needs stay free—no paywall between you and the material.",
    tint: "teal" as const,
  },
  {
    icon: Sparkles,
    title: "Built to be used, not just read",
    description: "Simulations and tools let you practice ideas instead of only reading about them.",
    tint: "rose" as const,
  },
  {
    icon: Wallet,
    title: "Real-world ready",
    description: "From investing basics to AI literacy, the goal is skills you can actually use outside class.",
    tint: "amber" as const,
  },
];

export default function StudentsPage() {
  return (
    <div className="bg-cream-50">
      <PageHero
        eyebrow="For Students"
        title="Resources built for you, not just your classroom."
        description="Digital textbooks, hands-on simulations, and AI literacy resources—free to use, built to actually help you understand the material."
      />

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {studentResources.map((resource) => (
              <FadeIn key={resource.slug}>
                <FeatureCard
                  item={{
                    title: resource.title,
                    description: resource.description,
                    status: resource.status,
                    href: `/students/${resource.slug}`,
                  }}
                />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream-100 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {pillars.map((pillar) => (
              <FadeIn key={pillar.title}>
                <PillarCard {...pillar} />
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
              { label: "Digital Textbooks", href: "/textbooks" },
              { label: "Simulations & Games", href: "/simulations" },
              { label: "Study Guides", href: "/students/study-guides" },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
