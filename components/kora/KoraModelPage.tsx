"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { animate, stagger } from "animejs";
import {
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Users,
  FileText,
  Sparkles,
  NotebookPen,
  MessageSquareText,
  Wand2,
  ScanEye,
  Eye,
  ImageOff,
  Quote,
  Zap,
  CircleCheck,
  Cpu,
} from "lucide-react";
import KoraHero from "./KoraHero";
import KoraFlowDiagram from "./KoraFlowDiagram";
import KoraLogo from "@/components/KoraLogo";
import FadeIn from "@/components/FadeIn";
import RelatedResources from "@/components/RelatedResources";

const whatKoraDoes = [
  { icon: NotebookPen, title: "Reads your lesson", description: "Upload slides and KORA extracts the concepts, structure, and key vocabulary — not just the text." },
  { icon: FileText, title: "Builds structured notesheets", description: "Scaffold turns any slideshow into a print-ready student notesheet with section types matched to the content." },
  { icon: BrainCircuit, title: "Evaluates understanding depth", description: "KORA Game scores student responses for cognitive depth — not just right-or-wrong — in real time." },
  { icon: MessageSquareText, title: "Generates draft feedback", description: "First-pass, student-specific feedback from short response text. The teacher always reviews before it goes anywhere." },
  { icon: Wand2, title: "Adapts on request", description: "Faster, harder, shorter, or for a different grade band — KORA reshapes what you already built." },
  { icon: ScanEye, title: "Explains its reasoning", description: "Every suggestion comes with a why, so the teacher can judge it — not just accept it." },
  { icon: Sparkles, title: "Anchors to your intent", description: "KORA builds from your learning objective, not from what a generic AI thinks sounds educational." },
  { icon: Cpu, title: "Learns from your revisions", description: "When you edit KORA's draft, that's the signal the model learns from — not the original output." },
];

const traceStages = [
  { icon: <Users size={16} strokeWidth={2} />, title: "Teacher Intent", description: "You state what you want students to learn and why — not just a topic, but a teaching purpose." },
  { icon: <BrainCircuit size={16} strokeWidth={2} />, title: "Teaching Decision", description: "KORA proposes an approach grounded in that intent, structured around your lesson's cognitive demands." },
  { icon: <FileText size={16} strokeWidth={2} />, title: "Lesson Blueprint", description: "A reviewable, structured outline takes shape — sections, section types, and prompts matched to the material." },
  { icon: <Sparkles size={16} strokeWidth={2} />, title: "Classroom Artifact", description: "The blueprint becomes something usable: a notesheet, a game, a draft activity — ready for the classroom." },
  { icon: <NotebookPen size={16} strokeWidth={2} />, title: "Teacher Revision", description: "You edit, correct, and reshape the artifact. This step is not optional — it's the whole point." },
  { icon: <Cpu size={16} strokeWidth={2} />, title: "Improved Model", description: "Your revision — not KORA's first guess — is what the model learns from. Better teachers make KORA better." },
];

const neverRules = [
  {
    icon: ShieldCheck,
    title: "Never decide curriculum without a teacher.",
    description: "KORA proposes. Teachers decide. No KORA output becomes curriculum until a teacher makes it so.",
  },
  {
    icon: Eye,
    title: "Never evaluate a student without teacher oversight.",
    description: "KORA scores are information for teachers — never a grade, never an intervention, never a record, without teacher judgment first.",
  },
  {
    icon: ImageOff,
    title: "Never fabricate historical images.",
    description: "KORA will not generate AI images of historical events, people, or artifacts presented as real. Where a visual is needed, it points to real sources.",
  },
  {
    icon: Users,
    title: "Never position teaching as a content problem.",
    description: "Teaching is judgment, trust, and relationships. KORA handles the repetitive formatting work — it does not touch the rest.",
  },
];

const stats = [
  { value: "100%", label: "of KORA outputs", sub: "require teacher review before use" },
  { value: "7", label: "teaching task types", sub: "KORA was purpose-trained to understand" },
  { value: "0", label: "AI-generated images", sub: "presented as real historical sources, ever" },
];

