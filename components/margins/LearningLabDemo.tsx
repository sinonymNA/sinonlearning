"use client";

import { useState } from "react";
import { ArrowRight, Bot, Check, Send, Sparkles, Trophy, User } from "lucide-react";

type Turn = { role: "student" | "tutor"; text: string };
const question = "A student spends an afternoon studying instead of working a paid shift. What is the opportunity cost?";
const choices = ["The value of the next-best alternative given up", "The time spent studying", "The wage already earned", "The total number of choices"];

export default function LearningLabDemo() {
  const [step, setStep] = useState<"check" | "chat" | "practice" | "done">("check");
  const [answer, setAnswer] = useState("");
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [practice, setPractice] = useState("");

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...turns, { role: "student" as const, text }];
    setTurns(next); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/margins/learning-lab/conversation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ concept: "opportunity cost", question, correctAnswer: choices[0], stage: "diagnose", turns, studentMessage: text }) });
      const data = await res.json();
      setTurns([...next, { role: "tutor", text: data.tutorMessage ?? "Let’s try one small clue together." }]);
      setReady(Boolean(data.isReadyToAdvance));
    } catch { setTurns([...next, { role: "tutor", text: "I’m having trouble connecting. Try explaining the idea one more way." }]); }
    finally { setLoading(false); }
  }

  const progress = step === "check" ? 20 : step === "chat" ? (ready ? 60 : 40) : step === "practice" ? 80 : 100;
  return <section className="overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-xl shadow-teal-900/10">
    <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-violet-700 px-6 py-7 text-white sm:px-9"><div className="flex items-center gap-2 text-teal-100"><Sparkles size={17} /><span className="text-[11px] font-bold uppercase tracking-[0.18em]">Learning Lab demo</span></div><h1 className="mt-3 text-2xl font-bold sm:text-3xl">Learn it, don’t just guess it</h1><p className="mt-2 text-sm text-teal-50">Have a real conversation with the tutor. It remembers your reasoning.</p><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${progress}%` }} /></div></div>
    <div className="p-6 sm:p-9">
      {step === "check" && <><p className="text-sm font-medium text-stone-800">{question}</p><div className="mt-5 grid gap-2">{choices.map((choice) => <button key={choice} onClick={() => setAnswer(choice)} className={`rounded-2xl border p-4 text-left text-sm ${answer === choice ? "border-teal-500 bg-teal-50 ring-2 ring-teal-100" : "border-stone-200 hover:border-teal-200"}`}>{choice}</button>)}</div><button disabled={!answer} onClick={() => { setStep("chat"); setTurns([{ role: "tutor", text: answer === choices[0] ? "That may be right. Don’t stop at the choice—what makes it the next-best alternative?" : "Interesting choice. What made it seem right? Let’s investigate together." }]); }} className="mt-6 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">Talk it through <ArrowRight size={15} className="ml-1 inline" /></button></>}
      {step === "chat" && <><span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">Conversation · understanding check</span><div className="mt-5 max-h-72 space-y-3 overflow-y-auto rounded-2xl bg-stone-50 p-4">{turns.map((turn, i) => <div key={i} className={turn.role === "student" ? "text-right" : "text-left"}><span className={`inline-flex max-w-[88%] gap-2 rounded-2xl px-4 py-3 text-left text-sm ${turn.role === "student" ? "bg-teal-700 text-white" : "bg-white text-stone-700 shadow-sm"}`}>{turn.role === "student" ? <User size={15} /> : <Bot size={15} />}{turn.text}</span></div>)}</div><div className="mt-4 flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send(input)} placeholder="Explain your thinking…" className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm" /><button onClick={() => void send(input)} disabled={!input.trim() || loading} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">{loading ? "Thinking…" : <Send size={16} />}</button></div>{ready && <button onClick={() => setStep("practice")} className="mt-4 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white">Try a fresh question <ArrowRight size={15} className="ml-1 inline" /></button>}</>}
      {step === "practice" && <><span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">Fresh practice</span><p className="mt-5 text-lg font-semibold text-stone-900">A café stays open one extra hour instead of closing. What is the opportunity cost?</p><textarea value={practice} onChange={(e) => setPractice(e.target.value)} rows={4} placeholder="Explain what the café gives up…" className="mt-5 w-full rounded-2xl border border-stone-200 p-4 text-sm" /><button disabled={!practice.trim()} onClick={() => setStep("done")} className="mt-4 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">Finish practice</button></>}
      {step === "done" && <div className="py-6 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Trophy size={30} /></div><h2 className="mt-5 text-2xl font-bold text-stone-900">You built understanding.</h2><p className="mt-2 text-sm text-stone-500">You explained your thinking, responded to coaching, and applied the idea to a new situation.</p><button onClick={() => { setStep("check"); setAnswer(""); setTurns([]); setReady(false); setPractice(""); }} className="mt-6 rounded-xl border border-stone-200 px-5 py-3 text-sm font-semibold">Try again <Check size={15} className="ml-1 inline" /></button></div>}
    </div>
  </section>;
}

