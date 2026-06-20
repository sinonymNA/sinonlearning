import { redirect } from "next/navigation";
import FadeIn from "@/components/FadeIn";
import TextbookForm from "@/components/textbooks/TextbookForm";
import { isAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function NewTextbookPage() {
  if (!(await isAdminRequest())) redirect("/textbooks");

  return (
    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <h1 className="font-display text-3xl font-medium text-navy-900">New textbook</h1>
          <div className="mt-8">
            <TextbookForm mode="create" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
