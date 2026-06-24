"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StudioModal from "./StudioModal";
import { generateProjectDraft } from "@/lib/studioGenerator";
import { saveProject } from "@/lib/studioStorage";
import type { StudioDocType } from "@/lib/studioTypes";

interface AssessmentBuilderProps {
  open: boolean;
  onClose: () => void;
}

const ASSESSMENT_TYPES: { value: StudioDocType; label: string }[] = [
  { value: "assessment", label: "Quick Check Quiz" },
  { value: "exitTicket", label: "Exit Ticket" },
  { value: "studyGuide", label: "Study Guide" },
];

export default function AssessmentBuilder({ open, onClose }: AssessmentBuilderProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [outputType, setOutputType] = useState<StudioDocType>("assessment");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const project = generateProjectDraft({
      topic: topic.trim() || "Today's Topic",
      subject,
      gradeLevel,
      classMinutes: 20,
      outputType,
      primaryActivity: "review",
      instructionalStyle: "balanced",
    });
    saveProject(project);
    onClose();
    router.push(`/studio/${project.id}`);
  };

  return (
    <StudioModal open={open} onClose={onClose} title="Assessment Builder">
      <p className="mb-5 text-sm text-navy-700/70">
        Build a quiz, exit ticket, or study guide with an answer key already filled in for the
        question types we can auto-grade.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="ab-topic">
            What&apos;s this assessing?
          </label>
          <input
            id="ab-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. The Water Cycle"
            className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="ab-subject">
              Subject
            </label>
            <input
              id="ab-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Science"
              className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-800" htmlFor="ab-grade">
              Grade level
            </label>
            <input
              id="ab-grade"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g. 5th grade"
              className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
          </div>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-navy-800">Format</span>
          <div className="grid grid-cols-3 gap-2">
            {ASSESSMENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setOutputType(type.value)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  outputType === type.value
                    ? "border-teal-500 bg-teal-50 text-teal-800"
                    : "border-navy-900/10 bg-white text-navy-700 hover:border-teal-400/60"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-navy-950 transition hover:bg-amber-400"
        >
          Build assessment
        </button>
      </form>
    </StudioModal>
  );
}
