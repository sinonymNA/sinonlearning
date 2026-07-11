"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, BrainCircuit, Check, FileText, Orbit, ShieldCheck, Sparkles, UserRoundCheck, WandSparkles, Workflow } from "lucide-react";
import KoraLogo from "@/components/KoraLogo";

const capabilities = [
  { icon: FileText, index: "01", title: "Understands the lesson", copy: "KORA reads the objective, source material, structure, and cognitive demand—not just the words on a slide." },
  { icon: Workflow, index: "02", title: "Builds the first draft", copy: "It turns teacher intent into a structured artifact: a notesheet, activity, presentation, game, or feedback draft." },
  { icon: UserRoundCheck, index: "03", title: "Keeps judgment human", copy: "Every output stays editable and reviewable. The teacher decides what reaches students and what needs to change." },
  { icon: BrainCircuit, index: "04", title: "Learns the teaching pattern", copy: "KORA captures the decisions around the work—purpose, constraints, revisions, and classroom context—not merely the final prose." },
];

const liveTools = [
  ["Scaffold", "Slides → student notesheet"],
  ["Slider", "Teaching intent → presentation"],
  ["Margins", "Student writing → teacher-reviewed feedback"],
  ["Game Shows", "Lesson content → classroom game"],
];

const guardrails = [
  "Never decide curriculum without a teacher.",
  "Never turn an AI score directly into a student grade.",
  "Never present generated historical imagery as evidence.",
  "Never confuse automation with the work of teaching.",
];

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div initial={{ opacity: 0, y: reduced ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: .7, delay, ease: [.22, 1, .36, 1] }} className={className}>{children}</motion.div>;
}

