"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StudioModal from "./StudioModal";
import { generateProjectDraft } from "@/lib/studioGenerator";
import { saveProject } from "@/lib/studioStorage";
import type { InstructionalStyle } from "@/lib/studioTypes";

interface ActivityBuilderProps {
  open: boolean;
  onClose: () => void;
}

const ACTIVITY_STYLES: { value: InstructionalStyle; label: string; description: string }[] = [
  { value: "gameBased", label: "Game-based", description: "Practice-heavy, competitive framing" },
  { value: "discussion", label: "Discussion", description: "Talk-and-share structure" },
  { value: "project", label: "Project", description: "Apply skills to a hands-on task" },
  { value: "balanced", label: "Balanced", description: "A mix of practice and reflection" },
];

export default function ActivityBuilder({ open, onClose }: ActivityBuilderProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [classMinutes, setClassMinutes] = useState(30);
  const [style, setStyle] = useState<InstructionalStyle>("gameBased");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const project = generateProjectDraft({
      topic: topic.trim() || "Today's Activity",
      subject,
      gradeLevel,
      classMinutes,
      outputType: "activity",
      primaryActivity: "apply",
      instructionalStyle: style,
    });
    saveProject(project);
    onClose();
    router.push(`/studio/${project.id}`);
  };

  return (
    <StudioModal open={open} onClose={onClose} title="Activity Builder">
      <p className="mb-5 text-sm text-navy-700/70">
        Build a standalone classroom activity — practice slides plus a matching task sheet,
        sized to your class period.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="act-topic">
            Activity topic
          </label>
          <input
            id="act-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Fraction Word Problems"
            className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="act-subject">
              Subject
            </label>
            <input
              id="act-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="act-grade">
              Grade
            </label>
            <input
              id="act-grade"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="act-minutes">
              Minutes
            </label>
            <input
              id="act-minutes"
              type="number"
              min={5}
              max={120}
              value={classMinutes}
              onChange={(e) => setClassMinutes(Number(e.target.value) || 30)}
              className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
          </div>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-navy-800">Activity style</span>
          <div className="grid grid-cols-2 gap-2">
            {ACTIVITY_STYLES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStyle(option.value)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                  style === option.value
                    ? "border-teal-500 bg-teal-50 text-teal-800"
                    : "border-navy-900/10 bg-white text-navy-700 hover:border-teal-400/60"
                }`}
              >
                <span className="block font-medium">{option.label}</span>
                <span className="block text-navy-700/60">{option.description}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-navy-950 transition hover:bg-amber-400"
        >
          Build activity
        </button>
      </form>
    </StudioModal>
  );
}