export default function KoraModelPage() {
  const statsRef = useRef<HTMLDivElement>(null);
  const diffRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);

  function animateIn(container: HTMLElement, selector: string, opts?: object) {
    const els = container.querySelectorAll(selector);
    animate(els, {
      opacity: [0, 1],
      translateY: [28, 0],
      scale: [0.97, 1],
      duration: 560,
      delay: stagger(90, { start: 0 }),
      easing: "outQuart",
      ...opts,
    });
  }

  useEffect(() => {
    function observe(ref: React.RefObject<HTMLElement | null>, selector: string) {
      if (!ref.current) return;
      const el = ref.current;
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animateIn(el, selector);
            obs.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }

    const c1 = observe(statsRef, ".stat-card");
    const c2 = observe(diffRef, ".diff-card");
    const c3 = observe(capRef, ".cap-card");
    return () => { c1?.(); c2?.(); c3?.(); };
  }, []);

  return (
    <div className="bg-navy-950">
      {/* ── Hero ── */}
      <KoraHero
        logo={<KoraLogo width={180} />}
        eyebrow="Meet KORA"
        headline={
          <>
            The first AI model
            <br />
            built for how teachers think.
          </>
        }
        subtext="Most AI tools make teachers feel like editors reviewing machine output. KORA flips that — you're the author. KORA builds the first draft."
      >
        <Link
          href="/notesheet"
          className="inline-flex items-center gap-2 rounded-full bg-teal-300 px-6 py-3 text-sm font-semibold text-navy-950 transition-all hover:bg-teal-200 hover:shadow-lg hover:shadow-teal-400/20"
        >
          Try Scaffold — it&rsquo;s free
          <ArrowRight size={14} />
        </Link>
        <Link
          href="/mission/kora-constitution"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/80 transition-colors hover:border-teal-300/40 hover:text-teal-200"
        >
          Read the KORA Constitution
        </Link>
      </KoraHero>

      {/* ── The problem ── */}
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">
              The problem worth solving
            </p>
            <h2 className="mt-5 text-center font-display text-3xl font-medium leading-tight text-white sm:text-4xl lg:text-5xl">
              Every AI tool for education was built the same wrong way.
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mx-auto mt-8 max-w-2xl text-center">
              <p className="text-lg leading-relaxed text-white/65">
                They generate content — slides, quizzes, lesson plans — and ask teachers to review it.
                That&rsquo;s not saving time. That&rsquo;s adding a second job.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-white/65">
                KORA starts from a different question: <span className="text-white font-medium">what&rsquo;s actually keeping teachers from teaching?</span>
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-6 pb-24 lg:px-8">
        <div ref={statsRef} className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.value}
                className="stat-card rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-sm"
                style={{ opacity: 0 }}
              >
                <p className="font-display text-5xl font-bold text-teal-300">{stat.value}</p>
                <p className="mt-2 text-sm font-semibold text-white">{stat.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/50">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The KORA difference ── */}
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">
              The KORA difference
            </p>
            <h2 className="mt-5 text-center font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
              Four things no other education AI does.
            </h2>
          </FadeIn>
          <div ref={diffRef} className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              {
                icon: NotebookPen,
                title: "You are the author, not the editor.",
                body: "KORA drafts from your lesson intent — your learning objective, your students, your context. Not from what a generic AI thinks sounds educational.",
              },
              {
                icon: Zap,
                title: "Every output is explicitly a draft.",
                body: "KORA never presents an output as finished. Every artifact is labeled, reviewable, and completely editable before it touches a student.",
              },
              {
                icon: Cpu,
                title: "AI that improves on your revisions.",
                body: "When you edit KORA's draft, that revision becomes the training signal — not the original output. Your expertise makes KORA smarter.",
              },
              {
                icon: CircleCheck,
                title: "Free for teachers. Always.",
                body: "No freemium bait-and-switch. No per-seat licensing. No AI feature paywall. Core tools stay free because great teaching shouldn't be paywalled.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="diff-card group rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-colors duration-300 hover:border-teal-300/25 hover:bg-white/[0.06]"
                style={{ opacity: 0 }}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
                  <item.icon size={20} strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-white/60">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote ── */}
      <section className="px-6 py-4 pb-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="rounded-3xl border border-teal-300/20 bg-gradient-to-br from-teal-400/10 via-white/[0.02] to-purple-500/10 p-10 text-center">
              <Quote size={24} className="mx-auto text-teal-300" />
              <p className="mt-6 font-display text-2xl font-medium leading-snug text-white sm:text-3xl">
                &ldquo;KORA exists to make teachers more powerful, not more replaceable.&rdquo;
              </p>
              <p className="mt-5 text-sm text-white/50">
                That&rsquo;s the single constraint every feature has to pass before it ships — not a slogan added afterward.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── What KORA can do ── */}
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">
              What KORA does
            </p>
            <h2 className="mt-5 text-center font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
              Eight things KORA understands how to do.
            </h2>
          </FadeIn>
          <div ref={capRef} className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whatKoraDoes.map((item) => (
              <div
                key={item.title}
                className="cap-card rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-teal-300/20"
                style={{ opacity: 0 }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                  <item.icon size={17} strokeWidth={2} />
                </span>
                <p className="mt-4 text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live now: Scaffold ── */}
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">
              Live now
            </p>
            <h2 className="mt-5 text-center font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
              Scaffold: the first KORA tool.
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-10 lg:p-14">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/25 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-teal-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                    Available Now · Free
                  </span>
                  <h3 className="mt-6 font-display text-2xl font-semibold text-white">
                    Upload a slideshow.<br />
                    Get a student notesheet.
                  </h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-white/65">
                    Scaffold reads your lesson slides, identifies the key concepts and structure, and builds a
                    print-ready student notesheet in seconds. Section types — fill-in-the-blank, numbered response,
                    vocabulary tables, drawing boxes — are matched to the content, not forced into a template.
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {["Accepts PowerPoint and PDF", "Student PDF + teacher answer key", "Edit any section before exporting", "No login required"].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                        <CircleCheck size={14} className="text-teal-300 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/notesheet"
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal-300 px-6 py-3 text-sm font-semibold text-navy-950 transition-all hover:bg-teal-200 hover:shadow-lg hover:shadow-teal-400/20"
                  >
                    Try Scaffold now
                    <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="flex items-center justify-center border-t border-white/10 bg-white/[0.02] p-10 lg:border-l lg:border-t-0">
                  <div className="w-full max-w-xs">
                    <div className="rounded-2xl border border-white/15 bg-navy-950 p-5 shadow-2xl">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                        Scaffold output
                      </div>
                      <p className="mt-4 font-semibold text-white text-sm">The Agricultural Revolution</p>
                      <div className="mt-4 space-y-2.5">
                        {[
                          { type: "Warm-up", color: "bg-violet-400" },
                          { type: "Fill in the Blank", color: "bg-blue-400" },
                          { type: "Vocabulary Table", color: "bg-pink-400" },
                          { type: "Numbered Response", color: "bg-emerald-400" },
                          { type: "Drawing Box", color: "bg-orange-400" },
                        ].map((s) => (
                          <div key={s.type} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                            <span className={`h-2 w-2 rounded-full ${s.color} shrink-0`} />
                            <span className="text-[11px] text-white/60">{s.type}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-[10px] text-white/25">Click any section to edit · Export as PDF</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── TRACE Method ── */}
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">The TRACE Method</p>
              <h2 className="mt-5 font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
                Teacher Reasoning and Artifact Construction Encoding.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/65">
                TRACE is the loop that connects a teacher&rsquo;s intent to a classroom artifact — and makes every teacher revision feed back into a better model.
              </p>
            </div>
          </FadeIn>
          <div className="mt-12">
            <KoraFlowDiagram stages={traceStages} />
          </div>
        </div>
      </section>

      {/* ── Rules KORA will never break ── */}
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">
              Non-negotiable
            </p>
            <h2 className="mt-5 text-center font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
              Rules KORA will never break.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-center text-lg leading-relaxed text-white/65">
              These aren&rsquo;t guidelines or best practices. They are design constraints baked into KORA from the start.
            </p>
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {neverRules.map((rule, i) => (
              <FadeIn key={rule.title} delay={i * 0.07}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-8">
                  <rule.icon size={20} className="text-teal-300" />
                  <p className="mt-5 text-base font-semibold text-white">{rule.title}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/60">{rule.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Promise ── */}
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck size={18} className="text-teal-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">Our AI Promise</p>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  "Teacher-first, in every design decision",
                  "Transparent about what it can and cannot do",
                  "Privacy-aware by requirement, not by option",
                  "Human-controlled, with teachers always in the loop",
                  "Never designed to replace a teacher's judgment",
                  "Built in service of free education, not instead of it",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/75">
                    <Eye size={14} className="mt-0.5 shrink-0 text-teal-300/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Related + CTA ── */}
      <section className="px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <RelatedResources
            theme="dark"
            title="Keep exploring"
            links={[
              { label: "Scaffold — Notesheet Engine", href: "/notesheet" },
              { label: "KORA Constitution", href: "/mission/kora-constitution" },
              { label: "Open Education & AI", href: "/research/open-education-and-ai" },
            ]}
          />
        </div>
      </section>

      <section className="px-6 pb-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <div className="mb-8 flex justify-center">
              <KoraLogo width={120} />
            </div>
            <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">
              The future of classroom AI starts with teachers in control.
            </h2>
            <p className="mt-4 text-white/60 text-lg">Try the first KORA tool. No account needed. Free.</p>
            <Link
              href="/notesheet"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal-300 px-8 py-4 text-sm font-semibold text-navy-950 transition-all hover:bg-teal-200 hover:shadow-xl hover:shadow-teal-400/25 hover:-translate-y-0.5"
            >
              Try Scaffold Now
              <ArrowRight size={14} />
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
