"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import StudioModal from "./StudioModal";
import CometCharacter from "./CometCharacter";
import { generateProjectDraft } from "@/lib/studioGenerator";
import { saveProject } from "@/lib/studioStorage";
import { applyQuickAction, QUICK_ACTIONS } from "@/lib/studioTransforms";
import { computeQualityChecklist } from "@/lib/studioChecklist";
import { STUDIO_DOC_TYPES } from "@/lib/studioTypes";
import type {
  CometBuildAnswers,
  InstructionalStyle,
  PrimaryActivity,
  TeacherStudioProject,
} from "@/lib/studioTypes";

interface CometBuildFlowProps {
  open: boolean;
  onClose: () => void;
}

type Phase = "questions" | "building" | "done";

const PRIMARY_ACTIVITY_OPTIONS: { value: PrimaryActivity; label: string }[] = [
  { value: "learn", label: "Learn something new" },
  { value: "practice", label: "Practice a skill" },
  { value: "discuss", label: "Discuss ideas" },
  { value: "analyze", label: "Analyze something" },
  { value: "simulate", label: "Simulate a scenario" },
  { value: "review", label: "Review for a test" },
  { value: "apply", label: "Apply knowledge" },
];

const INSTRUCTIONAL_STYLE_OPTIONS: { value: InstructionalStyle; label: string }[] = [
  { value: "direct", label: "Direct instruction" },
  { value: "inquiry", label: "Inquiry-based" },
  { value: "gameBased", label: "Game-based" },
  { value: "discussion", label: "Discussion-driven" },
  { value: "project", label: "Project-based" },
  { value: "balanced", label: "A balanced mix" },
];

const BUILD_STEPS = [
  "Choosing a lesson structure…",
  "Drafting your slides…",
  "Writing the practice questions…",
  "Building your teacher guide…",
  "Running the quality checklist…",
];

const FEATURED_QUICK_ACTION_IDS = ["addExitTicket", "addDiscussionQuestions", "addImagePlaceholders"];

const DEFAULT_ANSWERS: CometBuildAnswers = {
  topic: "",
  subject: "",
  gradeLevel: "",
  classMinutes: 50,
  primaryActivity: "learn",
  outputType: "lesson",
  instructionalStyle: "balanced",
};

const TOTAL_QUESTIONS = 7;

