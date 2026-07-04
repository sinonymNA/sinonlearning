"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function TriggerGradeButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(data.error ?? "Grading failed.");
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
    <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 p-8 text-center flex flex-col items-center gap-3">
      <Sparkles size={20} className="text-rose-400" />
      <p className="text-sm text-stone-600">This essay hasn&rsquo;t been graded by KORA yet.</p>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-200 hover:shadow-md transition-all disabled:opacity-60"
      >
        {loading ? "Grading…" : "Grade with KORA"}
      </button>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
