import type { Metadata } from "next";
import { Search, Lightbulb, GraduationCap, ClipboardCheck } from "lucide-react";
import PageHero from "@/components/PageHero";
import FeatureCard from "@/components/FeatureCard";
import ResearchFlow from "@/components/ResearchFlow";
import PathwayCard from "@/components/PathwayCard";
import RelatedResources from "@/components/RelatedResources";
import FadeIn from "@/components/FadeIn";
import { researchTopics } from "@/data/research";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Research — Sinon Learning",
  description:
    "How learning science turns into something a teacher can actually use tomorrow—plus the educational theory and teacher-first AI vision behind Sinon Learning.",
  alternates: { canonical: `${SITE_URL}/research` },
};

const flowSteps = [
  {
    icon: Search,
    title: "Find the Research",
    description: "Start from real, peer-reviewed learning science, not trends.",
  },
  {
    icon: Lightbulb,
    title: "Distill the Idea",
    description: "Strip the jargon down to the actual idea and why it works.",
  },
  {
    icon: GraduationCap,
    title: "Connect to Teaching",
    description: "Tie the idea to a real classroom decision a teacher makes.",
  },
  {
    icon: ClipboardCheck,
    title: "Give a Next Step",
    description: "End with something a teacher can try tomorrow, honestly framed.",
  },
];

const nonKoraTopics = researchTopics.filter((topic) => topic.slug !== "kora-model");

export default function ResearchPage() {
  return (
    <div className="bg-navy-950">
      <PageHero
        theme="dark"
        align="center"
        eyebrow="Research"
        title="From research to something you can teach tomorrow."
        description="Sinon Learning's research work connects real learning science to real classroom practice—and lays out the thinking behind a teacher-first approach to AI."
      />

      <section className="px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <ResearchFlow steps={flowSteps} />
          </FadeIn>
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nonKoraTopics.map((topic) => (
              <FadeIn key={topic.slug}>
                <FeatureCard
                  theme="dark"
                  item={{
                    title: topic.title,
                    description: topic.description,
                    status: topic.status,
                    href: topic.externalHref ?? `/research/${topic.slug}`,
                  }}
                />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <PathwayCard
              theme="dark"
              href="/research/kora-model"
              title="KORA Model"
              description="Teachers think. KORA builds. Sinon Learning's full teacher-first AI vision—what it is, what it isn't, and how it's built to stay accountable to teachers."
              cta="Meet KORA"
            />
          </FadeIn>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <RelatedResources
            theme="dark"
            title="Keep exploring"
            links={[
              { label: "KORA Model", href: "/research/kora-model" },
              { label: "Educational Theory", href: "/educational-theory" },
              { label: "KORA Constitution", href: "/mission/kora-constitution" },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
