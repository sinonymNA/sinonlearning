"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StudioModal from "./StudioModal";
import { generateProjectDraft } from "@/lib/studioGenerator";
import { saveProject } from "@/lib/studioStorage";
import { STUDIO_DOC_TYPES } from "@/lib/studioTypes";
import type { StudioDocType } from "@/lib/studioTypes";

interface TeachThisTomorrowProps {
  open: boolean;
  onClose: () => void;
}

export default function TeachThisTomorrow({ open, onClose }: TeachThisTomorrowProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [classMinutes, setClassMinutes] = useState(50);
  const [outputType, setOutputType] = useState<StudioDocType>("lesson");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const project = generateProjectDraft({
      topic: topic.trim() || "Tomorrow's Lesson",
      gradeLevel,
      classMinutes,
      outputType,
    });
    saveProject(project);
    onClose();
    router.push(`/studio/${project.id}`);
  };

  return (
    <StudioModal open={open} onClose={onClose} title="Teach This Tomorrow">
      <p className="mb-5 text-sm text-navy-700/70">
        Answer a few quick questions and we&apos;ll build a ready-to-edit draft right now — no waiting,
        no AI guesswork. You&apos;re always in control of the final lesson.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="ttt-topic">
            What are you teaching?
          </label>
          <input
            id="ttt-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis"
            className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="ttt-grade">
              Grade level
            </label>
            <input
              id="ttt-grade"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g. 7th grade"
              className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="ttt-minutes">
              Class length (min)
            </label>
            <input
              id="ttt-minutes"
              type="number"
              min={10}
              max={180}
              value={classMinutes}
              onChange={(e) => setClassMinutes(Number(e.target.value) || 50)}
              className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="ttt-type">
            What do you need?
          </label>
          <select
            id="ttt-type"
            value={outputType}
            onChange={(e) => setOutputType(e.target.value as StudioDocType)}
            className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {STUDIO_DOC_TYPES.map((docType) => (
              <option key={docType.value} value={docType.value}>
                {docType.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-navy-950 transition hover:bg-amber-400"
        >
          Build it now
        </button>
      </form>
    </StudioModal>
  );
}
