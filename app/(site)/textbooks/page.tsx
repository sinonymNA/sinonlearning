import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import PhotoSlot from "@/components/PhotoSlot";
import TextbookAdminBar from "@/components/textbooks/TextbookAdminBar";
import TextbookAdminActions from "@/components/textbooks/TextbookAdminActions";
import { getPublishedTextbooks, getAllTextbooksForAdmin } from "@/lib/textbooks";
import { isAdminRequest } from "@/lib/adminAuth";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Textbooks — Sinon Learning",
  description: "Browse our classroom textbooks — flip through them page by page, right in the browser.",
  alternates: { canonical: `${SITE_URL}/textbooks` },
};

export default async function TextbooksPage() {
  const admin = await isAdminRequest();
  const textbooks = admin ? await getAllTextbooksForAdmin() : await getPublishedTextbooks();

  return (
    <>
      <section className="bg-grain relative overflow-hidden px-6 pt-16 pb-12 lg:px-8 lg:pt-24">
        <div className="absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-teal-400/15 blur-[110px]" />
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="text-center lg:text-left">
              <h1 className="font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
                Textbooks
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-700/80 lg:mx-0">
                Real classroom textbooks you can flip through page by page, right in the browser.
              </p>
            </div>
            <div className="hidden lg:block">
              <PhotoSlot
                variant="teal"
                icon={BookOpen}
                alt="A stack of open textbooks"
                className="aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <TextbookAdminBar />
          </div>

          {textbooks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-navy-900/15 px-6 py-12 text-center text-sm text-navy-700/50">
              No textbooks yet — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {textbooks.map((book, i) => (
                <FadeIn key={book.id} delay={(i % 6) * 0.06}>
                  <article className="flex h-full flex-col rounded-3xl border border-navy-900/8 bg-white p-7 shadow-[0_1px_2px_rgba(13,27,46,0.04)]">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-navy-700/50">
                      {book.subject && (
                        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 font-medium text-teal-700">
                          {book.subject}
                        </span>
                      )}
                      {!book.published && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-700">
                          Draft
                        </span>
                      )}
                    </div>
                    <Link href={`/textbooks/${book.slug}`} className="group">
                      <h2 className="mt-3 font-display text-2xl font-medium text-navy-900 transition-colors group-hover:text-teal-700">
                        {book.title}
                      </h2>
                    </Link>
                    <div className="mt-5 flex flex-1 items-end justify-between">
                      <Link
                        href={`/textbooks/${book.slug}`}
                        className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-600"
                      >
                        Open book &rarr;
                      </Link>
                      {admin && <TextbookAdminActions textbook={book} />}
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
