"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

interface Props {
  submissionId: string;
  role: "student" | "teacher";
}

const COPY = {
  student: {
    body: "Get a KORA Evaluation — a practice look at your essay before your teacher grades it. It's coaching, not your official grade.",
    button: "Get my KORA Evaluation",
  },
  teacher: {
    body: "KORA can highlight claims, evidence, sourcing, and reasoning, and suggest rubric points — to speed up your read. You'll still choose every final score.",
    button: "Run KORA's analysis",
  },
};

export default function TriggerGradeButton({ submissionId, role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[role];

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/margins/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "That didn't work.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-8 text-center flex flex-col items-center gap-3">
      <Sparkles size={20} className={loading ? "text-violet-500 animate-spin" : "text-violet-400 animate-pulse"} />
      <p className="text-sm text-stone-600 max-w-sm">{copy.body}</p>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:shadow-md transition-all disabled:opacity-60"
      >
        {loading ? "Working…" : copy.button}
      </button>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
