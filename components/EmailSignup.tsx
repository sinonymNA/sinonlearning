"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function EmailSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-full bg-teal-50 px-6 py-4 text-teal-800">
        <CheckCircle2 size={18} />
        <span className="text-sm font-medium">
          Thanks — email signup will be connected soon.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="w-full rounded-full border border-navy-900/15 bg-white px-5 py-3 text-sm text-navy-900 placeholder:text-navy-700/40 focus:border-teal-500 focus:outline-none sm:w-80"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-navy-950 transition-colors hover:bg-amber-400"
      >
        Join Updates
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
