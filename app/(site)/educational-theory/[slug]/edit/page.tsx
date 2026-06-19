import { notFound, redirect } from "next/navigation";
import FadeIn from "@/components/FadeIn";
import PostForm from "@/components/blog/PostForm";
import { getPostBySlug } from "@/lib/blog";
import { isAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await isAdminRequest())) redirect("/educational-theory");

  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <h1 className="font-display text-3xl font-medium text-navy-900">Edit post</h1>
          <div className="mt-8">
            <PostForm mode="edit" initialPost={post} />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
