"use client";

import { useEffect, useState } from "react";

type Assignment = {
  assignmentId: string;
  title: string;
  questions: Array<{ id: string; questionText: string; choices: string[]; correctAnswer: string; skill: string }>;
};
type Attempt = { id: string; answers: Record<string, string>; status: string };
type Remediation = { state: { currentQuestionId: string | null; stage: string } };
type Submitted = {
  attempt: Attempt;
  remediation: Remediation;
  originalScore: { score: number; maxScore: number };
};
type Props = { assignmentId: string };

export default function LearningLabStudent({ assignmentId }: Props) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [reason, setReason] = useState("");
  const [coach, setCoach] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const a = await fetch(`/api/margins/learning-lab/assignments?assignmentId=${assignmentId}`);
      const data = await a.json();
      if (!a.ok) return setError(data.error ?? "Assignment unavailable.");
      setAssignment(data.assignment);
    })();
  }, [assignmentId]);

  async function saveOrSubmit(submit: boolean) {
    const response = await fetch(`/api/margins/learning-lab/assignments/${assignmentId}/assessment`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers, submit })
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error ?? "Could not save assessment.");
    if (submit) setSubmitted(data); else setAttempt(data.attempt);
  }

  async function sendReason() {
    if (!submitted?.remediation?.state?.currentQuestionId || !reason.trim()) return;
    const stage = submitted.remediation.state.stage;
    const nextStage = stage === "revisit" ? "ask_why" : stage === "ask_why" ? "diagnose" : stage === "diagnose" ? "teach" : stage === "teach" ? "practice" : stage === "practice" ? "verify" : "continue";
    const response = await fetch(`/api/margins/learning-lab/assessments/${submitted.attempt.id}/remediation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        questionId: submitted.remediation.state.currentQuestionId,
        studentMessage: reason,
        proposal: {
          message: nextStage === "ask_why" ? "What made that answer seem right?" : nextStage === "diagnose" ? "Let’s name the idea your answer was using." : "Now try a fresh example using the next-best alternative.",
          nextStage,
          evidence: [reason],
          supportUsed: nextStage === "teach" ? "opportunity-cost comparison" : undefined,
          status: nextStage === "verify" ? "demonstrated_with_support" : undefined
        }
      })
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error ?? "Could not save your reasoning.");
    setSubmitted((current) => current ? ({ ...current, remediation: data.remediation }) : current);
    setCoach(data.evidence?.evidence?.tutorMessage ?? "Your reasoning was saved.");
    setReason("");
  }

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!assignment) return <p className="text-sm text-stone-500">Loading assignment…</p>;

  return (
    <section className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600">Practice &amp; Relearn</p>
      <h1 className="mt-2 text-xl font-bold text-stone-900">{assignment.title}</h1>
      {!submitted ? (
        <>
          {assignment.questions.map((q) => (
            <fieldset key={q.id} className="mt-6">
              <legend className="font-medium text-stone-800">{q.questionText}</legend>
              <div className="mt-3 flex flex-col gap-2">
                {q.choices.map((choice) => (
                  <label key={choice} className="flex gap-2 rounded-lg border border-stone-200 p-3 text-sm">
                    <input type="radio" name={q.id} checked={answers[q.id] === choice} onChange={() => setAnswers({ ...answers, [q.id]: choice })} />
                    {choice}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="mt-5 flex gap-2">
            <button onClick={() => saveOrSubmit(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">Save and resume</button>
            <button onClick={() => saveOrSubmit(true)} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Submit assessment</button>
          </div>
          {attempt && <p className="mt-2 text-xs text-stone-400">Saved. You can safely leave and resume later.</p>}
        </>
      ) : (
        <>
          <p className="mt-4 rounded-xl bg-stone-50 p-4 text-sm text-stone-700">Original score: <strong>{submitted.originalScore.score}/{submitted.originalScore.maxScore}</strong></p>
          {submitted.remediation.state.currentQuestionId ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Stage: {submitted.remediation.state.stage.replace("_", " ")}</p>
              <p className="mt-2 text-sm text-stone-700">Tell the tutor what made your answer seem right. “I guessed” is a useful answer.</p>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-3 w-full rounded-lg border border-stone-200 p-3 text-sm" />
              <button onClick={sendReason} className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Continue with tutor</button>
              {coach && <p className="mt-4 rounded-xl bg-violet-50 p-4 text-sm text-violet-900">{coach}</p>}
            </div>
          ) : <p className="mt-5 text-sm text-emerald-700">No missed questions. You demonstrated the skill independently.</p>}
        </>
      )}
    </section>
  );
}

