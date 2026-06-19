import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import PhotoSlot from "@/components/PhotoSlot";
import BlogAdminBar from "@/components/blog/BlogAdminBar";
import PostAdminActions from "@/components/blog/PostAdminActions";
import { getPublishedPosts, getAllPostsForAdmin } from "@/lib/blog";
import { isAdminRequest } from "@/lib/adminAuth";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Educational Theory — Sinon Learning",
  description:
    "Essays and research-backed ideas on how students actually learn, written for teachers and curious parents.",
  alternates: { canonical: `${SITE_URL}/educational-theory` },
  openGraph: {
    title: "Educational Theory — Sinon Learning",
    description:
      "Essays and research-backed ideas on how students actually learn, written for teachers and curious parents.",
    url: `${SITE_URL}/educational-theory`,
    type: "website",
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function EducationalTheoryPage() {
  const admin = await isAdminRequest();
  const posts = admin ? await getAllPostsForAdmin() : await getPublishedPosts();

  return (
    <>
      <section className="bg-grain relative overflow-hidden px-6 pt-16 pb-12 lg:px-8 lg:pt-24">
        <div className="absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-teal-400/15 blur-[110px]" />
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="text-center lg:text-left">
              <h1 className="font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
                Educational Theory
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-700/80 lg:mx-0">
                Essays on how students actually learn — the research and reasoning behind the
                way we build curriculum and tools.
              </p>
            </div>
            <div className="hidden lg:block">
              <PhotoSlot
                variant="teal"
                icon={BookOpen}
                alt="An open notebook with handwritten notes"
                className="aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <BlogAdminBar />
          </div>

          {posts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-navy-900/15 px-6 py-12 text-center text-sm text-navy-700/50">
              No posts yet — check back soon.
            </p>
          ) : (
            <div className="space-y-6">
              {posts.map((post, i) => (
                <FadeIn key={post.id} delay={(i % 4) * 0.06}>
                  <article className="rounded-3xl border border-navy-900/8 bg-white p-7 shadow-[0_1px_2px_rgba(13,27,46,0.04)]">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-navy-700/50">
                      <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                      {!post.published && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-700">
                          Draft
                        </span>
                      )}
                    </div>
                    <Link href={`/educational-theory/${post.slug}`} className="group">
                      <h2 className="mt-2 font-display text-2xl font-medium text-navy-900 transition-colors group-hover:text-teal-700">
                        {post.title}
                      </h2>
                    </Link>
                    <p className="mt-3 leading-relaxed text-navy-700/75">{post.excerpt}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <Link
                        href={`/educational-theory/${post.slug}`}
                        className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-600"
                      >
                        Read more &rarr;
                      </Link>
                      {admin && <PostAdminActions post={post} />}
                    </div>
                  </article>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
