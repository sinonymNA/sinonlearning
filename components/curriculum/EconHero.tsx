import { ArrowLeft, ArrowRight, BadgeCheck, FlaskConical } from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";
import FadeIn from "@/components/FadeIn";
import CurriculumArtwork from "./CurriculumArtwork";
import { corePhilosophy, courseStats } from "@/data/economicsCourse";
import { getCourseBySlug } from "@/data/courses";

export default function EconHero() {
  const course = getCourseBySlug("everyday-economics");
  if (!course) return null;

  return (
    <section className="relative overflow-hidden bg-econ-950 px-6 py-14 text-white lg:px-8 lg:py-24">
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.18)_1px,transparent_0)] [background-size:26px_26px]" />
      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-econ-500/25 blur-[120px]" />
      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-amber-400/15 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl">
        <FadeIn><Link href="/curriculum" className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white"><ArrowLeft size={15} /> All curriculum</Link></FadeIn>
        <div className="mt-10 grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <FadeIn>
              <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-bold uppercase tracking-[0.2em] text-econ-300">A semester-long inquiry course</span><span className="rounded-full border border-white/12 bg-white/7 px-3 py-1 text-xs font-semibold text-white/70">First Build</span></div>
              <h1 className="mt-6 font-display text-5xl font-medium leading-[.98] tracking-[-.035em] text-white sm:text-6xl lg:text-7xl">Everyday<br /><span className="text-amber-300">Economics</span></h1>
              <p className="mt-7 max-w-xl font-display text-2xl italic leading-snug text-white/80">“{corePhilosophy.centralQuestion}”</p>
            </FadeIn>
            <FadeIn delay={0.08}><div className="mt-9 flex flex-wrap gap-3"><Button href="#course-materials" variant="primary" className="!bg-amber-400 !text-navy-950 hover:!bg-amber-300">See course materials <ArrowRight size={15} /></Button><Button href="/simulations" variant="ghost"><FlaskConical size={15} /> Explore the labs</Button></div></FadeIn>
            <FadeIn delay={0.14}><div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/58"><span className="flex items-center gap-2"><BadgeCheck size={15} className="text-econ-300" /> {courseStats.units} connected units</span><span className="flex items-center gap-2"><BadgeCheck size={15} className="text-econ-300" /> {courseStats.scheduledDays} scheduled days</span><span className="flex items-center gap-2"><BadgeCheck size={15} className="text-econ-300" /> {courseStats.aksCoverage} AKS coverage</span></div></FadeIn>
          </div>
          <FadeIn delay={0.1}>
            <div className="relative pb-10 sm:pl-7">
              <CurriculumArtwork course={course} hero className="aspect-[5/4] ring-1 ring-white/15 shadow-[0_45px_100px_rgba(0,0,0,.4)]" />
              <div className="absolute bottom-0 left-0 max-w-sm -rotate-2 rounded-2xl border border-navy-900/8 bg-white p-5 text-navy-900 shadow-2xl sm:p-6"><p className="font-display text-xl italic leading-snug">“{corePhilosophy.quote}”</p></div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
