import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Target, Hourglass, Users } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import CourseSyllabus from "@/components/ai/CourseSyllabus";
import CourseProgressBar from "@/components/ai/CourseProgressBar";
import { getAICourseBySlug } from "@/data/aiCourses";

export default async function AICoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getAICourseBySlug(slug);
  if (!course) notFound();

  return (
    <div className="bg-navy-950">
      <section className="bg-circuit relative overflow-hidden px-6 pt-16 pb-16 lg:px-8 lg:pt-24">
        <div className="absolute left-1/3 top-0 -z-10 h-96 w-96 -translate-y-1/3 rounded-full bg-teal-400/15 blur-[120px]" />
        <div className="absolute -right-20 top-40 -z-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[110px]" />

        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <Link
              href="/ai"
              className="group inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-teal-200"
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              All AI Courses
            </Link>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="mt-6 flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-teal-300/70">
                Flagship {String(course.number).padStart(2, "0")}
              </span>
              {course.status === "Available" && (
                <span className="flex items-center gap-1.5 rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-200">
                  <Sparkles size={11} />
                  Available Now
                </span>
              )}
            </div>
            <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-white sm:text-5xl">
              {course.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/65">
              {course.status === "Available" ? course.description : course.tagline}
            </p>
          </FadeIn>

          {course.status === "Available" && (
            <FadeIn delay={0.1}>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                  <Hourglass size={14} className="text-teal-300" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                  <Users size={14} className="text-teal-300" />
                  {course.gradeBand}
                </span>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {course.status === "Available" ? (
        <>
          <section className="px-6 py-12 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <FadeIn>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-300/80">
                  <Target size={13} />
                  By the end of this course, students can...
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {course.outcomes.map((outcome) => (
                    <div
                      key={outcome}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-white/75"
                    >
                      {outcome}
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
          </section>

          <section className="px-6 pb-24 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <FadeIn>
                <CourseProgressBar
                  courseSlug={course.slug}
                  lessonSlugs={course.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.slug))}
                />
              </FadeIn>
              <div className="mt-10">
                <CourseSyllabus course={course} />
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-white/60">
              This flagship course is still in development. It will follow the same depth and
              structure as AI Foundations once it&rsquo;s ready.
            </p>
            <Link
              href="/ai/ai-foundations"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
            >
              Start with AI Foundations
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
