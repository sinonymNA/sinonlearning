import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import TextbookFlipBook from "@/components/textbooks/TextbookFlipBook";
import { getTextbookBySlug, getTextbookPages } from "@/lib/textbooks";
import { isAdminRequest } from "@/lib/adminAuth";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const textbook = await getTextbookBySlug(slug);
  if (!textbook) return {};

  const url = `${SITE_URL}/textbooks/${textbook.slug}`;
  return {
    title: `${textbook.title} — Sinon Learning`,
    description: `Flip through "${textbook.title}" page by page, right in the browser.`,
    alternates: { canonical: url },
  };
}

export default async function TextbookReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const textbook = await getTextbookBySlug(slug);
  const admin = await isAdminRequest();

  if (!textbook || (!textbook.published && !admin)) notFound();

  const pages = await getTextbookPages(textbook.id);

  return (
    <>
      <section className="bg-grain relative overflow-hidden px-6 pt-16 pb-12 lg:px-8 lg:pt-24">
        <div className="absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-teal-400/15 blur-[110px]" />
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <Link
              href="/textbooks"
              className="group inline-flex items-center gap-2 text-sm font-medium text-navy-700/60 transition-colors hover:text-teal-700"
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              Textbooks
            </Link>
          </FadeIn>
          <FadeIn delay={0.05}>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-navy-700/50">
              {textbook.subject && (
                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 font-medium text-teal-700">
                  {textbook.subject}
                </span>
              )}
              {!textbook.published && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-700">
                  Draft — only visible to admin
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
              {textbook.title}
            </h1>
            {admin && (
              <div className="mt-5">
                <Link
                  href={`/textbooks/${textbook.slug}/edit`}
                  className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-600"
                >
                  Edit this textbook &rarr;
                </Link>
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <TextbookFlipBook pages={pages} />
          </FadeIn>
        </div>
      </section>
    </>
  );
}
