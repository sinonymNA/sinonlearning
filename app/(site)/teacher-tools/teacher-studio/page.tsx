import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import FeatureCard from "@/components/FeatureCard";
import RelatedResources from "@/components/RelatedResources";
import FadeIn from "@/components/FadeIn";
import { SITE_URL } from "@/lib/seo";
import {
  ArrowRight,
  ImageIcon,
  Sparkles,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Teacher Studio — Sinon Learning",
  description:
    "A free workspace where teachers build slides, worksheets, lessons, and assessments — fully editable, exportable, and stored on your device.",
  alternates: { canonical: `${SITE_URL}/teacher-tools/teacher-studio` },
};

const howItWorks = [
  {
    title: "Paste your lesson content",
    description:
      "Drop in the notes, outline, or text you already have — or start from a sample lesson to see how it works first.",
  },
  {
    title: "Choose a classroom template",
    description:
      "Pick a layout like APWH Anchored Notes or Clean Printable Notes, add image links if you want them, and structure your content into an editable outline.",
  },
  {
    title: "Generate your Google material",
    description:
      "Send it straight into a real, editable Google Doc — or copy, download, and print it fully offline. We are not replacing Google Docs or Slides; Teacher Studio is the formatter, structurer, and generator.",
  },
];

const futureFeatures = [
  {
    title: "Full Google Slides Generation",
    description: "Beyond the basic outline export, a fully templated Slides deck generator is on the way.",
    icon: Sparkles,
  },
  {
    title: "Answer Key & Teacher Guide Docs",
    description: "Generate a separate teacher-only answer key or pacing/teacher-guide document alongside the handout.",
    icon: ArrowRight,
  },
  {
    title: "Image Upload",
    description: "Upload your own images instead of pasting direct links to existing ones.",
    icon: ImageIcon,
  },
  {
    title: "Collaboration",
    description: "Share a project with a co-teacher or department and edit it together.",
    icon: Users,
  },
];

export default function TeacherStudioPage() {
  return (
    <div className="bg-cream-50">
      <PageHero
        eyebrow="Available Now"
        backHref="/teacher-tools"
        backLabel="All Teacher Tools"
        title="Turn lesson content into polished Google Docs and Slides."
        description="Paste your notes, choose a classroom template, add images if you want, and Teacher Studio will format everything into editable Google materials."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/studio/anchored-notes"
            className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-teal-400"
          >
            Create Anchored Notes
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/studio/anchored-notes"
            className="inline-flex items-center gap-2 rounded-full border border-navy-900/15 bg-white px-5 py-2.5 text-sm font-medium text-navy-800 transition-colors hover:border-teal-400/50 hover:bg-teal-50"
          >
            Create Slides
          </Link>
          <Link
            href="/studio/anchored-notes?sample=1"
            className="inline-flex items-center gap-2 rounded-full border border-navy-900/15 bg-white px-5 py-2.5 text-sm font-medium text-navy-800 transition-colors hover:border-teal-400/50 hover:bg-teal-50"
          >
            <Sparkles size={14} />
            Try a Sample
          </Link>
        </div>
      </PageHero>

      <section className="px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-[0_1px_2px_rgba(13,27,46,0.04)] sm:p-10">
              <p className="text-lg leading-relaxed text-navy-700/85">
                We are not replacing Google Docs or Google Slides &mdash; you&rsquo;ll still edit, share, and
                grade in the tools you already know. Teacher Studio is the formatter, structurer, and
                generator: it takes the content you&rsquo;ve already written and turns it into a polished,
                ready-to-teach Google Doc, with the dirty formatting work done for you.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
              How it works
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {howItWorks.map((step, i) => (
              <FadeIn key={step.title} delay={i * 0.05}>
                <div className="h-full rounded-3xl border border-navy-900/8 bg-white p-7">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-display text-lg text-navy-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-700/75">{step.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
              What&rsquo;s next
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
