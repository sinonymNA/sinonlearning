import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ShieldCheck,
  Eye,
  Users,
  Lock,
  ImageOff,
  Sparkles,
  NotebookPen,
  ClipboardCheck,
  MessageSquareText,
  Wand2,
  FileText,
  GraduationCap,
  Database,
  ScanEye,
  Quote,
} from "lucide-react";
import KoraHero from "@/components/kora/KoraHero";
import KoraFlowDiagram from "@/components/kora/KoraFlowDiagram";
import FadeIn from "@/components/FadeIn";
import RelatedResources from "@/components/RelatedResources";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "KORA Model — Sinon Learning",
  description:
    "KORA is Sinon Learning's teacher-first AI vision: a model built to support teaching, never to replace it. Teachers think. KORA builds.",
  alternates: { canonical: `${SITE_URL}/research/kora-model` },
};

const whatKoraIsNot = [
  {
    title: "Not an autopilot",
    description: "KORA never makes a classroom decision on its own. Every output is a draft for a teacher to review.",
  },
  {
    title: "Not a teacher replacement",
    description: "KORA exists to support teaching, never to replace the judgment, trust, and relationships a teacher brings.",
  },
  {
    title: "Not a black box",
    description: "KORA is built to be transparent about what it can and cannot do—no hidden capabilities, no overclaiming.",
  },
];

const whatKoraDoes = [
  { icon: NotebookPen, title: "Drafts lesson outlines", description: "Starting points from a topic and standard, shaped by the teacher." },
  { icon: Sparkles, title: "Generates slide drafts", description: "First-pass slide decks built from a lesson outline." },
  { icon: ClipboardCheck, title: "Builds activity drafts", description: "Activity and assessment starting points tied to a lesson." },
  { icon: MessageSquareText, title: "Assists with feedback", description: "First-pass feedback drafts for a teacher to revise and personalize." },
  { icon: FileText, title: "Drafts classroom documents", description: "Starting templates for rubrics, letters, and syllabi." },
  { icon: Wand2, title: "Revises on request", description: "Faster, harder, or shorter versions of material a teacher already built." },
  { icon: GraduationCap, title: "Explains its reasoning", description: "Shows why it made a suggestion, so a teacher can judge it." },
  { icon: ScanEye, title: "Stays reviewable", description: "Every draft is visibly a draft, never presented as a finished decision." },
];

const traceStages = [
  { icon: <Users size={16} strokeWidth={2} />, title: "Teacher Intent", description: "A teacher states what they want students to learn and why." },
  { icon: <BrainCircuit size={16} strokeWidth={2} />, title: "Teaching Decision", description: "KORA proposes an approach grounded in that intent." },
  { icon: <FileText size={16} strokeWidth={2} />, title: "Lesson Blueprint", description: "A structured, reviewable outline takes shape from the decision." },
  { icon: <Sparkles size={16} strokeWidth={2} />, title: "Classroom Artifact", description: "The blueprint becomes a usable slide deck, activity, or document." },
  { icon: <NotebookPen size={16} strokeWidth={2} />, title: "Teacher Revision", description: "The teacher edits, corrects, and reshapes the artifact freely." },
  { icon: <Database size={16} strokeWidth={2} />, title: "Improved Model", description: "That revision—not the original draft—is what KORA learns from." },
];

const aiPromise = [
  "Teacher-first, in every design decision",
  "Transparent about what it can and cannot do",
  "Privacy-aware by requirement, not by option",
  "Human-controlled, with teachers always in the loop",
  "Never designed to replace a teacher's judgment",
  "Built in service of free education, not instead of it",
];