export default function CometBuildFlow({ open, onClose }: CometBuildFlowProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("questions");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<CometBuildAnswers>(DEFAULT_ANSWERS);
  const [project, setProject] = useState<TeacherStudioProject | null>(null);
  const [buildStepIndex, setBuildStepIndex] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets local form state when the modal closes
      setPhase("questions");
      setQuestionIndex(0);
      setAnswers(DEFAULT_ANSWERS);
      setProject(null);
      setBuildStepIndex(0);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    }
  }, [open]);

  useEffect(() => {
    if (phase !== "building") return;
    const draft = generateProjectDraft(answers);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- generation is synchronous local logic, not derivable during render
    setProject(draft);
    BUILD_STEPS.forEach((_, i) => {
      const timer = setTimeout(() => {
        setBuildStepIndex(i + 1);
        if (i === BUILD_STEPS.length - 1) {
          setPhase("done");
        }
      }, (i + 1) * 700);
      timers.current.push(timer);
    });
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once when entering the building phase
  }, [phase]);

  const isLastQuestion = questionIndex === TOTAL_QUESTIONS - 1;

  const canAdvance = (() => {
    switch (questionIndex) {
      case 0:
        return answers.topic.trim().length > 0;
      default:
        return true;
    }
  })();

  const handleNext = () => {
    if (isLastQuestion) {
      setPhase("building");
      return;
    }
    setQuestionIndex((i) => i + 1);
  };

  const handleBack = () => {
    setQuestionIndex((i) => Math.max(0, i - 1));
  };

  const handleRefine = (actionId: string) => {
    if (!project) return;
    const updated = applyQuickAction(project, actionId);
    updated.qualityChecklist = computeQualityChecklist(updated);
    setProject(updated);
  };

  const handleOpen = () => {
    if (!project) return;
    saveProject(project);
    onClose();
    router.push(`/studio/${project.id}`);
  };

  return (
    <StudioModal open={open} onClose={onClose} title="Build with Comet" maxWidthClassName="max-w-xl">
      <div className="flex items-start gap-4">
        <CometCharacter size={56} mood={phase === "done" ? "excited" : "thinking"} />
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {phase === "questions" && (
              <motion.div
                key={questionIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-2xl rounded-tl-sm bg-teal-50 px-4 py-3"
              >
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-teal-700/70">
                  Question {questionIndex + 1} of {TOTAL_QUESTIONS}
                </p>
                <QuestionField
                  index={questionIndex}
                  answers={answers}
                  onChange={(patch) => setAnswers((a) => ({ ...a, ...patch }))}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {phase === "building" && (
            <div className="rounded-2xl rounded-tl-sm bg-teal-50 px-4 py-3">
              <p className="mb-3 text-sm font-medium text-navy-800">Building your draft locally…</p>
              <ul className="space-y-1.5">
                {BUILD_STEPS.map((step, i) => (
                  <li
                    key={step}
                    className={`flex items-center gap-2 text-sm transition ${
                      i < buildStepIndex ? "text-teal-800" : "text-navy-700/40"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        i < buildStepIndex ? "bg-teal-500" : "bg-navy-900/15"
                      }`}
                    />
                    {step}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-navy-700/50">
                Built from your answers using local templates — no live AI call.
              </p>
            </div>
          )}

          {phase === "done" && project && (
            <div className="rounded-2xl rounded-tl-sm bg-teal-50 px-4 py-3">
              <p className="mb-2 text-sm font-medium text-navy-800">Your draft is ready: {project.title}</p>
              <ul className="mb-3 max-h-32 space-y-1 overflow-y-auto text-sm text-navy-700/70">
                {project.slides.map((slide) => (
                  <li key={slide.id}>• {slide.title}</li>
                ))}
                {project.worksheetSections.map((section) => (
                  <li key={section.id}>• {section.title} ({section.questions.length} questions)</li>
                ))}
              </ul>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-700/50">
                Refine before you open it
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                {FEATURED_QUICK_ACTION_IDS.map((id) => {
                  const action = QUICK_ACTIONS.find((a) => a.id === id);
                  if (!action) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleRefine(id)}
                      className="rounded-full border border-teal-300 bg-white px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-100"
                    >
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {phase === "questions" && (
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={questionIndex === 0}
            className="rounded-full px-4 py-2 text-sm font-medium text-navy-700/60 disabled:opacity-30"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance}
            className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-amber-400 disabled:opacity-40"
          >
            {isLastQuestion ? "Build my draft" : "Next"}
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleOpen}
            className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-amber-400"
          >
            Open in Studio
          </button>
        </div>
      )}
    </StudioModal>
  );
}

function QuestionField({
  index,
  answers,
  onChange,
}: {
  index: number;
  answers: CometBuildAnswers;
  onChange: (patch: Partial<CometBuildAnswers>) => void;
}) {
  switch (index) {
    case 0:
      return (
        <Field label="What's today's topic?">
          <input
            autoFocus
            value={answers.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
            placeholder="e.g. The Civil War"
            className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          />
        </Field>
      );
    case 1:
      return (
        <Field label="What subject is this for?">
          <input
            value={answers.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
            placeholder="e.g. Social Studies"
            className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          />
        </Field>
      );
    case 2:
      return (
        <Field label="What grade level?">
          <input
            value={answers.gradeLevel}
            onChange={(e) => onChange({ gradeLevel: e.target.value })}
            placeholder="e.g. 8th grade"
            className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          />
        </Field>
      );
    case 3:
      return (
        <Field label="How long is class?">
          <input
            type="number"
            min={10}
            max={180}
            value={answers.classMinutes}
            onChange={(e) => onChange({ classMinutes: Number(e.target.value) || 50 })}
            className="w-full rounded-xl border border-navy-900/15 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          />
        </Field>
      );
    case 4:
      return (
        <Field label="What should students mainly do?">
          <OptionGrid
            options={PRIMARY_ACTIVITY_OPTIONS}
            value={answers.primaryActivity}
            onSelect={(value) => onChange({ primaryActivity: value })}
          />
        </Field>
      );
    case 5:
      return (
        <Field label="What format do you need?">
          <OptionGrid
            options={STUDIO_DOC_TYPES}
            value={answers.outputType}
            onSelect={(value) => onChange({ outputType: value })}
          />
        </Field>
      );
    case 6:
      return (
        <Field label="What teaching style fits best?">
          <OptionGrid
            options={INSTRUCTIONAL_STYLE_OPTIONS}
            value={answers.instructionalStyle}
            onSelect={(value) => onChange({ instructionalStyle: value })}
          />
        </Field>
      );
    default:
      return null;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-navy-900">{label}</p>
      {children}
    </div>
  );
}

function OptionGrid<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: { value: T; label: string }[];
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto pr-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
            value === option.value
              ? "border-teal-500 bg-teal-100 text-teal-800"
              : "border-navy-900/10 bg-white text-navy-700 hover:border-teal-400/60"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
