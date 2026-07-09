import { Check } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import { flagshipProjects } from "@/data/economicsCourse";

export default function EconFlagshipProjects() {
  return (
    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-econ-700">
            Flagship projects
          </span>
          <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
            Two capstones. Built across the full semester.
          </h2>
        </FadeIn>

        <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {flagshipProjects.map((project, i) => (
            <FadeIn key={project.name} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-navy-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(13,27,46,0.04)] sm:p-7">
                <p className="font-display text-2xl font-medium text-navy-900">{project.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-navy-700/70">{project.tagline}</p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {project.milestones.map((m, mi) => (
                    <span key={m.label} className="flex items-center gap-2">
                      <span className="rounded-full border border-econ-200 bg-econ-50 px-3 py-1 text-xs font-medium text-econ-700">
                        {m.label}: {m.date}
                      </span>
                      {mi < project.milestones.length - 1 && (
                        <span className="text-navy-900/20">→</span>
                      )}
                    </span>
                  ))}
                </div>

                <ul className="mt-5 space-y-2 border-t border-navy-900/8 pt-5">
                  {project.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2 text-sm text-navy-800/80">
                      <Check size={14} className="mt-0.5 shrink-0 text-econ-600" strokeWidth={3} />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
