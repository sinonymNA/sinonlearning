import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import SectionHeader from "@/components/SectionHeader";
import ToolCard from "@/components/ToolCard";
import ClassroomScreenMockup from "@/components/ClassroomScreenMockup";
import FadeIn from "@/components/FadeIn";
import { tools } from "@/data/tools";

export default function ToolsPage() {
  return (
    <>
      <section className="bg-grain px-6 pt-16 pb-12 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
            Classroom Tools
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-700/80">
            Simple web apps that help teachers run smoother, more engaging classrooms.
          </p>
        </div>
      </section>

      {/* Tool cards */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool, i) => (
              <FadeIn key={tool.name} delay={(i % 4) * 0.06}>
                <ToolCard tool={tool} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Classroom Screen mockup */}
      <section className="bg-cream-100 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <SectionHeader
              eyebrow="Preview"
              title="A look at the Classroom Screen"
              subtitle="A single front-of-room display that brings together everything a teacher needs during class."
            />
          </FadeIn>
          <div className="mt-10">
            <ClassroomScreenMockup />
          </div>
        </div>
      </section>

      {/* Tool philosophy */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <SectionHeader
              title="Tools should make teaching easier, not more complicated."
              subtitle="The goal is to build small, fast, helpful tools that teachers can open quickly and use immediately without setup headaches."
            />
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="mt-10 flex justify-center">
              <Button href="/">
                <ArrowLeft size={16} />
                Back to Home
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
