"use client";

import { useState } from "react";

type Props = { classes: Array<{ id: string; name: string }> };

const example = JSON.stringify([{
  id: "opportunity-cost-1",
  questionText: "A student spends an afternoon studying instead of working a paid shift. What is the opportunity cost?",
  choices: ["The value of the next-best alternative given up", "The time spent studying", "The wage already earned", "The total number of choices"],
  correctAnswer: "The value of the next-best alternative given up",
  pointValue: 1,
  standard: "ECO-1",
  skill: "opportunity_cost",
  explanation: "Opportunity cost is the value of the next-best alternative forgone.",
  distractorExplanations: {},
  prerequisiteSkills: [],
  materialRefs: []
  ,freshPractice: {
    questionText: "A café stays open one extra hour instead of closing. What should the owner compare first?",
    choices: ["The next-best use of the café's resources", "Every possible future business", "Only the money already spent", "The number of customers from yesterday"],
    correctAnswer: "The next-best use of the café's resources"
  }
}], null, 2);

export default function LearningLabAuthor({ classes }: Props) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [title, setTitle] = useState("Opportunity Cost: Practice & Relearn");
  const [questions, setQuestions] = useState(example);
  const [message, setMessage] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [aiMessage, setAiMessage] = useState("");

  async function buildWithAi(file?: File) {
    setAiMessage("KORA is turning your material into a teacher-reviewable assignment…");
    const form = new FormData();
    form.append("notes", notes);
    if (file) form.append("file", file);
    const response = await fetch("/api/margins/learning-lab/generate", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) return setAiMessage(data.error ?? "Could not build the assignment.");
    setTitle(data.assignment.title);
    setQuestions(JSON.stringify(data.assignment.questions, null, 2));
    setAiMessage(`Drafted ${data.assignment.questions.length} question${data.assignment.questions.length === 1 ? "" : "s"}. Review the draft, then publish.`);
  }

  async function previewCsv(file: File) {
    setImportMessage("Checking spreadsheet…");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/margins/learning-lab/import", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) return setImportMessage(data.error ?? "Could not read spreadsheet.");
    if (data.preview?.questions?.length) setQuestions(JSON.stringify(data.preview.questions, null, 2));
    setImportMessage(data.publishable
      ? `Imported ${data.preview.questions.length} question${data.preview.questions.length === 1 ? "" : "s"}. Review the JSON before publishing.`
      : data.preview.errors?.join(" ") ?? "Review the imported questions before publishing.");
  }

  async function publish() {
    setMessage("");
    try {
      const parsed = JSON.parse(questions);
      const response = await fetch("/api/margins/learning-lab/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classId,
          type: "practice_relearn",
          title,
          questions: parsed,
          context: {
            vocabulary: ["opportunity cost", "next-best alternative"],
            priorInstruction: ["Compare the choice made with the best alternative forgone."],
            workedExamples: ["Choosing a paid shift instead of studying."],
            prerequisiteKnowledge: ["Choices use scarce time and resources."],
            teacherMethods: ["Ask students to name the next-best alternative before revealing the answer."]
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not publish assignment.");
      setCreatedId(data.assignment.assignmentId);
      setMessage("Published. Students can now take this assignment.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Check the question JSON.");
    }
  }

  return (
    <section className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">Practice &amp; Relearn</p>
      <h2 className="mt-2 text-lg font-bold text-stone-900">Publish a first learning loop</h2>
      <p className="mt-1 text-sm text-stone-500">This starter fixture is editable JSON so the review contract is visible before spreadsheet import.</p>
      <label className="mt-4 block text-xs font-semibold text-stone-600">Class</label>
      <select value={classId} onChange={(e) => setClassId(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm">
        {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
      </select>
      <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
        <p className="text-sm font-semibold text-violet-900">Let KORA build the draft</p>
        <p className="mt-1 text-xs leading-relaxed text-violet-700">Paste your test, study guide, or teaching notes. You can also upload a PDF or photo. KORA will extract questions and create fresh practice, then you review before publishing.</p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Example: My students are learning opportunity cost…" className="mt-3 w-full rounded-xl border border-violet-200 bg-white p-3 text-sm" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && buildWithAi(e.target.files[0])} className="max-w-full text-xs text-violet-700" />
          <button onClick={() => buildWithAi()} disabled={!notes.trim()} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Build draft from notes</button>
        </div>
        {aiMessage && <p className="mt-2 text-xs text-violet-700">{aiMessage}</p>}
      </div>
      <label className="mt-4 block text-xs font-semibold text-stone-600">Or import a spreadsheet</label>
      <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && previewCsv(e.target.files[0])} className="mt-1 block w-full text-sm text-stone-500" />
      {importMessage && <p className="mt-2 text-xs text-stone-500">{importMessage}</p>}
      <label className="mt-5 block text-xs font-semibold text-stone-600">Assignment title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
      <details className="mt-5 rounded-xl border border-stone-100 bg-stone-50 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-stone-500">Advanced review (optional)</summary>
        <textarea value={questions} onChange={(e) => setQuestions(e.target.value)} rows={18} className="mt-3 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-mono text-xs" />
      </details>
      <button onClick={publish} className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">Publish assignment</button>
      {message && <p className="mt-3 text-sm text-stone-600">{message}</p>}
      {createdId && <p className="mt-1 break-all font-mono text-xs text-stone-400">Assignment ID: {createdId}</p>}
    </section>
  );
}

