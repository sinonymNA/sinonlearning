"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";

export default function CurriculumSignup({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    try {
      const response = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source }) });
      setStatus(response.ok ? "success" : "error");
    } catch { setStatus("error"); }
  }

  if (status === "success") return <div className="rounded-[1.75rem] border border-[var(--course-ink)]/10 bg-white/75 p-7 shadow-lg"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-teal-800"><Check size={20} /></div><p className="mt-5 font-display text-2xl text-[var(--course-ink)]">You’re on the list.</p><p className="mt-2 text-sm text-[var(--course-ink)]/65">We’ll share meaningful curriculum updates—never inbox clutter.</p></div>;

  return <form onSubmit={submit} className="rounded-[1.75rem] border border-[var(--course-ink)]/10 bg-white/75 p-7 shadow-[0_20px_55px_rgba(13,27,46,.09)] backdrop-blur-sm"><Mail className="text-[var(--course-accent)]" /><label htmlFor={`curriculum-email-${source}`} className="mt-5 block font-display text-2xl text-[var(--course-ink)]">Curriculum notes for teachers</label><p className="mt-2 text-sm leading-relaxed text-[var(--course-ink)]/65">New course previews, materials, and classroom-ready releases.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><input id={`curriculum-email-${source}`} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@school.edu" className="min-w-0 flex-1 rounded-xl border border-[var(--course-ink)]/15 bg-white px-4 py-3 text-sm text-navy-900 outline-none focus:border-[var(--course-accent)]" /><button disabled={status === "submitting"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--course-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">{status === "submitting" ? "Joining…" : "Keep me posted"}<ArrowRight size={15} /></button></div>{status === "error" && <p className="mt-3 text-sm font-medium text-rose-700">Something went wrong. Please try again.</p>}</form>;
}
