import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import FeatureCard from "@/components/FeatureCard";
import RelatedResources from "@/components/RelatedResources";
import FadeIn from "@/components/FadeIn";
import { SITE_URL } from "@/lib/seo";
import {
  NotebookPen,
  Sparkles,
  ClipboardList,
  MessageSquareText,
  FileText,
  Wand2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Teacher Studio — Sinon Learning",
  description:
    "An upcoming AI workspace for teachers, built to remove the dirty work around teaching—not the thinking, judgment, and relationships that make teaching matter.",
  alternates: { canonical: `${SITE_URL}/teacher-tools/teacher-studio` },
};

const futureFeatures = [
  {
    title: "Lesson Drafting",
    description:
      "Start a lesson from a topic and standard, then shape it yourself—Teacher Studio drafts, you decide what stays.",
    icon: NotebookPen,
  },
  {
    title: "Slide & Activity Generation",
    description: "Turn a lesson outline into a first-pass slide deck and activity set you can edit freely.",
    icon: Sparkles,
  },
  {
    title: "Differentiation Drafts",
    description: "Generate alternate versions of an assignment for different reading levels or supports, for you to review.",
    icon: ClipboardList,
  },
  {
    title: "Feedback Assistance",
    description: "Draft first-pass feedback on student work for you to revise and personalize before it goes out.",
    icon: MessageSquareText,
  },
  {
    title: "Document Templates",
    description: "Generate a starting syllabus, rubric, or parent letter instead of starting from a blank page.",
    icon: FileText,
  },
  {
    title: "Quick Revisions",
    description: "Ask for a faster version, a harder version, or a shorter version of something you already built.",
    icon: Wand2,
  },
];

export default function TeacherStudioPage() {
  return (
    <div className="bg-cream-50">
      <PageHero
        eyebrow="Coming Soon"
        backHref="/teacher-tools"
        backLabel="All Teacher Tools"
        title="Teacher Studio"
        description="A future AI workspace built around one rule: it removes the dirty, repetitive work around teaching, not the thinking, judgment, and relationships that make teaching matter in the first place."
      />

      <section className="px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-[0_1px_2px_rgba(13,27,46,0.04)] sm:p-10">
              <p className="text-lg leading-relaxed text-navy-700/85">
                Teacher Studio is not being built to replace a teacher&rsquo;s planning—it&rsquo;s being built to remove
                the dirty work around it. Every draft it produces stays a draft until a teacher reviews it. The
                decisions about what a classroom needs stay with the teacher, every time.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
              What&rsquo;s planned
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {futureFeatures.map((feature) => (
              <FadeIn key={feature.title}>
                <FeatureCard
                  item={{
                    title: feature.title,
                    description: feature.description,
                    status: "Coming Soon",
                    icon: feature.icon,
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
              { label: "KORA Model", href: "/research/kora-model" },
              { label: "AI for Teachers", href: "/teaching-lab/ai-for-teachers" },
              { label: "Teacher-First AI", href: "/mission/teacher-first-ai" },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
