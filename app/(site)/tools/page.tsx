import { ArrowLeft, MonitorPlay } from "lucide-react";
import Button from "@/components/Button";
import SectionHeader from "@/components/SectionHeader";
import ToolCard from "@/components/ToolCard";
import FadeIn from "@/components/FadeIn";
import PhotoSlot from "@/components/PhotoSlot";
import { tools } from "@/data/tools";

export default function ToolsPage() {
  return (
    <>
      <section className="bg-grain relative overflow-hidden px-6 pt-16 pb-12 lg:px-8 lg:pt-24">
        <div className="absolute -right-20 top-10 -z-10 h-72 w-72 rounded-full bg-amber-400/15 blur-[110px]" />
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="hidden lg:block">
              <PhotoSlot
                variant="amber"
                icon={MonitorPlay}
                alt="A teacher using a classroom display tool"
                className="aspect-[4/3]"
              />
            </div>
            <div className="text-center lg:text-left">
              <h1 className="font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
                Classroom Tools
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-700/80 lg:mx-0">
                Simple web apps that help teachers run smoother, more engaging classrooms.
              </p>
            </div>
          </div>
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