export default function KoraModelPage() {
  const reduced = useReducedMotion();

  return (
    <main className="kora-space min-h-screen overflow-hidden bg-[#05040b] text-[#f7f4ff] selection:bg-violet-400/35">
      <style jsx global>{`
        @keyframes kora-spin { to { transform: rotate(360deg) scale(1.02); } }
        @keyframes kora-pulse { 50% { opacity: .6; transform: scale(1.06); } }
        .kora-star { animation: kora-spin 80s linear infinite; }
        .kora-glow { animation: kora-pulse 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .kora-star, .kora-glow { animation: none; } }
      `}</style>

      <section className="relative min-h-[100svh] border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_76%,rgba(124,58,237,.25),transparent_38%),linear-gradient(180deg,#081020_0%,#05040b_66%)]" />
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,.7) 0 1px,transparent 1.5px)", backgroundSize: "97px 97px" }} />
        <nav className="relative z-30 mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 px-6 py-5 lg:px-8">
          <KoraLogo width={118} className="brightness-0 invert" />
          <div className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[.2em] text-white/55 md:flex">
            <a href="#system" className="transition hover:text-white">The system</a>
            <a href="#live" className="transition hover:text-white">Live tools</a>
            <a href="#principles" className="transition hover:text-white">Principles</a>
          </div>
          <Link href="/notesheet" className="rounded-full border border-white/25 bg-white px-5 py-2 text-xs font-bold text-[#090713] shadow-[0_0_28px_rgba(255,255,255,.22)] transition hover:scale-105">Try KORA</Link>
        </nav>

        <div className="relative z-20 mx-auto flex max-w-5xl flex-col items-center px-6 pt-16 text-center sm:pt-20">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold uppercase tracking-[.45em] text-violet-200">Teacher-centered intelligence</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .1 }} className="mt-6 font-display text-6xl font-medium tracking-[-.04em] text-white sm:text-8xl lg:text-[7.5rem]">KORA</motion.h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .2 }} className="mt-5 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">A teacher-centered AI system that turns instructional intent into classroom-ready drafts—powered by Claude, directed by educators, and governed by principles that keep judgment human.</motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .35 }} className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#system" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[.12em] text-[#080611]">Explore the system <ArrowDown size={14} /></a>
            <Link href="/mission/kora-constitution" className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-[.12em] text-white/80 backdrop-blur">Read the constitution</Link>
          </motion.div>
        </div>

        <div className="relative z-10 mx-auto -mt-2 h-[44vw] min-h-[330px] max-h-[620px] max-w-[1180px] overflow-hidden">
          <div className="kora-glow absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/30 blur-[90px]" />
          <motion.div animate={reduced ? undefined : { y: [0, -8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0">
            <Image src="/kora-purple-star.png" alt="A luminous violet star burning in deep space" fill priority className="kora-star object-contain object-center" sizes="100vw" />
          </motion.div>
        </div>
        <div className="absolute bottom-6 left-6 z-20 text-[10px] uppercase tracking-[.28em] text-white/30">KORA / System 01</div>
        <div className="absolute bottom-6 right-6 z-20 text-[10px] uppercase tracking-[.28em] text-white/30">Powered by Claude</div>
      </section>

      <section id="system" className="relative px-6 py-28 lg:px-8 lg:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(124,58,237,.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[.35em] text-violet-300">Not another foundation model</p><h2 className="mt-5 font-display text-4xl leading-tight sm:text-6xl">Claude is the engine.<br /><span className="text-violet-300">KORA is the teaching system.</span></h2></div>
            <p className="max-w-2xl text-lg leading-8 text-white/55">KORA is the layer between a general-purpose language model and a real classroom. It structures teacher intent, applies educational constraints, creates reviewable artifacts, and preserves teacher authority from prompt to final material.</p>
          </Reveal>
          <div className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 md:grid-cols-4">
            {capabilities.map((item, i) => <Reveal key={item.title} delay={i * .08} className="bg-[#090814] p-7 lg:p-8"><div className="flex items-center justify-between"><item.icon size={20} className="text-violet-300" /><span className="font-mono text-xs text-white/25">{item.index}</span></div><h3 className="mt-12 text-lg font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-white/48">{item.copy}</p></Reveal>)}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#090713] px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center"><p className="text-xs font-semibold uppercase tracking-[.35em] text-violet-300">Signal path</p><h2 className="mt-5 font-display text-4xl sm:text-5xl">One continuous orbit around teacher intent.</h2></Reveal>
          <Reveal delay={.1} className="mt-14 grid gap-4 md:grid-cols-5">
            {["Teacher intent", "KORA structure", "Claude generation", "Teacher revision", "Classroom artifact"].map((label, i) => <div key={label} className="relative rounded-2xl border border-white/10 bg-white/[.025] p-5 text-center"><span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/40 bg-violet-400/10 font-mono text-xs text-violet-200">{i + 1}</span><p className="mt-4 text-sm font-semibold">{label}</p>{i < 4 && <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden text-violet-300 md:block" size={16} />}</div>)}
          </Reveal>
        </div>
      </section>

      <section id="live" className="px-6 py-28 lg:px-8 lg:py-36">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-start">
          <Reveal><p className="text-xs font-semibold uppercase tracking-[.35em] text-violet-300">In orbit now</p><h2 className="mt-5 font-display text-5xl leading-tight">The system is already building with teachers.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-white/52">These tools use Claude for generation and KORA for instructional structure, constraints, workflow, and teacher review.</p><Link href="/notesheet" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-violet-300">Launch Scaffold <ArrowRight size={15} /></Link></Reveal>
          <div className="space-y-3">{liveTools.map(([name, detail], i) => <Reveal key={name} delay={i * .07}><div className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] p-5 transition hover:border-violet-400/40 hover:bg-violet-400/[.07]"><div><p className="text-lg font-semibold">{name}</p><p className="mt-1 text-sm text-white/42">{detail}</p></div><Orbit size={20} className="text-violet-300 transition group-hover:rotate-45" /></div></Reveal>)}</div>
        </div>
      </section>

      <section id="principles" className="relative overflow-hidden border-y border-white/10 px-6 py-28 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(139,92,246,.17),transparent_32%)]" />
        <div className="relative mx-auto max-w-6xl">
          <Reveal className="grid gap-12 lg:grid-cols-2"><div><ShieldCheck className="text-violet-300" size={28} /><p className="mt-8 text-xs font-semibold uppercase tracking-[.35em] text-violet-300">Non-negotiable principles</p><h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">Powerful enough to help.<br />Constrained enough to trust.</h2></div><div className="space-y-4">{guardrails.map((rule) => <div key={rule} className="flex gap-4 border-b border-white/10 pb-4 text-base text-white/68"><Check size={17} className="mt-1 shrink-0 text-violet-300" /><p>{rule}</p></div>)}</div></Reveal>
        </div>
      </section>

      <section className="px-6 py-28 text-center lg:px-8 lg:py-40">
        <Reveal className="mx-auto max-w-4xl"><Sparkles className="mx-auto text-violet-300" /><p className="mt-8 text-xs font-semibold uppercase tracking-[.35em] text-violet-300">Begin with your lesson</p><h2 className="mt-5 font-display text-5xl sm:text-7xl">Teaching remains the center of gravity.</h2><p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/50">KORA handles the structure and the first draft. You bring the judgment, relationships, and knowledge that make it teaching.</p><Link href="/notesheet" className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-[#080611] shadow-[0_0_48px_rgba(167,139,250,.28)]">Build with KORA <WandSparkles size={16} /></Link></Reveal>
      </section>
    </main>
  );
}
