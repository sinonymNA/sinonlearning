import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import LessonVideoBlock from "@/components/ai/LessonVideoBlock";
import LessonSandbox from "@/components/ai/LessonSandbox";
import LessonActivity from "@/components/ai/LessonActivity";
import LessonProgressNav from "@/components/ai/LessonProgressNav";
import TeacherLessonPlanDetail from "@/components/ai/TeacherLessonPlanDetail";
import { getAICourseBySlug, getAILessonBySlug } from "@/data/aiCourses";

export default async function AILessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  const course = getAICourseBySlug(slug);
  if (!course || course.status !== "Available") notFound();

  const found = getAILessonBySlug(course, lessonSlug);
  if (!found) notFound();
  const { lesson, prev, next } = found;

  return (
    <div className="bg-navy-950">
      <section className="bg-circuit relative overflow-hidden px-6 pt-16 pb-12 lg:px-8 lg:pt-24">
        <div className="absolute left-1/3 top-0 -z-10 h-96 w-96 -translate-y-1/3 rounded-full bg-teal-400/15 blur-[120px]" />
        <div className="absolute -right-20 top-40 -z-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[110px]" />

        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <Link
              href={`/ai/${course.slug}`}
              className="group inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-teal-200"
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              {course.title}
            </Link>
          </FadeIn>

          <FadeIn delay={0.05}>
            <span className="mt-6 inline-block font-mono text-xs uppercase tracking-[0.2em] text-teal-300/70">
              Day {String(lesson.day).padStart(2, "0")} of 10
            </span>
            <h1 className="mt-3 font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
              {lesson.title}
            </h1>
            <p className="mt-4 text-lg italic leading-relaxed text-white/60">{lesson.essentialQuestion}</p>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-10">
          {lesson.narrative && (
            <FadeIn>
              <div className="space-y-4">
                {lesson.narrative.map((paragraph, i) => (
                  <p key={i} className="text-base leading-relaxed text-white/75">
                    {paragraph}
                  </p>
                ))}
              </div>
            </FadeIn>
          )}

          {lesson.sandbox && (
            <FadeIn delay={0.05}>
              <LessonSandbox sandbox={lesson.sandbox} />
            </FadeIn>
          )}

          {lesson.activity && (
            <FadeIn delay={0.1}>
              <LessonActivity courseSlug={course.slug} lessonSlug={lesson.slug} activity={lesson.activity} />
            </FadeIn>
          )}

          {lesson.videos && lesson.videos.length > 0 && (
            <FadeIn delay={0.12}>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                  Want to go deeper?
                </p>
                <LessonVideoBlock videos={lesson.videos} />
              </div>
            </FadeIn>
          )}

          <FadeIn delay={0.15}>
            <TeacherLessonPlanDetail lesson={lesson} />
          </FadeIn>

          <LessonProgressNav
            courseSlug={course.slug}
            lessonSlug={lesson.slug}
            prevLesson={prev}
            nextLesson={next}
          />
        </div>
      </section>
    </div>
  );
}
