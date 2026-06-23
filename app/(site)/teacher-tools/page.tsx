import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import FeatureCard from "@/components/FeatureCard";
import RelatedResources from "@/components/RelatedResources";
import FadeIn from "@/components/FadeIn";
import SectionHeader from "@/components/SectionHeader";
import ClassroomScreenMockup from "@/components/ClassroomScreenMockup";
import { teacherTools } from "@/data/teacherTools";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Teacher Tools — Sinon Learning",
  description:
    "Everything a teacher needs to plan, run, and assess a classroom—simulations, classroom tools, and a growing set of AI-assisted tools built to support teaching, not replace it.",
  alternates: { canonical: `${SITE_URL}/teacher-tools` },
};

export default function TeacherToolsPage() {
  return (
    <div className="bg-cream-50">
      <PageHero
        eyebrow="For Teachers"
        title="Tools built for how teachers actually work."
        description="From live classroom simulators to a future AI workspace, Teacher Tools is where Sinon Learning's classroom-facing tools live—built to support teaching, never to replace it."
      />

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teacherTools.map((tool) => (
              <FadeIn key={tool.slug}>
                <FeatureCard
                  item={{
                    title: tool.title,
                    description: tool.description,
                    status: tool.status,
                    href: `/teacher-tools/${tool.slug}`,
                  }}
                />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream-100 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <FadeIn>
              <SectionHeader
                align="left"
                eyebrow="Available Now"
                title="Classboard runs the room while you teach."
                subtitle="Agendas, timers, group randomizers, and quick polls—all in one screen built for the front of a real classroom."
              />
              <Link
                href="/tools"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-400"
              >
                Explore Classroom Tools
                <ArrowRight size={14} />
              </Link>
            </FadeIn>
            <FadeIn delay={0.1}>
              <ClassroomScreenMockup />
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <RelatedResources
            title="Keep exploring"
            links={[
              { label: "Curriculum", href: "/curriculum" },
              { label: "Teaching Lab", href: "/teaching-lab" },
              { label: "Classboard", href: "/classboard" },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
