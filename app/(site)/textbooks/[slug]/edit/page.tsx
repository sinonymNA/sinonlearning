import { notFound, redirect } from "next/navigation";
import FadeIn from "@/components/FadeIn";
import TextbookForm from "@/components/textbooks/TextbookForm";
import TextbookPageEditor from "@/components/textbooks/TextbookPageEditor";
import { getTextbookBySlug, getTextbookPages } from "@/lib/textbooks";
import { isAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function EditTextbookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await isAdminRequest())) redirect("/textbooks");

  const { slug } = await params;
  const textbook = await getTextbookBySlug(slug);
  if (!textbook) notFound();

  const pages = await getTextbookPages(textbook.id);

  return (
    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <h1 className="font-display text-3xl font-medium text-navy-900">Edit textbook</h1>
          <div className="mt-8">
            <TextbookForm mode="edit" initialTextbook={textbook} />
          </div>
        </FadeIn>
      </div>

      <div className="mx-auto mt-12 max-w-5xl">
        <FadeIn delay={0.05}>
          <h2 className="font-display text-2xl font-medium text-navy-900">Pages</h2>
          <div className="mt-6">
            <TextbookPageEditor textbook={textbook} pages={pages} />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
