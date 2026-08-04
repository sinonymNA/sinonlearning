"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Eye, Plus, Save, Trash2 } from "lucide-react";
import type { ApwhClassProfile, ApwhDispatch } from "@/lib/apwhDb";

export default function DispatchEditor({
  classId,
  profile,
  dispatch,
  today,
}: {
  classId: string;
  profile: ApwhClassProfile;
  dispatch: ApwhDispatch | null;
  today: string;
}) {
  const [schoolDate, setSchoolDate] = useState(dispatch?.school_date ?? today);
  const [eyebrow, setEyebrow] = useState(dispatch?.eyebrow ?? "TODAY IN AP WORLD");
  const [title, setTitle] = useState(dispatch?.title ?? "What changed—and what stayed the same?");
  const [objective, setObjective] = useState(dispatch?.objective ?? "I can use specific historical evidence to explain a meaningful change over time.");
  const [agenda, setAgenda] = useState<string[]>(dispatch?.agenda?.length ? dispatch.agenda : ["Retrieval warm-up", "Mini lesson and source analysis", "Write one defensible claim"]);
  const [announcement, setAnnouncement] = useState(dispatch?.announcement ?? "");
  const [startLabel, setStartLabel] = useState(dispatch?.start_label ?? "Begin today's work");
  const [startHref, setStartHref] = useState(dispatch?.start_href ?? "/margins/student/practice");
  const [courseTitle, setCourseTitle] = useState(profile.course_title);
  const [periodLabel, setPeriodLabel] = useState(profile.period_label);
  const [currentUnit, setCurrentUnit] = useState(profile.current_unit);
  const [schoolYear, setSchoolYear] = useState(profile.school_year);
  const [examDate, setExamDate] = useState(profile.exam_date ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  function updateAgenda(index: number, value: string) {
    setAgenda((items) => items.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setState("saving");
    setError("");
    try {
      const response = await fetch(`/api/apwh/classes/${classId}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolDate, eyebrow, title, objective,
          agenda: agenda.map((item) => item.trim()).filter(Boolean),
          announcement, startLabel, startHref, courseTitle, periodLabel,
          currentUnit, schoolYear, examDate: examDate || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save the dispatch.");
      setState("saved");
      window.setTimeout(() => setState("idle"), 2400);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save.");
      setState("error");
    }
  }

  return (
    <form className="apwh-editor" onSubmit={save}>
      <div className="apwh-editor-toolbar">
        <div><span>DAILY DISPATCH EDITOR</span><h1>Build tomorrow&apos;s front page.</h1></div>
        <div>
          <Link href={`/apwh/classes/${classId}?preview=student`} className="apwh-secondary-button"><Eye size={16} /> Student demo</Link>
          <button className="apwh-primary-button" disabled={state === "saving"}>
            {state === "saved" ? <Check size={18} /> : <Save size={18} />}
            {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Publish dispatch"}
          </button>
        </div>
      </div>
      {error && <p className="apwh-form-error" role="alert">{error}</p>}

      <div className="apwh-editor-grid">
        <section className="apwh-editor-paper">
          <p className="apwh-editor-section-number">01 · TODAY&apos;S STORY</p>
          <div className="apwh-editor-row two">
            <label><span>School date</span><input type="date" value={schoolDate} onChange={(e) => setSchoolDate(e.target.value)} required /></label>
            <label><span>Small heading</span><input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} maxLength={60} required /></label>
          </div>
          <label><span>Big historical question</span><textarea className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} required /></label>
          <label><span>Learning objective</span><textarea value={objective} onChange={(e) => setObjective(e.target.value)} maxLength={500} /></label>

          <p className="apwh-editor-section-number">02 · THE ROUTE</p>
          <div className="apwh-agenda-editor">
            {agenda.map((item, index) => (
              <div key={index}><span>{String(index + 1).padStart(2, "0")}</span><input value={item} onChange={(e) => updateAgenda(index, e.target.value)} maxLength={240} /><button type="button" onClick={() => setAgenda((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove agenda item ${index + 1}`}><Trash2 size={15} /></button></div>
            ))}
            {agenda.length < 8 && <button type="button" className="apwh-add-row" onClick={() => setAgenda((items) => [...items, ""])}><Plus size={15} /> Add a step</button>}
          </div>

          <p className="apwh-editor-section-number">03 · START BUTTON</p>
          <div className="apwh-editor-row two">
            <label><span>Button label</span><input value={startLabel} onChange={(e) => setStartLabel(e.target.value)} maxLength={80} required /></label>
            <label><span>Internal route</span><input value={startHref} onChange={(e) => setStartHref(e.target.value)} maxLength={300} required placeholder="/margins/student/practice" /></label>
          </div>
          <label><span>Teacher announcement · optional</span><textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} maxLength={500} placeholder="A short note students should see today…" /></label>
        </section>

        <aside className="apwh-editor-settings">
          <p className="apwh-editor-section-number">CLASS PLACARD</p>
          <label><span>Course title</span><input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} maxLength={100} required /></label>
          <label><span>Period</span><input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} maxLength={60} placeholder="2nd Period" /></label>
          <label><span>Current unit</span><input value={currentUnit} onChange={(e) => setCurrentUnit(e.target.value)} maxLength={120} required /></label>
          <label><span>School year</span><input value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} maxLength={20} required /></label>
          <label><span>AP exam date · optional</span><input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} /></label>
          <div className="apwh-editor-tip"><strong>Keep it singular.</strong><p>Students should be able to tell what to do first within five seconds of opening the page.</p></div>
        </aside>
      </div>
    </form>
  );
}
