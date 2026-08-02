"use client";

import SlideRenderer from "@/components/slider/SlideRenderer";
import { getTheme } from "@/lib/sliderThemes";
import type { Slide } from "@/lib/sliderTypes";
import BeatPreview from "@/components/reel/BeatPreview";
import { buildBeatFromSlots, type ReelSlotSource } from "@/lib/reelBeatSlots";
import GradingReport from "@/components/margins/GradingReport";
import AnnotatedEssay from "@/components/margins/AnnotatedEssay";
import type { EssayAnnotation } from "@/lib/marginsAnnotations";

interface KoraSlide {
  layout: Slide["layout"];
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  columns?: [string, string] | string[];
  quoteText?: string;
  quoteAttribution?: string;
  notes?: string;
}

interface RubricCriterion {
  category: string;
  points_possible: number;
  description: string;
}

interface NotesheetSection {
  type: string;
  heading?: string;
  content: string;
  student_prompt: string;
  num_lines?: number;
}

function NotesheetPreview({
  output,
}: {
  output: { title: string; learning_objective: string; sections: NotesheetSection[] };
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm font-semibold text-navy-900">{output.title}</p>
      <p className="text-[13px] italic text-navy-700/60">{output.learning_objective}</p>
      {output.sections.map((s, i) => (
        <div key={i} className="rounded-lg border border-navy-900/8 bg-cream-50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">
            {s.type}
            {s.heading ? ` — ${s.heading}` : ""}
          </p>
          <p className="mt-1 text-[13px] text-navy-700/80">{s.student_prompt}</p>
        </div>
      ))}
    </div>
  );
}

