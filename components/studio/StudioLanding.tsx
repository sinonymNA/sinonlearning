"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, FilePlus2, Sparkles, Trash2 } from "lucide-react";
import CometCharacter from "./CometCharacter";
import ProjectTypeSelector from "./ProjectTypeSelector";
import CometBuildFlow from "./CometBuildFlow";
import TeachThisTomorrow from "./TeachThisTomorrow";
import AssessmentBuilder from "./AssessmentBuilder";
import ActivityBuilder from "./ActivityBuilder";
import { deleteProject, duplicateProject, listProjects } from "@/lib/studioStorage";
import { STUDIO_DOC_TYPES } from "@/lib/studioTypes";
import type { StudioIndexEntry } from "@/lib/studioTypes";

type ModalKey = "comet" | "teachTomorrow" | "assessment" | "activity" | null;

function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function typeLabel(type: StudioIndexEntry["type"]): string {
  return STUDIO_DOC_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default function StudioLanding() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<StudioIndexEntry[]>([]);
  const [scratchOpen, setScratchOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalKey>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- project list can't be read until after hydration (localStorage)
    setProjects(listProjects());
    setMounted(true);
  }, []);

  const refresh = () => setProjects(listProjects());

  const handleDuplicate = (id: string) => {
    duplicateProject(id);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this project? This can't be undone.")) {
      return;
    }
    deleteProject(id);
    refresh();
  };

  return (
    <div className="min-h-screen px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/teacher-tools/teacher-studio"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-navy-700/60 hover:text-navy-900"
        >
          <ArrowLeft size={15} />
          Back to Teacher Studio overview
        </Link>

        <div className="mb-10 flex items-center gap-4">
          <CometCharacter size={64} />
          <div>
            <h1 className="font-display text-3xl text-navy-900 sm:text-4xl">Teacher Studio</h1>
            <p className="mt-1 text-navy-700/70">
              Build slides, worksheets, and activities — free, local, and yours to edit.
            </p>
          </div>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickCreateCard
            icon={<FilePlus2 size={20} />}
            title="Start from scratch"
            description="Pick a document type and build it your way."
            onClick={() => setScratchOpen((v) => !v)}
          />
          <QuickCreateCard
            icon={<Sparkles size={20} />}
            title="Browse templates"
            description="36 ready-made starting points across every category."
            onClick={() => router.push("/studio/templates")}
          />
          <QuickCreateCard
            icon={<CometCharacter size={28} />}
            title="Build with Comet"
            description="Answer a few quick questions, get a full draft."
            onClick={() => setActiveModal("comet")}
          />
          <QuickCreateCard
            icon={<Sparkles size={20} />}
            title="Teach this tomorrow"
            description="The fastest path from idea to ready-to-teach draft."
            onClick={() => setActiveModal("teachTomorrow")}
          />
          <QuickCreateCard
            icon={<Sparkles size={20} />}
            title="Assessment builder"
            description="Quizzes, exit tickets, and study guides with answer keys."
            onClick={() => setActiveModal("assessment")}
          />
          <QuickCreateCard
            icon={<Sparkles size={20} />}
            title="Activity builder"
            description="Standalone practice activities sized to your class period."
            onClick={() => setActiveModal("activity")}
          />
        </div>

        {scratchOpen && (
          <div className="mb-12 rounded-3xl border border-navy-900/8 bg-white/70 p-6">
            <p className="mb-3 text-sm font-medium text-navy-800">What are you building?</p>
            <ProjectTypeSelector
              onSelect={(type) => router.push(`/studio/new?mode=scratch&type=${type}`)}
            />
          </div>
        )}

        <div>
          <h2 className="mb-4 font-display text-xl text-navy-900">Recent projects</h2>
          {!mounted ? null : projects.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-navy-900/15 px-6 py-8 text-center text-sm text-navy-700/50">
              Projects you create on this device will show up here.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-navy-900/8 bg-white px-5 py-4"
                >
                  <Link href={`/studio/${project.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-900">{project.title}</p>
                    <p className="mt-0.5 text-xs text-navy-700/50">
                      {typeLabel(project.type)} · {timeAgo(project.updatedAt)}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(project.id)}
                      aria-label="Duplicate project"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-navy-700/50 transition hover:bg-navy-900/5 hover:text-navy-900"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id)}
                      aria-label="Delete project"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-navy-700/50 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CometBuildFlow open={activeModal === "comet"} onClose={() => setActiveModal(null)} />
      <TeachThisTomorrow open={activeModal === "teachTomorrow"} onClose={() => setActiveModal(null)} />
      <AssessmentBuilder open={activeModal === "assessment"} onClose={() => setActiveModal(null)} />
      <ActivityBuilder open={activeModal === "activity"} onClose={() => setActiveModal(null)} />
    </div>
  );
}

function QuickCreateCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-3xl border border-navy-900/8 bg-white p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-teal-400/40 hover:shadow-lg hover:shadow-navy-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        {icon}
      </span>
      <span className="font-display text-lg text-navy-900">{title}</span>
      <span className="text-sm text-navy-700/60">{description}</span>
    </button>
  );
}