export default function KoraModelPage() {
  return (
    <div className="bg-navy-950">
      <KoraHero
        eyebrow="Introducing KORA"
        headline={
          <>
            Teachers think.
            <br />
            KORA builds.
          </>
        }
        subtext="KORA is Sinon Learning's teacher-first AI model—built to remove the dirty, repetitive work around teaching, never the thinking, judgment, and relationships that make teaching matter."
      >
        <Link
          href="/notesheet"
          className="inline-flex items-center gap-2 rounded-full bg-teal-300 px-6 py-3 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
        >
          Try the Notesheet Engine
          <ArrowRight size={14} />
        </Link>
        <Link
          href="/mission/kora-constitution"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/80 transition-colors hover:border-teal-300/40 hover:text-teal-200"
        >
          Read the KORA Constitution
        </Link>
      </KoraHero>

      {/* What is KORA */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">What is KORA</p>
            <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
              A teacher-first AI model, built around one constraint.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/65">
              KORA is the AI model behind Sinon Learning&rsquo;s teacher-facing tools. It is designed to
              remove the dirty, repetitive work around teaching—drafting, formatting, first passes—so teachers can spend
              their time and attention on what actually requires a human: judgment, relationships, and real classroom
              decisions.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* What KORA is not */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">
              What KORA is not
            </p>
          </FadeIn>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {whatKoraIsNot.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <Lock size={18} className="text-teal-300" />
                  <p className="mt-4 text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* What KORA does */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">
              What KORA does
            </p>
          </FadeIn>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whatKoraDoes.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                    <item.icon size={17} strokeWidth={2} />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* The KORA Principle */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="rounded-3xl border border-teal-300/20 bg-gradient-to-br from-teal-400/10 via-white/[0.02] to-purple-500/10 p-10 text-center">
              <Quote size={24} className="mx-auto text-teal-300" />
              <p className="mt-5 font-display text-2xl font-medium leading-snug text-white sm:text-3xl">
                &ldquo;KORA exists to make teachers more powerful, not more replaceable.&rdquo;
              </p>
              <p className="mt-5 text-white/60">
                That is the single constraint every feature has to pass before it ships—not a slogan layered on
                afterward.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* TRACE Method */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">The TRACE Method</p>
              <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
                Teacher Reasoning and Artifact Construction Encoding
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/65">
                TRACE is how a teacher&rsquo;s intent becomes a usable classroom artifact—and how that teacher&rsquo;s own
                revisions, not the model&rsquo;s first guess, become the signal KORA actually learns from.
              </p>
            </div>
          </FadeIn>
          <div className="mt-10">
            <KoraFlowDiagram stages={traceStages} />
          </div>
        </div>
      </section>

      {/* Comet Assistant */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">Comet Assistant</p>
            <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
              The face teachers talk to.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/65">
              Comet is the assistant teachers actually interact with inside tools like Teacher Studio—the conversational
              layer that takes a request and turns it into a TRACE-built draft.
            </p>
            <p className="mt-5 font-display text-xl font-medium text-white">
              Comet is the face. KORA is the brain. Sinon Learning is the mission.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* No AI-generated images */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10">
              <ImageOff size={22} className="text-teal-300" />
              <h2 className="mt-5 font-display text-2xl font-medium text-white">No fabricated historical images.</h2>
              <p className="mt-4 leading-relaxed text-white/65">
                KORA will never generate fabricated images presented as real historical or factual material. An
                AI-generated image of, say, a Silk Road trade caravan might look convincing, but it is not a historical
                record—and presenting it as one would teach students the wrong lesson about what&rsquo;s real. Where a visual
                is needed, KORA points to real maps, real artifacts, and real sources instead of inventing one.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Open model vision + AI Promise */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">Open Model Vision</p>
              <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
                Toward open, teacher-centered AI infrastructure.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/65">
                Over time, the goal is for KORA&rsquo;s progress to feed back into open education infrastructure: open KORA
                Datasets built from real, consented teacher revisions, open KORA Models other educators and
                researchers can build on, and evaluation methods centered on what actually helps a teacher—not generic
                benchmarks.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">Our AI Promise</p>
              </div>
              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {aiPromise.map((item) => (
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

      <section className="px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <RelatedResources
            theme="dark"
            title="Keep exploring"
            links={[
              { label: "Notesheet Engine", href: "/notesheet" },
              { label: "KORA Constitution", href: "/mission/kora-constitution" },
              { label: "Open Education & AI", href: "/research/open-education-and-ai" },
            ]}
          />
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">
              Built for free education. Built to stay human.
            </h2>
            <Link
              href="/mission"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-300 px-6 py-3 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
            >
              Read Our Mission
              <ArrowRight size={14} />
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
