import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock3, Sparkles } from "lucide-react";
import Link from "next/link";
import CourseMaterialsSection from "@/components/materials/CourseMaterialsSection";
import CurriculumArtwork from "@/components/curriculum/CurriculumArtwork";
import CurriculumSignup from "@/components/curriculum/CurriculumSignup";
import FadeIn from "@/components/FadeIn";
import { courses, getCourseBySlug } from "@/data/courses";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) return {};
  return { title: `${course.name} | Sinon Learning Curriculum`, description: `${course.description} Preview the teaching vision, planned resources, and classroom experience.` };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course || course.slug === "everyday-economics") notFound();
  const style = { "--course-ink": course.visual.ink, "--course-accent": course.visual.accent, "--course-soft": course.visual.soft } as CSSProperties;

  return (
    <div style={style} className="overflow-hidden bg-cream-50">
      <section className="relative overflow-hidden bg-[var(--course-soft)] px-6 py-14 lg:px-8 lg:py-24">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,var(--course-ink)_1px,transparent_0)] [background-size:26px_26px]" />
        <div className="relative mx-auto max-w-7xl">
          <FadeIn><Link href="/curriculum" className="inline-flex items-center gap-2 rounded-full border border-[var(--course-ink)]/15 bg-white/65 px-4 py-2 text-sm font-semibold text-[var(--course-ink)] backdrop-blur-sm transition hover:bg-white"><ArrowLeft size={15} /> All curriculum</Link></FadeIn>
          <div className="mt-10 grid items-center gap-12 lg:grid-cols-[.92fr_1.08fr]">
            <FadeIn delay={0.05}>
              <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--course-ink)]/70">{course.eyebrow}</span><span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--course-ink)]/12 bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--course-ink)]"><Clock3 size={12} /> {course.status}</span></div>
              <h1 className="mt-5 max-w-2xl font-display text-5xl font-medium leading-[1.02] tracking-[-0.03em] text-[var(--course-ink)] sm:text-6xl lg:text-7xl">{course.name}</h1>
              <p className="mt-6 max-w-xl font-display text-2xl italic leading-snug text-[var(--course-ink)]/80">“{course.essentialQuestion}”</p>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--course-ink)]/70">{course.description}</p>
            </FadeIn>
            <FadeIn delay={0.12}><CurriculumArtwork course={course} hero className="aspect-[5/4] shadow-[0_35px_90px_rgba(13,27,46,.2)]" /></FadeIn>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <FadeIn><p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--course-accent)]">The teaching promise</p><h2 className="mt-4 font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">A course built to make the subject feel consequential.</h2><p className="mt-6 text-lg leading-relaxed text-navy-700/75">{course.teachingPromise}</p></FadeIn>
          <div className="space-y-3">{course.previewThemes.map((theme, index) => <FadeIn key={theme} delay={index * 0.07}><div className="flex items-center gap-4 rounded-2xl border border-navy-900/8 bg-white p-5 shadow-[0_12px_35px_rgba(13,27,46,.05)]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--course-soft)] font-mono text-xs font-bold text-[var(--course-ink)]">0{index + 1}</span><p className="font-display text-xl text-navy-900">{theme}</p></div></FadeIn>)}</div>
        </div>
      </section>

      <section className="bg-navy-950 px-6 py-20 text-white lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl"><FadeIn><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">Planned course experience</p><h2 className="mt-4 font-display text-4xl font-medium sm:text-5xl">Everything should work together when the bell rings.</h2></div></FadeIn><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{course.includes.map((item, index) => <FadeIn key={item} delay={index * 0.06}><div className="flex min-h-28 items-start gap-3 rounded-2xl border border-white/10 bg-white/6 p-5"><Check size={17} className="mt-1 shrink-0 text-teal-300" strokeWidth={3} /><div><p className="font-semibold">{item}</p><p className="mt-2 text-sm leading-relaxed text-white/55">Designed as part of one coherent course—not an isolated download.</p></div></div></FadeIn>)}</div></div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><CourseMaterialsSection courseSlug={course.slug} emptyMessage={`No ${course.name} materials are public yet. This page will grow as the course moves from vision to classroom.`} /></div></section>

      <section className="bg-[var(--course-soft)] px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_.8fr]">
          <div><Sparkles className="text-[var(--course-accent)]" /><h2 className="mt-5 font-display text-4xl font-medium text-[var(--course-ink)]">Follow this course as it takes shape.</h2><p className="mt-4 max-w-xl leading-relaxed text-[var(--course-ink)]/70">The vision is public before the course is finished because great curriculum should grow in conversation with real teachers.</p><Link href="/curriculum/everyday-economics" className="group mt-7 inline-flex items-center gap-2 font-semibold text-[var(--course-ink)]">Explore the flagship course now <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div>
          <CurriculumSignup source={`curriculum_${course.slug}`} />
        </div>
      </section>

      <nav className="border-t border-navy-900/8 bg-white px-6 py-8 lg:px-8" aria-label="More curriculum"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4"><Link href="/curriculum" className="inline-flex items-center gap-2 text-sm font-semibold text-navy-700"><ArrowLeft size={15} /> All curriculum</Link><div className="flex flex-wrap gap-4">{courses.filter((item) => item.slug !== course.slug).slice(0, 3).map((item) => <Link key={item.slug} href={`/curriculum/${item.slug}`} className="text-sm font-semibold text-teal-700 hover:text-teal-800">{item.name}</Link>)}</div></div></nav>
    </div>
  );
}
