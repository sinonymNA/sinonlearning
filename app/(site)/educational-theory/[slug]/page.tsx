import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import MarkdownContent from "@/components/blog/MarkdownContent";
import PostAdminActions from "@/components/blog/PostAdminActions";
import { getPostBySlug } from "@/lib/blog";
import { isAdminRequest } from "@/lib/adminAuth";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const url = `${SITE_URL}/educational-theory/${post.slug}`;
  return {
    title: `${post.title} — Sinon Learning`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const admin = await isAdminRequest();

  if (!post || (!post.published && !admin)) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: "Sinon Learning" },
    image: post.cover_image_url ?? undefined,
    mainEntityOfPage: `${SITE_URL}/educational-theory/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="bg-grain relative overflow-hidden px-6 pt-16 pb-12 lg:px-8 lg:pt-24">
        <div className="absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-teal-400/15 blur-[110px]" />
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <Link
              href="/educational-theory"
              className="group inline-flex items-center gap-2 text-sm font-medium text-navy-700/60 transition-colors hover:text-teal-700"
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              Educational Theory
            </Link>
          </FadeIn>
          <FadeIn delay={0.05}>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-navy-700/50">
              <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
              {!post.published && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-700">
                  Draft — only visible to admin
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
              {post.title}
            </h1>
            {admin && (
              <div className="mt-5">
                <PostAdminActions post={post} />
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      {post.cover_image_url && (
        <div className="px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="aspect-[16/9] w-full rounded-3xl object-cover"
            />
          </div>
        </div>
      )}

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <MarkdownContent content={post.content} />
          </FadeIn>
        </div>
      </section>
    </>
  );
}
