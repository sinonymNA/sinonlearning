"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, BadgeCheck, BookOpen, FileText, GraduationCap,
  Layers3, MessageCircleMore, PlayCircle, Presentation, Sparkles,
} from "lucide-react";
import type { Course } from "@/data/courses";
import CurriculumArtwork from "./CurriculumArtwork";

const reveal = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0 },
};

const experience = [
  { icon: PlayCircle, number: "01", title: "Start with something real", copy: "A headline, image, object, dilemma, or document is waiting when students walk in." },
  { icon: MessageCircleMore, number: "02", title: "Make the room curious", copy: "The question comes before the explanation, so students have a reason to care about the concept." },
  { icon: Presentation, number: "03", title: "Teach it beautifully", copy: "Strong visuals and clear guidance help ideas land without burying teachers in preparation." },
  { icon: GraduationCap, number: "04", title: "Send it back into life", copy: "Students use what they learned to reason about a choice, system, story, or problem they recognize." },
];

export default function CurriculumLanding({ courses, courseIncludes, roadmap }: { courses: Course[]; courseIncludes: string[]; roadmap: string[] }) {
  const reduceMotion = useReducedMotion();
  const flagship = courses[0];

  return (
    <div className="overflow-hidden bg-cream-50">
      <section className="relative min-h-[calc(100svh-80px)] overflow-hidden bg-navy-950 px-6 py-16 text-white lg:px-8 lg:py-20">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.17)_1px,transparent_0)] [background-size:28px_28px]" />
        <motion.div animate={reduceMotion ? undefined : { x: [0, 40, 0], y: [0, -24, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-teal-400/20 blur-[110px]" />
        <motion.div animate={reduceMotion ? undefined : { x: [0, -35, 0], y: [0, 32, 0] }} transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-amber-400/15 blur-[120px]" />

        <div className="relative mx-auto grid min-h-[72vh] max-w-7xl items-center gap-12 lg:grid-cols-[0.88fr_1.12fr]">
          <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200 backdrop-blur-md">
              <Sparkles size={14} /> Everyday Curriculum
            </div>
            <h1 className="mt-7 max-w-2xl font-display text-5xl font-medium leading-[0.98] tracking-[-0.035em] sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              Curriculum worth getting <span className="text-amber-300">excited</span> to teach.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-cream-100/74 sm:text-xl">
              Story-first courses, unforgettable visuals, and classroom-ready resources built for the moment a room full of students leans in.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/curriculum/everyday-economics" className="group inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 font-semibold text-navy-950 shadow-[0_16px_40px_rgba(245,188,66,.2)] transition hover:-translate-y-1 hover:bg-amber-300">
                Explore Everyday Economics <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#course-worlds" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-6 py-3.5 font-semibold text-white backdrop-blur-md transition hover:border-white/40 hover:bg-white/12">
                See the curriculum vision
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-cream-100/60">
              <span className="flex items-center gap-2"><BadgeCheck size={16} className="text-teal-300" /> Free at the core</span>
              <span className="flex items-center gap-2"><BadgeCheck size={16} className="text-teal-300" /> Built for real teachers</span>
              <span className="flex items-center gap-2"><BadgeCheck size={16} className="text-teal-300" /> Beautiful by design</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.88, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1, delay: 0.12, ease: [0.2, 0.8, 0.2, 1] }} className="relative mx-auto w-full max-w-2xl lg:mx-0">
            <CurriculumArtwork course={flagship} hero className="aspect-[4/3] ring-1 ring-white/15 shadow-[0_45px_100px_rgba(0,0,0,.42)]" />
            <motion.div animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [-3, -1, -3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-7 -left-4 max-w-[15rem] -rotate-3 rounded-2xl border border-navy-900/10 bg-white p-5 text-navy-900 shadow-2xl sm:-left-9">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-econ-700">The first question</p>
              <p className="mt-2 font-display text-lg leading-snug">Why is water $1.25 here—and $6 at the stadium?</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-navy-900/8 bg-white px-6 py-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 text-center sm:grid-cols-4">
          {[['7', 'connected course worlds'], ['63', 'Economics lesson days'], ['8', 'resource types'], ['100%', 'state-standards coverage']].map(([value, label]) => (
            <div key={label} className="border-navy-900/8 py-2 sm:border-r sm:last:border-r-0"><p className="font-display text-3xl text-navy-900">{value}</p><p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-navy-700/55">{label}</p></div>
          ))}
        </div>
      </section>

      <section className="relative px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={reveal} transition={{ duration: 0.7 }}>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-econ-700">Available flagship course</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-medium leading-tight text-navy-900 sm:text-6xl">Economics students can actually feel in their lives.</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-700/75">{flagship.teachingPromise}</p>
            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {flagship.previewThemes.map((theme) => <div key={theme} className="rounded-2xl border border-econ-700/12 bg-econ-50 px-4 py-4 text-sm font-semibold text-econ-900">{theme}</div>)}
            </div>
            <Link href="/curriculum/everyday-economics" className="group mt-9 inline-flex items-center gap-2 font-semibold text-econ-700">Step inside the complete course <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 60, rotate: 3 }} whileInView={{ opacity: 1, x: 0, rotate: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.85, ease: "easeOut" }}>
            <CurriculumArtwork course={flagship} hero className="aspect-[5/4] shadow-[0_30px_80px_rgba(32,61,42,.2)]" />
          </motion.div>
        </div>
      </section>

      <section id="course-worlds" className="relative bg-navy-950 px-6 py-24 text-white lg:px-8 lg:py-32">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:54px_54px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">The curriculum universe</p><h2 className="mt-4 font-display text-4xl font-medium leading-tight sm:text-6xl">Every subject should feel like a world worth entering.</h2><p className="mt-5 max-w-2xl text-lg leading-relaxed text-cream-100/65">Each course begins with a human question, then builds the stories, visuals, activities, and guidance teachers need to make it matter.</p></div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.slice(1).map((course, index) => (
              <motion.article key={course.slug} initial={{ opacity: 0, y: 44 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: 0.65, delay: (index % 3) * 0.09 }} className={`${index === 0 || index === 3 ? "lg:col-span-2" : ""} group overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-3 backdrop-blur-sm transition duration-500 hover:-translate-y-2 hover:border-white/25 hover:bg-white/10`}>
                <Link href={`/curriculum/${course.slug}`} className="block h-full">
                  <CurriculumArtwork course={course} className={`${index === 0 || index === 3 ? "aspect-[16/8]" : "aspect-[4/3]"} transition duration-700 group-hover:scale-[1.015]`} />
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[0.15em] text-teal-200">{course.eyebrow}</span><span className="rounded-full border border-white/12 px-3 py-1 text-[11px] font-semibold text-white/60">{course.status}</span></div>
                    <h3 className="mt-4 font-display text-2xl text-white sm:text-3xl">{course.name}</h3>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream-100/62">{course.essentialQuestion}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">Preview the course <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream-100 px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">The classroom rhythm</p><h2 className="mt-4 font-display text-4xl font-medium leading-tight text-navy-900 sm:text-6xl">Designed for the moment the room leans in.</h2></div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {experience.map((item, index) => <motion.div key={item.title} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.08 }} className="relative rounded-[1.75rem] border border-navy-900/8 bg-white p-7 shadow-[0_18px_50px_rgba(13,27,46,.06)]"><span className="font-mono text-xs text-navy-700/35">{item.number}</span><item.icon className="mt-8 h-7 w-7 text-teal-700" /><h3 className="mt-5 font-display text-2xl text-navy-900">{item.title}</h3><p className="mt-3 text-sm leading-relaxed text-navy-700/68">{item.copy}</p></motion.div>)}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr]">
          <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">One connected teaching system</p><h2 className="mt-4 font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">Not a folder of disconnected downloads.</h2><p className="mt-5 text-lg leading-relaxed text-navy-700/70">The textbook, lesson, visual, activity, assessment, and teacher guidance are designed to reinforce the same story.</p><Link href="/ai" className="group mt-7 inline-flex items-center gap-2 font-semibold text-teal-700">Looking for AI Literacy? <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{courseIncludes.map((item, index) => { const icons = [BookOpen, Layers3, FileText, Presentation]; const Icon = icons[index % icons.length]; return <motion.div key={item} initial={{ opacity: 0, scale: .92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: .45, delay: index * .04 }} className="rounded-2xl border border-navy-900/8 bg-white p-5 shadow-[0_8px_30px_rgba(13,27,46,.05)]"><Icon size={20} className="text-teal-700" /><p className="mt-5 text-sm font-semibold leading-snug text-navy-900">{item}</p></motion.div>; })}</div>
        </div>
      </section>

      <section className="bg-econ-950 px-6 py-24 text-white lg:px-8">
        <div className="mx-auto max-w-6xl"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-econ-300">Building first</p><h2 className="mt-4 font-display text-4xl font-medium sm:text-5xl">A real semester. Seven connected units. Ready to explore.</h2></div><ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{roadmap.map((step, index) => <li key={step} className={`rounded-2xl border border-white/10 bg-white/6 p-5 ${index === roadmap.length - 1 ? "lg:col-span-2" : ""}`}><span className="text-xs font-bold text-econ-300">UNIT {String(index + 1).padStart(2, '0')}</span><p className="mt-3 font-display text-xl text-white">{step}</p></li>)}</ol></div>
      </section>

      <section className="relative overflow-hidden bg-amber-300 px-6 py-24 lg:px-8">
        <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full border-[70px] border-white/20" />
        <div className="relative mx-auto max-w-4xl text-center"><Sparkles className="mx-auto text-navy-900" /><h2 className="mt-6 font-display text-4xl font-medium leading-tight text-navy-950 sm:text-6xl">Teach the world students are already living in.</h2><p className="mx-auto mt-5 max-w-2xl text-lg text-navy-800/75">Start with the complete Everyday Economics vision, then follow along as the curriculum library grows.</p><div className="mt-9 flex flex-wrap justify-center gap-3"><Link href="/curriculum/everyday-economics" className="group inline-flex items-center gap-2 rounded-full bg-navy-950 px-6 py-3.5 font-semibold text-white transition hover:-translate-y-1">Explore Economics <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></Link><Link href="/teachers" className="inline-flex items-center rounded-full border border-navy-900/20 bg-white/40 px-6 py-3.5 font-semibold text-navy-950 transition hover:bg-white/70">Built for teachers</Link></div></div>
      </section>
    </div>
  );
}