function AssignmentPreview({
  output,
}: {
  output: { essay_type: string; title: string; prompt_text: string; suggested_document_topics?: string[] };
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/50">{output.essay_type}</p>
      <p className="text-sm font-semibold text-navy-900">{output.title}</p>
      <p className="text-[13px] text-navy-700/80">{output.prompt_text}</p>
      {output.suggested_document_topics && output.suggested_document_topics.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">Suggested document topics</p>
          <ul className="mt-1 list-disc pl-4 text-[13px] text-navy-700/70">
            {output.suggested_document_topics.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SliderDeckPreview({ output }: { output: { deck_title: string; theme_id: string; slides: KoraSlide[] } }) {
  const theme = getTheme(output.theme_id);
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm font-semibold text-navy-900">{output.deck_title}</p>
      <div className="flex flex-col gap-3">
        {output.slides.map((s, i) => (
          <SlideRenderer
            key={i}
            slide={{
              id: String(i),
              layout: s.layout,
              title: s.title,
              subtitle: s.subtitle,
              body: s.body,
              bullets: s.bullets,
              columns: s.columns ? ([s.columns[0], s.columns[1]] as [string, string]) : undefined,
              image: null,
              quoteText: s.quoteText,
              quoteAttribution: s.quoteAttribution,
              notes: s.notes,
            }}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}

function ReelScriptPreview({ output }: { output: { title: string; beats: ReelSlotSource[] } }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm font-semibold text-navy-900">{output.title}</p>
      <div className="flex flex-col gap-3">
        {output.beats.map((b, i) => (
          <BeatPreview key={i} beat={buildBeatFromSlots(b, String(i))} />
        ))}
      </div>
    </div>
  );
}

interface RubricBreakdownRow {
  category: string;
  points_earned: number;
  points_possible: number;
  justification: string;
}

interface NextStep {
  issue: string;
  why_it_matters: string;
  how_to_fix: string;
  skill: string;
}

interface EssayEvalOutput {
  essay_type: string;
  overall_score: number;
  max_score: number;
  rubric_breakdown: RubricBreakdownRow[];
  annotations: EssayAnnotation[];
  overall_feedback: string;
  strengths: string[];
  next_steps: NextStep[];
}

function GradePreview({ output, essayText }: { output: EssayEvalOutput; essayText: string }) {
  return (
    <div className="flex flex-col gap-4">
      <GradingReport
        overallScore={output.overall_score}
        maxScore={output.max_score}
        rubricBreakdown={output.rubric_breakdown}
        overallFeedback={output.overall_feedback}
        strengths={output.strengths}
        nextSteps={output.next_steps}
        essayType={output.essay_type}
        viewerRole="teacher"
      />
      <AnnotatedEssay essayText={essayText} annotations={output.annotations} />
    </div>
  );
}

interface RevisionStep {
  based_on_issue: string;
  restatement: string;
  guiding_question: string;
  scaffold: string;
  hint: string;
}

function RevisionPlanPreview({ output }: { output: { steps: RevisionStep[] } }) {
  return (
    <div className="flex flex-col gap-3">
      {output.steps.map((s, i) => (
        <div key={i} className="rounded-lg border border-navy-900/8 bg-cream-50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">{s.based_on_issue}</p>
          <p className="mt-1 text-[13px] font-semibold text-navy-900">{s.restatement}</p>
          <p className="mt-1 text-[13px] text-navy-700/80">{s.guiding_question}</p>
          <p className="mt-1 text-[13px] italic text-navy-700/60">{s.scaffold}</p>
          <p className="mt-1 text-[12px] text-navy-700/50">Hint: {s.hint}</p>
        </div>
      ))}
    </div>
  );
}

function RubricPreview({ output }: { output: { essay_type: string; criteria: RubricCriterion[] } }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/50">{output.essay_type} rubric</p>
      {output.criteria.map((c, i) => (
        <div key={i} className="rounded-lg border border-navy-900/8 bg-cream-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-navy-900">{c.category}</p>
            <span className="shrink-0 text-xs font-bold text-teal-700">
              {c.points_possible} pt{c.points_possible === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-navy-700/70">{c.description}</p>
        </div>
      ))}
    </div>
  );
}

// Renders a candidate output using a real task-specific preview when one
// exists; falls back to a readable JSON dump for tasks not yet wired up.
export default function KoraCandidatePane({
  taskType,
  label,
  config,
  output,
  inputContext,
}: {
  taskType: string;
  label: string;
  config: { model?: string; thinking?: boolean; label?: string; systemPromptOverride?: string };
  output: unknown;
  inputContext?: Record<string, unknown>;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-navy-900/8 bg-white p-4">
      <div className="flex items-center justify-between gap-2 border-b border-navy-900/8 pb-2">
        <p className="text-sm font-bold text-navy-900">{label}</p>
        <p className="text-[11px] text-navy-700/50">
          {config.model ?? "default"}
          {config.thinking ? " · thinking" : ""}
          {config.label ? ` · ${config.label}` : ""}
        </p>
      </div>
      {taskType === "margins_rubric" && output ? (
        <RubricPreview output={output as { essay_type: string; criteria: RubricCriterion[] }} />
      ) : taskType === "notesheet_generate" && output ? (
        <NotesheetPreview
          output={output as { title: string; learning_objective: string; sections: NotesheetSection[] }}
        />
      ) : taskType === "margins_assignment" && output ? (
        <AssignmentPreview
          output={
            output as { essay_type: string; title: string; prompt_text: string; suggested_document_topics?: string[] }
          }
        />
      ) : taskType === "slider_build" && output ? (
        <SliderDeckPreview output={output as { deck_title: string; theme_id: string; slides: KoraSlide[] }} />
      ) : taskType === "reel_build" && output ? (
        <ReelScriptPreview output={output as { title: string; beats: ReelSlotSource[] }} />
      ) : taskType === "margins_grade" && output ? (
        <GradePreview output={output as EssayEvalOutput} essayText={(inputContext?.essayText as string) ?? ""} />
      ) : taskType === "margins_revision_coach" && output ? (
        <RevisionPlanPreview output={output as { steps: RevisionStep[] }} />
      ) : (
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-navy-900/5 p-3 text-[11px] text-navy-700">
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}
