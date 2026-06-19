import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import FadeIn from "@/components/FadeIn";
import CourseMaterialsSection from "@/components/materials/CourseMaterialsSection";
import { getCourseBySlug } from "@/data/courses";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  return (
    <>
      <section className="bg-grain relative overflow-hidden px-6 pt-16 pb-12 lg:px-8 lg:pt-24">
        <div className="absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-teal-400/15 blur-[110px]" />
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <Button href="/curriculum" variant="secondary" size="sm">
              <ArrowLeft size={14} />
              All Courses
            </Button>
          </FadeIn>
          <FadeIn delay={0.05}>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
                {course.name}
              </h1>
              <Badge>{course.status}</Badge>
            </div>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-700/80">
              {course.description}
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-6 flex flex-wrap gap-2">
              {course.includes.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-navy-900/10 bg-white px-4 py-1.5 text-sm font-medium text-navy-800"
                >
                  {item}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <CourseMaterialsSection courseSlug={course.slug} />
          </FadeIn>
        </div>
      </section>
    </>
  );
}
