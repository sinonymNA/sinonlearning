import {
  ArrowRight,
  HeartHandshake,
  GraduationCap,
  School,
} from "lucide-react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import SectionHeader from "@/components/SectionHeader";
import HeroDashboard from "@/components/HeroDashboard";
import EmailSignup from "@/components/EmailSignup";
import FadeIn from "@/components/FadeIn";
import { homeRoadmap } from "@/data/courses";

const ecosystem = [
  {
    title: "Everyday Curriculum",
    description:
      "Complete courses, units, digital textbooks, slides, activities, assessments, and visual resources.",
    cta: "Explore Curriculum",
    href: "/curriculum",
  },
  {
    title: "Classroom Tools",
    description:
      "Simple teacher web apps like classroom screens, timers, randomizers, group makers, and lesson helpers.",
    cta: "Explore Tools",
    href: "/tools",
  },
  {
    title: "More Coming Later",
    description:
      "Games, simulations, student courses, maps, and interactive learning experiences as the project grows.",
    cta: "Follow the Mission",
    href: "/#mission",
  },
];

const principles = [
  {
    icon: HeartHandshake,
    title: "Free core learning resources",
    description: "The essential curriculum library stays free, always.",
  },
  {
    icon: GraduationCap,
    title: "Built by a real teacher",
    description: "Designed from real classroom experience, not guesswork.",
  },
  {
    icon: School,
    title: "Designed for real classrooms",
    description: "Practical, usable, and ready for the way teachers actually teach.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-grain overflow-hidden bg-cream-50">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-20 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-medium leading-[1.1] text-navy-900 sm:text-5xl lg:text-6xl">
              Free curriculum and classroom tools for better learning.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-700/80">
              Sinon Learning is building a free library of modern curriculum, digital
              textbooks, visual resources, and simple classroom tools—created for real
              teachers and real students.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/curriculum">
                Explore Everyday Curriculum
                <ArrowRight size={16} />
              </Button>
              <Button href="/tools" variant="secondary">
                View Classroom Tools
              </Button>
            </div>
            <p className="mx-auto mt-6 max-w-xl text-sm text-navy-700/60">
              Core learning resources will be free because great learning should not be
              locked behind a paywall.
            </p>
          </div>

          <div className="mt-16">
            <HeroDashboard />
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <SectionHeader title="Start simple. Grow with purpose." />
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {ecosystem.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <Card className="flex h-full flex-col">
                  <h3 className="font-display text-xl font-medium text-navy-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-navy-700/80">
                    {item.description}
                  </p>
                  <Button href={item.href} variant="secondary" size="sm" className="mt-6 self-start">
                    {item.cta}
                  </Button>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="bg-navy-950 px-6 py-20 text-cream-50 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-teal-300">
              Mission
            </p>
            <h2 className="font-display text-3xl font-medium leading-tight sm:text-4xl">
              The mission is simple: great learning should be accessible.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream-100/75">
              Teachers should not have to spend their own money just to give students
              thoughtful, beautiful, engaging resources. Students should not have their
              learning limited by the resources their school can afford. Sinon Learning
              exists to build useful curriculum and classroom tools that teachers and
              students can actually use.
            </p>
          </FadeIn>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {principles.map((principle, i) => (
              <FadeIn key={principle.title} delay={i * 0.1}>
                <div className="rounded-2xl border border-cream-50/10 bg-cream-50/5 p-6 text-left">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/15 text-teal-300">
                    <principle.icon size={17} />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-cream-50">
                    {principle.title}
                  </p>
                  <p className="mt-1.5 text-sm text-cream-100/65">{principle.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* First focus */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <SectionHeader
              eyebrow="First Focus"
              title="First focus: Everyday Economics and Personal Finance."
              subtitle="Economics and personal finance are some of the most important subjects students can learn, but teachers often have to piece together disconnected resources. The first Everyday Curriculum project will be a modern, classroom-ready economics and personal finance library."
            />
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {homeRoadmap.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="whitespace-nowrap rounded-full border border-navy-900/10 bg-white px-4 py-2 text-sm font-medium text-navy-800 shadow-sm">
                    {step}
                  </span>
                  {i < homeRoadmap.length - 1 && (
                    <span className="text-navy-900/20">→</span>
                  )}
                </div>
              ))}
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

      {/* Email signup */}
      <section className="bg-cream-100 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
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
          <div className="mx-auto max-w-3xl rounded-[28px] bg-navy-950 px-8 py-14 text-center text-cream-50 sm:px-16">
            <h2 className="font-display text-3xl font-medium leading-tight sm:text-4xl">
              A better classroom library, built one resource at a time.
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/curriculum">Explore Curriculum</Button>
              <Button href="/tools" variant="ghost">
                View Tools
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
