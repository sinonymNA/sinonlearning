import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import Button from "@/components/Button";
import SectionHeader from "@/components/SectionHeader";
import CourseCard from "@/components/CourseCard";
import FadeIn from "@/components/FadeIn";
import PhotoSlot from "@/components/PhotoSlot";
import RelatedResources from "@/components/RelatedResources";
import { courses, courseIncludes, firstBuildRoadmap } from "@/data/courses";

export default function CurriculumPage() {
  return (
    <>
      <section className="bg-grain relative overflow-hidden px-6 pt-16 pb-12 lg:px-8 lg:pt-24">
        <div className="absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-teal-400/15 blur-[110px]" />
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="text-center lg:text-left">
              <h1 className="font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
                Everyday Curriculum
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-700/80 lg:mx-0">
                Modern, classroom-ready courses, units, textbooks, activities, and visuals
                designed to be useful, beautiful, and free at the core.
              </p>
            </div>
            <div className="hidden lg:block">
              <PhotoSlot
                variant="teal"
                icon={BookOpen}
                alt="A teacher reviewing curriculum materials"
                className="aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course family cards */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, i) => (
              <FadeIn key={course.name} delay={(i % 3) * 0.08}>
                <CourseCard course={course} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* What each course will include */}
      <section className="bg-cream-100 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <SectionHeader title="What each course will include" />
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {courseIncludes.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-navy-900/8 bg-white px-4 py-5 text-center text-sm font-medium text-navy-800"
                >
                  {item}
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.18}>
            <Link
              href="/ai"
              className="group mt-6 flex items-center justify-between gap-3 rounded-2xl border border-navy-900/8 bg-white px-6 py-5 text-sm font-medium text-navy-800 transition-colors hover:border-teal-600/30 hover:text-teal-700"
            >
              <span>
                Looking for AI Literacy? It lives under{" "}
                <span className="font-semibold">Learn About AI</span>, our dedicated AI curriculum.
              </span>
              <ArrowRight size={16} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* First build spotlight */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <SectionHeader
              eyebrow="Spotlight"
              title="Building first: Everyday Economics"
              subtitle="Economics shapes how students understand the world and manage their own lives. The first Everyday Curriculum course gives teachers a complete, classroom-ready path through it — real stories, a real semester calendar, and full state-standards coverage."
            />
          </FadeIn>

          <FadeIn delay={0.15}>
            <ol className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {firstBuildRoadmap.map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-3 rounded-2xl border border-navy-900/8 bg-white px-5 py-4 text-sm font-medium text-navy-800"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="mt-12">
              <RelatedResources
                title="Keep exploring"
                links={[
                  { label: "Teacher Apps", href: "/teachers" },
                  { label: "Students", href: "/students" },
                  { label: "Research", href: "/research" },
                ]}
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.28}>
            <div className="mt-12 flex justify-center">
              <Button href="/">
                <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
                Back to Home
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
