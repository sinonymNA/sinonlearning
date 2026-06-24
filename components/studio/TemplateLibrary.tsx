"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TemplateCard from "./TemplateCard";
import StudioModal from "./StudioModal";
import { instantiateTemplate, studioTemplates, STUDIO_TEMPLATE_CATEGORIES } from "@/lib/studioTemplates";
import { saveProject } from "@/lib/studioStorage";
import type { StudioTemplate, StudioTemplateCategory } from "@/lib/studioTemplates";

type CategoryFilter = "All" | StudioTemplateCategory;

export default function TemplateLibrary() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [activeTemplate, setActiveTemplate] = useState<StudioTemplate | null>(null);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  const filtered = useMemo(
    () =>
      category === "All"
        ? studioTemplates
        : studioTemplates.filter((template) => template.category === category),
    [category]
  );

  const handleUse = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeTemplate) return;
    const project = instantiateTemplate(activeTemplate, {
      topic: topic.trim(),
      subject: subject.trim(),
      gradeLevel: gradeLevel.trim(),
    });
    saveProject(project);
    router.push(`/studio/${project.id}`);
  };

  return (
    <div className="min-h-screen px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/studio"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-navy-700/60 hover:text-navy-900"
        >
          <ArrowLeft size={15} />
          Back to Teacher Studio
        </Link>

        <h1 className="mb-2 font-display text-3xl text-navy-900 sm:text-4xl">Template Library</h1>
        <p className="mb-8 text-navy-700/70">
          {studioTemplates.length} templates across every category. Hand-built examples come ready to
          edit; the rest are generated locally from your topic, subject, and grade.
        </p>

        <div className="mb-8 flex flex-wrap gap-2">
          {(["All", ...STUDIO_TEMPLATE_CATEGORIES] as CategoryFilter[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                category === c ? "bg-navy-900 text-white" : "bg-white text-navy-700/70 hover:bg-navy-900/5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <TemplateCard key={template.id} template={template} onUse={setActiveTemplate} />
          ))}
        </div>
      </div>

      <StudioModal
        open={activeTemplate !== null}
        onClose={() => setActiveTemplate(null)}
        title={activeTemplate ? `Use "${activeTemplate.name}"` : "Use template"}
      >
        <form onSubmit={handleUse} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="tpl-topic">
              Topic
            </label>
            <input
              id="tpl-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The Water Cycle"
              className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="tpl-subject">
                Subject
              </label>
              <input
                id="tpl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Science"
                className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="tpl-grade">
                Grade level
              </label>
              <input
                id="tpl-grade"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. 7th grade"
                className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
          >
            Create project
          </button>
        </form>
      </StudioModal>
    </div>
  );
}
