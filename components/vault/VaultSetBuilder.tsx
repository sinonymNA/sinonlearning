"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardPaste, Link2, LoaderCircle, Play, ShieldAlert } from "lucide-react";
import { VAULT_CUSTOM_SET_KEY, type VaultCustomSet, type VaultQuestion } from "@/lib/vaultGame";

const SAMPLE = `What is the largest planet in our solar system?\tJupiter\tEarth\tSaturn\tMars\tJupiter is the largest planet by both mass and volume.\tDo not confuse the largest rocky planet with the largest planet overall.
Which process converts light energy into chemical energy?\tPhotosynthesis\tRespiration\tFermentation\tTranspiration\tPhotosynthesis captures light energy and stores it in sugars.\tDo not mix up energy storage with the process that releases energy from food.
What is 15% of 200?\t30\t15\t20\t45\tConvert 15% to 0.15, then multiply by 200.\tDo not treat the percent as a whole number instead of a fraction of 100.`;

function parseRows(raw: string, title: string): { set?: VaultCustomSet; errors: string[] } {
  const errors: string[] = [];
  const questions: VaultQuestion[] = [];
  raw.split(/\r?\n/).map((row) => row.trim()).filter(Boolean).forEach((row, index) => {
    const cells = row.split("\t").map((cell) => cell.trim());
    if (cells.length < 5 || cells.slice(0, 5).some((cell) => !cell)) {
      errors.push(`Row ${index + 1}: include a question, correct answer, and three wrong answers.`);
      return;
    }
    const [prompt, correct, wrong1, wrong2, wrong3, explanation, misconception] = cells;
    questions.push({ id: `custom-${index + 1}`, subject: title.trim() || "Custom Set", concept: `Question ${index + 1}`, prompt, choices: [correct, wrong1, wrong2, wrong3], answer: 0, explanation: explanation || `${correct} is correct.`, misconception: misconception || "Read the question closely and compare each option to the central idea.", repairPrompt: "Which answer correctly completes the original idea?", repairChoices: [correct, wrong1], repairAnswer: 0 });
  });
  if (questions.length < 3) errors.push("Add at least three valid questions for a descent.");
  return errors.length ? { errors } : { set: { title: title.trim() || "My Vault Set", questions }, errors };
}

