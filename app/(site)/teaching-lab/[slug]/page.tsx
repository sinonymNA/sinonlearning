import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import ComingSoonBadge from "@/components/ComingSoonBadge";
import { getTeachingLabTopicBySlug } from "@/data/teachingLab";
import { SITE_URL } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getTeachingLabTopicBySlug(slug);
  if (!entry) return {};

  return {
    title: `${entry.title} — Sinon Learning`,
    description: entry.description,
    alternates: { canonical: `${SITE_URL}/teaching-lab/${entry.slug}` },
  };
}

export default async function TeachingLabTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getTeachingLabTopicBySlug(slug);
  if (!entry) notFound();

  return (
    <div className="bg-cream-50">
      <section className="bg-grain relative overflow-hidden px-6 pt-16 pb-16 lg:px-8 lg:pt-24">
        <div className="absolute left-1/3 top-0 -z-10 h-96 w-96 -translate-y-1/3 rounded-full bg-teal-400/15 blur-[120px]" />
        <div className="absolute -right-20 top-40 -z-10 h-72 w-72 rounded-full bg-amber-400/10 blur-[110px]" />

        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <Link
              href="/teaching-lab"
              className="group inline-flex items-center gap-2 text-sm font-medium text-navy-700/60 transition-colors hover:text-teal-700"
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              All Teaching Lab Topics
            </Link>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="mt-6">
              <ComingSoonBadge />
            </div>
            <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
              {entry.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-700/80">
              {entry.description}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <div className="rounded-3xl border border-dashed border-navy-900/15 bg-white/60 px-6 py-12 text-center">
              <p className="text-navy-700/60">
                {entry.title} is still in development. {entry.tagline}
              </p>
              <Link
                href="/teaching-lab"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-400"
              >
                Back to Teaching Lab
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
