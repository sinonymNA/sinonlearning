import Link from "next/link";
import {
  ArrowRight,
  Wrench,
  GraduationCap,
  Microscope,
} from "lucide-react";
import Button from "@/components/Button";
import SectionHeader from "@/components/SectionHeader";
import HeroIntro from "@/components/HeroIntro";
import HeroDashboard from "@/components/HeroDashboard";
import EmailSignup from "@/components/EmailSignup";
import FadeIn from "@/components/FadeIn";
import PathwayCard from "@/components/PathwayCard";
import PromiseCard from "@/components/PromiseCard";
import RoadmapCard from "@/components/RoadmapCard";
import KoraLogo from "@/components/KoraLogo";
import AnimatedHeroBlobs from "@/components/AnimatedHeroBlobs";
import AppMarquee from "@/components/AppMarquee";
import ParticleConstellationScene from "@/components/ParticleConstellationScene";
import GravityWellScene from "@/components/GravityWellScene";
import { homeRoadmap } from "@/data/courses";

const startHere = [
  {
    href: "/teachers",
    title: "I'm a teacher",
    description: "Find classroom apps, simulations, and AI-powered tools built to support your teaching.",
    icon: Wrench,
    cta: "See Teacher Apps",
  },
  {
    href: "/students",
    title: "I'm a student",
    description: "Browse digital textbooks, simulations, and resources built for you, not just your class.",
    icon: GraduationCap,
    cta: "Go to Students",
  },
  {
    href: "/research",
    title: "I'm into AI & research",
    description: "See the learning science and teacher-first AI thinking behind Sinon Learning.",
    icon: Microscope,
    cta: "Go to Research",
  },
];

const featuredNow = [
  {
    title: "Everyday Economics",
    description: "The first complete Everyday Curriculum course, ready for the classroom.",
    href: "/curriculum/everyday-economics",
    cta: "Explore the course",
  },
  {
    title: "Notesheet Engine",
    description: "Upload a slideshow — Sinon reads the lesson and builds a student notesheet in your style.",
    href: "/notesheet",
    cta: "Try it now",
  },
  {
    title: "KORA Model",
    description: "Teachers think. KORA builds. Sinon Learning's teacher-first AI vision.",
    href: "/research/kora-model",
    cta: "Meet KORA",
  },
  {
    title: "Research to Practice",
    description: "Real learning science, turned into a real next step for tomorrow's lesson.",
    href: "/research/research-to-practice",
    cta: "Read the breakdown",
  },
];

const aiPromises = [
  {
    quote: "AI should make teachers more powerful, not more replaceable.",
    attribution: "On teacher-first AI",
  },
  {
    quote: "Every output is a draft for a teacher to review, never a finished decision.",
    attribution: "On staying human-controlled",
  },
  {
    quote: "The core curriculum and tools stay free, regardless of how the AI evolves.",
    attribution: "On free education",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-grain relative overflow-hidden bg-cream-50">
        <AnimatedHeroBlobs />
        <ParticleConstellationScene />
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-20 lg:px-8 lg:pt-24">
          <HeroIntro />

          <div className="mt-16">
            <HeroDashboard />
          </div>
        </div>
      </section>

      {/* Start Here */}
      <section id="start-here" className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <SectionHeader eyebrow="Start Here" title="Find your way in." />
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {startHere.map((path, i) => (
              <FadeIn key={path.href} delay={i * 0.1}>
                <PathwayCard {...path} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* App marquee */}
      <AppMarquee />

      {/* Featured Now */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <SectionHeader eyebrow="Featured Now" title="Worth a look right now." />
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredNow.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <Link
                  href={item.href}
                  className="group relative block h-full overflow-hidden rounded-3xl border border-navy-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(13,27,46,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:-rotate-1 hover:shadow-[0_16px_40px_rgba(13,27,46,0.1)]"
                >
                  <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400 transition-transform duration-300 group-hover:scale-x-100" />
                  <h3 className="font-display text-lg font-medium text-navy-900">{item.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-navy-700/75">{item.description}</p>
                  <span className="mt-5 flex items-center gap-1.5 text-sm font-medium text-teal-700">
                    {item.cta}
                    <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Our AI Promise */}
      <section className="bg-cream-100 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="flex justify-center mb-6">
              <KoraLogo width={220} className="max-w-[60vw]" />
            </div>
            <SectionHeader
              eyebrow="Our AI Promise"
              title="Teacher-first, not teacher-optional."
              subtitle="Sinon Learning's teacher-first AI, held to a set of explicit promises."
            />
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {aiPromises.map((promise, i) => (
              <FadeIn key={promise.quote} delay={i * 0.08}>
                <PromiseCard {...promise} />
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.2}>
            <div className="mt-10 flex justify-center">
              <Button href="/research/kora-model" variant="secondary">
                Meet KORA
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Now Building */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <SectionHeader
              eyebrow="Now Building"
              title="First focus: Everyday Economics."
              subtitle="Economics is one of the most important subjects students can learn, but teachers often have to piece together disconnected resources. The first Everyday Curriculum project is a modern, classroom-ready economics course, mapped day-by-day to a full semester."
            />
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="mt-12">
              <RoadmapCard steps={homeRoadmap} variant="pills" />
            </div>
          </FadeIn>

          <FadeIn delay={0.25}>
            <div className="mt-10 flex justify-center">
              <Button href="/curriculum" variant="secondary">
                See Curriculum Plan
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Mission teaser */}
      <section className="px-6 pb-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <p className="text-navy-700/70">
              Built on a simple belief: great learning should not be locked behind a paywall.{" "}
              <Link href="/mission" className="font-medium text-teal-700 hover:text-teal-800">
                Read our mission
              </Link>
              .
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Email signup */}
      <section className="relative overflow-hidden bg-cream-100 px-6 py-20 lg:px-8">
        <GravityWellScene />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <FadeIn>
            <h2 className="font-display text-3xl font-medium text-navy-900 sm:text-4xl">
              Follow the build.
            </h2>
            <p className="mt-4 text-lg text-navy-700/80">
              Get updates as new curriculum, tools, and resources are created.
            </p>
            <div className="mt-8 flex justify-center">
              <EmailSignup />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 lg:px-8">
        <FadeIn>
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-navy-900/8 bg-white px-8 py-14 text-center shadow-[0_30px_60px_-15px_rgba(13,27,46,0.12)] sm:px-16">
            <div className="absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/15 blur-[100px]" />
            <h2 className="font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
              A better classroom library, built one resource at a time.
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/curriculum">Explore Curriculum</Button>
              <Button href="/teachers" variant="secondary">
                Teacher Apps
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
