"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export default function JoinClassButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/margins/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not join class.");
        return;
      }
      setOpen(false);
      setCode("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:shadow-md transition-all"
      >
        <Plus size={14} />
        Join a class
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-1.5 shadow-sm"
    >
      <input
        autoFocus
        type="text"
        required
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Class code"
        className="rounded-lg border-none bg-transparent px-2.5 py-1.5 text-sm font-mono tracking-wider outline-none w-32"
        maxLength={6}
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-60"
      >
        {loading ? "…" : "Join"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg p-1.5 text-stone-400 hover:text-stone-600"
      >
        <X size={14} />
      </button>
      {error && <span className="text-[11px] text-red-600 pl-1">{error}</span>}
    </form>
  );
}
