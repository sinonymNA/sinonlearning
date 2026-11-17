"use client";

import { useState } from "react";
import { Check, Sparkles, Trophy, ArrowRight } from "lucide-react";

const choices = [
  "The value of the next-best alternative given up",
  "The time spent studying",
  "The wage already earned",
  "The total number of choices",
];
const freshChoices = [
  "The next-best use of the café's resources",
  "Every possible future business",
  "Only the money already spent",
  "The number of customers from yesterday",
];

export default function LearningLabDemo() {
  const [answer, setAnswer] = useState("");
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"test" | "reason" | "practice" | "done">("test");
  const [practice, setPractice] = useState("");
  const [message, setMessage] = useState("");

  function submitTest() {
    setStep("reason");
    setMessage(answer === choices[0] ? "Nice start. Tell us how you decided." : "Interesting choice. What made it seem right?");
  }
  function submitReason() {
    setStep("practice");
    setMessage("Let’s try the same idea in a brand-new situation.");
  }
  function submitPractice() {
    setStep("done");
    setMessage(practice === freshChoices[0] ? "You applied the idea independently!" : "Good effort. You’re still building the connection.");
  }

  const progress = step === "test" ? 25 : step === "reason" ? 50 : step === "practice" ? 75 : 100;

  return (
    <section className="overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-xl shadow-teal-900/10">
      <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-violet-700 px-6 py-7 text-white sm:px-9">
        <div className="flex items-center gap-2 text-teal-100"><Sparkles size={17} /><span className="text-[11px] font-bold uppercase tracking-[0.18em]">Learning Lab demo</span></div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Can you spot the opportunity cost?</h1>
        <p className="mt-2 max-w-xl text-sm text-teal-50">No class. No account. Just try the full learning loop.</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-amber-300 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="p-6 sm:p-9">
        {step === "test" && <><p className="text-sm font-medium text-stone-800">A student spends an afternoon studying instead of working a paid shift. What is the opportunity cost?</p><div className="mt-5 grid gap-2">{choices.map((choice) => <button key={choice} onClick={() => setAnswer(choice)} className={`rounded-2xl border p-4 text-left text-sm transition-all ${answer === choice ? "border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-100" : "border-stone-200 hover:border-teal-200 hover:bg-teal-50/50"}`}>{choice}</button>)}</div><button disabled={!answer} onClick={submitTest} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Submit answer <ArrowRight size={15} /></button></>}
        {step === "reason" && <><span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">Step 2 · Explain your thinking</span><p className="mt-5 text-lg font-semibold text-stone-900">{message}</p><p className="mt-2 text-sm text-stone-500">“I guessed” is a perfectly useful answer.</p><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="I chose it because…" className="mt-5 w-full rounded-2xl border border-stone-200 p-4 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50" /><button disabled={!reason.trim()} onClick={submitReason} className="mt-4 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">Continue <ArrowRight size={15} className="ml-1 inline" /></button></>}
        {step === "practice" && <><span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">Step 3 · Fresh practice</span><p className="mt-5 text-lg font-semibold text-stone-900">A café stays open one extra hour instead of closing. What should the owner compare first?</p><div className="mt-5 grid gap-2">{freshChoices.map((choice) => <button key={choice} onClick={() => setPractice(choice)} className={`rounded-2xl border p-4 text-left text-sm transition-all ${practice === choice ? "border-violet-500 bg-violet-50 text-violet-900 ring-2 ring-violet-100" : "border-stone-200 hover:border-violet-200 hover:bg-violet-50/50"}`}>{choice}</button>)}</div><button disabled={!practice} onClick={submitPractice} className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">Check my thinking</button></>}
        {step === "done" && <div className="py-6 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Trophy size={30} /></div><h2 className="mt-5 text-2xl font-bold text-stone-900">{message}</h2><p className="mx-auto mt-2 max-w-md text-sm text-stone-500">That’s the difference between remembering an answer and demonstrating understanding.</p><button onClick={() => { setStep("test"); setAnswer(""); setReason(""); setPractice(""); }} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700">Try again <Check size={15} /></button></div>}
      </div>
    </section>
  );
}
