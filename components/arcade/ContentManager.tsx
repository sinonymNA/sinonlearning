"use client";

/* eslint-disable react-hooks/immutability */

import { useEffect, useState } from "react";
import { api } from "./useRoom";
import { GAME_CATALOG } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Q = { q: string; choices: string[]; answer: number };
const EMPTY = { questions: [] as Q[], vocab: "", drawPrompts: "", telephonePrompts: "", imposterWords: "" };
const lines = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);

export default function ContentManager() {
  const [sets, setSets] = useState<any[]>([]);
  const [id, setId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [form, setForm] = useState<any>(EMPTY);
  const [compat, setCompat] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<Q>({ q: "", choices: ["", "", "", ""], answer: 0 });

  const load = () => api("/api/arcade/content", { type: "list" }).then((d) => setSets(d.sets));
  useEffect(() => { load(); }, []);

  const items = () => ({
    questions: form.questions, vocab: lines(form.vocab), drawPrompts: lines(form.drawPrompts), telephonePrompts: lines(form.telephonePrompts),
    imposterWords: lines(form.imposterWords).map((l) => { const [word, rel = ""] = l.split("|"); return { word: word.trim(), related: rel.split(/[;,]/).map((x) => x.trim()).filter(Boolean) }; }),
  });
  useEffect(() => { const t = setTimeout(() => api("/api/arcade/content", { type: "compat", items: safeItems() }).then((d) => setCompat(d.compatibility)).catch(() => setCompat(null)), 300); return () => clearTimeout(t);   }, [form]);
  function safeItems() { const it = items(); return { ...it, questions: it.questions.filter((q: Q) => q.q.length >= 5) }; }

  async function open(sid: string) {
    const d = await api("/api/arcade/content", { type: "get", id: sid });
    const s = d.set; setId(s.builtin ? undefined : s.id); setTitle(s.builtin ? "My copy of the starter pack" : s.title);
    setForm({ questions: s.items.questions, vocab: s.items.vocab.join("\n"), drawPrompts: s.items.drawPrompts.join("\n"), telephonePrompts: s.items.telephonePrompts.join("\n"), imposterWords: s.items.imposterWords.map((w: any) => `${w.word} | ${w.related.join("; ")}`).join("\n") });
  }
  async function save() {
    try { const d = await api("/api/arcade/content", { type: "save", id, title, items: items() }); setId(d.id); setMsg("Saved!"); load(); } catch (e: any) { setMsg(e.message); }
  }
  async function csv(kind: string, file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    try {
      const d = await api("/api/arcade/content", { type: "import_csv", kind, text });
      if (kind === "questions") setForm((f: any) => ({ ...f, questions: [...f.questions, ...d.items] }));
      else if (kind === "imposterWords") setForm((f: any) => ({ ...f, imposterWords: [f.imposterWords, ...d.items.map((w: any) => `${w.word} | ${w.related.join("; ")}`)].filter(Boolean).join("\n") }));
      else setForm((f: any) => ({ ...f, [kind]: [f[kind], ...d.items].filter(Boolean).join("\n") }));
      setMsg(`Imported ${d.items.length} items${d.errors.length ? `. ${d.errors.length} problems: ${d.errors.slice(0, 3).join(" ")}` : ""}`);
    } catch (e: any) { setMsg(e.message); }
  }
  const area = (key: string, label: string, hint: string) => (
    <label className="grid gap-1 font-bold">{label}<span className="text-sm font-medium opacity-70">{hint}</span>
      <textarea className="ar-input" style={{ minHeight: 120, fontSize: "1rem" }} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      <span className="flex items-center gap-2 text-sm font-medium">CSV import: <input type="file" accept=".csv,.txt" onChange={(e) => csv(key, e.target.files?.[0])} /></span></label>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <aside className="ar-panel grid content-start gap-2"><h2 className="font-bold">Your sets</h2>
        <button className="ar-btn sm mint" onClick={() => { setId(undefined); setTitle(""); setForm(EMPTY); }}>+ New set</button>
        {sets.map((s) => <button key={s.id} className="ar-btn sm paper" style={{ justifyContent: "flex-start" }} onClick={() => open(s.id)}>{s.builtin ? "⭐ " : ""}{s.title}</button>)}
        <button className="ar-btn sm coral" disabled={!id} onClick={async () => { if (id && confirm("Delete this set?")) { await api("/api/arcade/content", { type: "delete", id }); setId(undefined); setTitle(""); setForm(EMPTY); load(); } }}>Delete this set</button></aside>
      <div className="grid gap-4">
        <div className="ar-panel grid gap-3"><label className="grid gap-1 font-bold">Set title<input className="ar-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit 4 Review" /></label>
          {compat && <div className="flex flex-wrap gap-2" aria-label="Compatibility">{Object.entries(compat).map(([g, v]: any) => <span key={g} className="ar-pill" style={{ background: v.ok ? "rgba(47,209,165,.3)" : "rgba(255,255,255,.1)" }}>{GAME_CATALOG[g].icon} {GAME_CATALOG[g].name}: {v.ok ? `ready (${v.count})` : `needs ${v.need}+ ${v.label} (${v.count})`}</span>)}</div>}</div>
        <div className="ar-panel grid gap-3"><h2 className="ar-h2">⚡ Multiple-choice questions <span className="ar-muted text-base">(Last One Standing)</span></h2>
          <div className="ar-card grid gap-2"><input className="ar-input" placeholder="Question" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
            {draft.choices.map((c, i) => <div key={i} className="flex items-center gap-2"><input type="radio" name="correct" checked={draft.answer === i} onChange={() => setDraft({ ...draft, answer: i })} aria-label={`Choice ${i + 1} is correct`} /><input className="ar-input" placeholder={`Choice ${"ABCD"[i]}${i < 2 ? "" : " (optional)"}`} value={c} onChange={(e) => setDraft({ ...draft, choices: draft.choices.map((x, j) => (j === i ? e.target.value : x)) })} /></div>)}
            <button className="ar-btn sm mint" onClick={() => { const choices = draft.choices.filter((c) => c.trim()); const answer = draft.choices.slice(0, draft.answer).filter((c) => c.trim()).length; if (draft.q.trim().length >= 5 && choices.length >= 2 && draft.choices[draft.answer].trim()) { setForm({ ...form, questions: [...form.questions, { q: draft.q, choices, answer }] }); setDraft({ q: "", choices: ["", "", "", ""], answer: 0 }); setMsg(null); } else setMsg("A question needs text, at least two choices, and a marked correct choice."); }}>Add question</button></div>
          <ul className="grid max-h-60 gap-1 overflow-auto">{form.questions.map((q: Q, i: number) => <li key={i} className="lb-row"><span className="flex-1">{q.q} <span className="ar-muted">→ {q.choices[q.answer]}</span></span><button className="ar-btn sm coral" style={{ minHeight: 28 }} onClick={() => setForm({ ...form, questions: form.questions.filter((_: any, j: number) => j !== i) })}>✕</button></li>)}</ul>
          <span className="flex items-center gap-2 text-sm">CSV (question,choiceA,choiceB,choiceC,choiceD,correct A-D): <input type="file" accept=".csv,.txt" onChange={(e) => csv("questions", e.target.files?.[0])} /></span></div>
        <div className="ar-panel grid gap-4 md:grid-cols-2">
          {area("vocab", "🥔 Vocabulary words (Hot Potato)", "One per line. Class words appear as letter prompts and earn bonus points.")}
          {area("drawPrompts", "🎨 Drawing prompts (Quick Draw)", "One per line, things that can be drawn.")}
          {area("telephonePrompts", "☎️ Telephone prompts", "Short silly or topic phrases, one per line.")}
          {area("imposterWords", "🕵️ Secret words (Imposter)", "WORD | related; concepts; used by bots. One per line.")}
        </div>
        <div className="flex flex-wrap items-center gap-3"><button className="ar-btn coral xl" onClick={save} disabled={title.trim().length < 2}>Save set</button><span role="status" className="font-bold text-[var(--sun)]">{msg}</span></div>
      </div>
    </div>
  );
}
