import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import { getMissionTopicBySlug } from "@/data/missionTopics";
import { SITE_URL } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getMissionTopicBySlug(slug);
  if (!entry) return {};

  return {
    title: `${entry.title} — Sinon Learning`,
    description: entry.description,
    alternates: { canonical: `${SITE_URL}/mission/${entry.slug}` },
  };
}

export default async function MissionTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getMissionTopicBySlug(slug);
  if (!entry) notFound();

  const isConstitution = entry.slug === "kora-constitution";

  return (
    <div className="bg-cream-50">
      <section className="bg-grain relative overflow-hidden px-6 pt-16 pb-16 lg:px-8 lg:pt-24">
        <div className="absolute left-1/3 top-0 -z-10 h-96 w-96 -translate-y-1/3 rounded-full bg-teal-400/15 blur-[120px]" />
        <div className="absolute -right-20 top-40 -z-10 h-72 w-72 rounded-full bg-amber-400/10 blur-[110px]" />

        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <Link
              href="/mission"
              className="group inline-flex items-center gap-2 text-sm font-medium text-navy-700/60 transition-colors hover:text-teal-700"
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              Mission
            </Link>
          </FadeIn>

          <FadeIn delay={0.05}>
            <h1 className="mt-6 font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
              {entry.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-700/80">
              {entry.tagline}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {isConstitution ? (
            <ol className="space-y-4">
              {entry.body.map((principle, index) => {
                const text = principle.replace(/^\d+\.\s*/, "");
                return (
                  <FadeIn key={principle} delay={index * 0.04}>
                    <li className="flex gap-4 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(13,27,46,0.04)]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/15 font-mono text-sm font-semibold text-teal-700">
                        {index + 1}
                      </span>
                      <p className="leading-relaxed text-navy-800">{text}</p>
                    </li>
                  </FadeIn>
                );
              })}
            </ol>
          ) : (
            <div className="space-y-6">
              {entry.body.map((paragraph, index) => (
                <FadeIn key={index} delay={index * 0.05}>
                  <p className="leading-relaxed text-navy-700/85">{paragraph}</p>
                </FadeIn>
              ))}
            </div>
          )}

          <FadeIn delay={0.1}>
            <Link
              href="/mission"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-400"
            >
              Back to Mission
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
