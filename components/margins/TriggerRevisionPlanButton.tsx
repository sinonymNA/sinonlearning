"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function TriggerRevisionPlanButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/margins/revision-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not prepare your revision plan.");
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
      <p className="text-sm text-stone-600">Let&rsquo;s put together your revision plan.</p>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:shadow-md transition-all disabled:opacity-60"
      >
        {loading ? "Preparing…" : "Prepare my revision plan"}
      </button>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
