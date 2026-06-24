import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import FeatureCard from "@/components/FeatureCard";
import RelatedResources from "@/components/RelatedResources";
import FadeIn from "@/components/FadeIn";
import { SITE_URL } from "@/lib/seo";
import {
  ArrowRight,
  FileText,
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
    title: "Start your way",
    description:
      "Build from a blank document, pick from 36 templates, or answer a few quick questions with Comet to get a full first draft.",
  },
  {
    title: "Edit everything, ask Comet for help",
    description:
      "Every slide, question, and instruction is yours to rewrite. Use instant local quick actions, or ask Comet to make a live AI edit — you always review and approve before it's applied.",
  },
  {
    title: "Export when ready",
    description:
      "Copy as text, download Markdown or JSON, or print straight to PDF. No account, no upload — it stays on your device.",
  },
];

const futureFeatures = [
  {
    title: "Google Docs & Slides Export",
    description: "Send a finished project straight into a teacher's Google Drive.",
    icon: FileText,
  },
  {
    title: "Image Upload",
    description: "Upload your own images instead of working from placeholders.",
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
        title="Teacher Studio"
        description="A free workspace for building slides, worksheets, lessons, and assessments — fully editable, exportable, and yours to keep. No account, no AI black box, no dirty work."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-teal-400"
          >
            Open Teacher Studio
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/studio/templates"
            className="inline-flex items-center gap-2 rounded-full border border-navy-900/15 bg-white px-5 py-2.5 text-sm font-medium text-navy-800 transition-colors hover:border-teal-400/50 hover:bg-teal-50"
          >
            Browse Templates
          </Link>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-full border border-navy-900/15 bg-white px-5 py-2.5 text-sm font-medium text-navy-800 transition-colors hover:border-teal-400/50 hover:bg-teal-50"
          >
            <Sparkles size={14} />
            Try Teach This Tomorrow
          </Link>
        </div>
      </PageHero>

      <section className="px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="rounded-3xl border border-navy-900/8 bg-white p-8 shadow-[0_1px_2px_rgba(13,27,46,0.04)] sm:p-10">
              <p className="text-lg leading-relaxed text-navy-700/85">
                Teacher Studio is not built to replace a teacher&rsquo;s planning &mdash; it&rsquo;s built to remove
                the dirty work around it. Everything it produces is editable from the first second, runs
                fully on your device, and never asks for an account. The decisions about what a classroom
                needs stay with the teacher, every time.
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
