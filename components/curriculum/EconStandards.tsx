"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import { akaStandards, courseStats } from "@/data/economicsCourse";

export default function EconStandards() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="bg-cream-100/60 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-econ-700">
                Standards coverage
              </span>
              <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
                {courseStats.aksCoverage} AKS Coverage
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-700/70">
                Every SSEC standard, mapped to the unit and lesson day where it's taught.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-navy-900/15 bg-white px-4 py-2 text-sm font-medium text-navy-800 hover:border-navy-900/25"
            >
              {expanded ? "Hide" : "View"} standards table
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </FadeIn>

        {expanded && (
          <FadeIn delay={0.05}>
            <div className="mt-7 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-navy-900/8 text-xs uppercase tracking-wide text-navy-700/50">
                    <th className="px-4 py-3 font-medium">Standard</th>
                    <th className="px-4 py-3 font-medium">Topic</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium">Days</th>
                  </tr>
                </thead>
                <tbody>
                  {akaStandards.map((row, i) => (
                    <tr
                      key={row.code}
                      className={i < akaStandards.length - 1 ? "border-b border-navy-900/6" : ""}
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-econ-700">
                        {row.code}
                      </td>
                      <td className="px-4 py-2.5 text-navy-800/80">{row.topic}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-navy-700/70">{row.unit}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-navy-700/70">{row.days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}