export default function VaultSetBuilder() {
  const [title, setTitle] = useState("My Review Set");
  const [raw, setRaw] = useState("");
  const [saved, setSaved] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const parsed = useMemo(() => parseRows(raw, title), [raw, title]);
  const change = (next: string, setter: (value: string) => void) => { setter(next); setSaved(false); setShareUrl(null); setPublishError(""); };

  function saveSet() {
    if (!parsed.set) return;
    localStorage.setItem(VAULT_CUSTOM_SET_KEY, JSON.stringify(parsed.set));
    setSaved(true);
  }

  async function publishSet() {
    if (!parsed.set) return;
    saveSet(); setPublishing(true); setPublishError("");
    try {
      const response = await fetch("/api/vault/sets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.set) });
      const data = await response.json() as { vaultSet?: { id: string }; error?: string };
      if (!response.ok || !data.vaultSet) throw new Error(data.error || "The set could not be published.");
      const url = `${window.location.origin}/vault?set=${data.vaultSet.id}`;
      setShareUrl(url);
      try { await navigator.clipboard.writeText(url); } catch { /* The selectable link remains available. */ }
    } catch (error) { setPublishError(error instanceof Error ? error.message : "The set could not be published."); }
    finally { setPublishing(false); }
  }

  return <main className="min-h-screen bg-[#07100f] text-[#f4eedc]">
    <header className="flex h-16 items-center justify-between border-b border-[#ddc98b]/10 px-5 md:px-8"><Link href="/vault" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#c8b98d]"><ArrowLeft size={14}/> The Vault</Link><p className="font-display text-lg font-black tracking-[.08em]">SET FORGE</p><span className="text-[10px] uppercase tracking-wider text-white/25">Teacher tool</span></header>
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_360px] lg:px-8"><section><p className="text-[10px] font-black uppercase tracking-[.25em] text-cyan-300">Bring any class into the Vault</p><h1 className="mt-3 max-w-3xl font-display text-5xl font-black leading-none sm:text-6xl">Paste questions. Open the gate.</h1><p className="mt-5 max-w-2xl text-sm leading-6 text-white/50">Copy rows from a spreadsheet. Correct answers go first; The Vault shuffles every option when students play.</p>
      <label className="mt-8 block text-[10px] font-bold uppercase tracking-[.16em] text-[#aaa18b]">Set title<input value={title} onChange={(e) => change(e.target.value, setTitle)} className="mt-2 block w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-base normal-case tracking-normal text-white outline-none focus:border-cyan-300" /></label>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#aaa18b]">Question · Correct · Wrong 1 · Wrong 2 · Wrong 3 · Explanation · Misconception</p><button onClick={() => change(SAMPLE, setRaw)} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-200 hover:bg-white/5"><ClipboardPaste size={13}/> Load example</button></div>
      <textarea value={raw} onChange={(e) => change(e.target.value, setRaw)} rows={14} placeholder="Paste tab-separated spreadsheet rows here..." className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1816] p-4 font-mono text-xs leading-6 text-[#e8dfc9] outline-none focus:border-cyan-300" />
      <div className="mt-5 flex flex-wrap items-center gap-3"><button onClick={saveSet} disabled={!parsed.set} className="flex items-center gap-2 rounded-xl bg-[#e5d398] px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-[#10201d] disabled:cursor-not-allowed disabled:opacity-35"><Check size={15}/> Save locally</button><button onClick={publishSet} disabled={!parsed.set || publishing} className="flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-300/[.09] px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-cyan-100 disabled:cursor-not-allowed disabled:opacity-35">{publishing ? <LoaderCircle size={15} className="animate-spin"/> : <Link2 size={15}/>} Publish & copy link</button>{saved && <Link href="/vault?set=custom" className="flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-cyan-100">Play in The Vault <Play size={14}/></Link>}</div>
      {shareUrl && <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] p-4"><p className="text-xs font-bold text-emerald-100">Share link copied. Students can open this exact expedition:</p><a href={shareUrl} className="mt-2 block break-all text-xs text-cyan-200 underline decoration-cyan-300/30 underline-offset-4">{shareUrl}</a></div>}{publishError && <p className="mt-4 text-xs text-red-200">{publishError}</p>}{parsed.errors.length > 0 && raw && <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-4"><p className="flex items-center gap-2 text-xs font-bold text-amber-200"><ShieldAlert size={14}/> Check the forge</p>{parsed.errors.slice(0, 4).map((error) => <p key={error} className="mt-2 text-xs text-amber-100/60">{error}</p>)}</div>}</section>
      <aside><div className="sticky top-6 rounded-[2rem] border border-[#ddc98b]/15 bg-[#0a1715] p-5"><div className="flex items-end justify-between border-b border-white/[.07] pb-4"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-300">Forge preview</p><h2 className="mt-1 font-display text-2xl font-black">{title || "Untitled set"}</h2></div><strong className="text-3xl text-[#e5d398]">{parsed.set?.questions.length ?? 0}</strong></div><div className="mt-4 space-y-3">{parsed.set?.questions.slice(0, 4).map((question, index) => <div key={question.id} className="rounded-xl border border-white/[.07] bg-white/[.03] p-3"><p className="text-[9px] uppercase tracking-wider text-white/25">Chamber {index + 1}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-white/70">{question.prompt}</p><p className="mt-2 text-[10px] text-emerald-300/70">Correct: {question.choices[0]}</p></div>)}</div>{!parsed.set && <p className="py-12 text-center text-xs italic text-white/20">Valid questions will appear here.</p>}<p className="mt-5 flex items-center gap-2 text-[10px] leading-4 text-white/30"><ArrowRight size={12}/> Explanations power feedback. Misconceptions power Glitch repairs.</p></div></aside>
    </div>
  </main>;
}
