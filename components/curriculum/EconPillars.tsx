import { BookOpen, Gamepad2, Lightbulb, Users } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import PillarCard from "@/components/PillarCard";

const PILLARS = [
  {
    icon: BookOpen,
    title: "Real Stories",
    description: "Learn through stories from history, today, and the future.",
  },
  {
    icon: Gamepad2,
    title: "Interactive",
    description: "Explore, experiment, and see how the economy works.",
  },
  {
    icon: Lightbulb,
    title: "Useful for Life",
    description: "Build skills you can use for your money, your career, and your future.",
  },
  {
    icon: Users,
    title: "Made for You",
    description: "Engaging, visual, and designed for the way you learn best.",
  },
];

export default function EconPillars() {
  return (
    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <h2 className="font-display text-2xl font-medium text-navy-900">
            What makes this different?
          </h2>
        </FadeIn>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar, i) => (
            <FadeIn key={pillar.title} delay={i * 0.06}>
              <PillarCard
                icon={pillar.icon}
                title={pillar.title}
                description={pillar.description}
                tint="econ"
              />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
