import { redirect } from "next/navigation";
import FadeIn from "@/components/FadeIn";
import PostForm from "@/components/blog/PostForm";
import { isAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  if (!(await isAdminRequest())) redirect("/educational-theory");

  return (
    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <h1 className="font-display text-3xl font-medium text-navy-900">New post</h1>
          <div className="mt-8">
            <PostForm mode="create" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
