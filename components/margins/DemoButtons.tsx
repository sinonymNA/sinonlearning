"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";

type Role = "teacher" | "student";

export default function DemoButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(role: Role) {
    setError(null);
    setLoading(role);
    try {
      const res = await fetch("/api/margins/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start demo.");
        return;
      }
      router.push(role === "teacher" ? "/margins/teacher" : "/margins/student");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-2.5">
      <p className="flex items-center gap-1.5 text-xs text-stone-400">
        <FlaskConical size={12} />
        Just testing the grader?
      </p>
      <div className="flex gap-2.5">
        <button
          onClick={() => handleClick("teacher")}
          disabled={loading !== null}
          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-500 hover:border-violet-300 hover:text-violet-600 transition-colors disabled:opacity-60"
        >
          {loading === "teacher" ? "Loading…" : "Teacher test"}
        </button>
        <button
          onClick={() => handleClick("student")}
          disabled={loading !== null}
          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-500 hover:border-violet-300 hover:text-violet-600 transition-colors disabled:opacity-60"
        >
          {loading === "student" ? "Loading…" : "Student test"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
