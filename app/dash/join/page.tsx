"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashLogo from "@/components/DashLogo";

function setStudentName(code: string, name: string) {
  sessionStorage.setItem(`dash:jam:${code}:name`, name);
}

function JoinJamboardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code")?.toUpperCase() ?? "");
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (!trimmedCode || !trimmedName) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/dash/boards/${trimmedCode}`, { cache: "no-store" });
      if (!res.ok) {
        setError("No jamboard found with that code.");
        return;
      }
      setStudentName(trimmedCode, trimmedName);
      router.push(`/dash/board/${trimmedCode}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <DashLogo width={130} />
          </div>
          <h1 className="font-display text-2xl text-navy-900">Join your class board</h1>
          <p className="mt-1 text-sm text-navy-700/60">Enter the code your teacher shared with the class.</p>
        </div>
        <form onSubmit={handleJoin} className="rounded-3xl border border-navy-900/8 bg-white p-6 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-navy-800">Board code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. AB12CD"
            maxLength={6}
            autoFocus
            className="mb-4 w-full rounded-xl border border-navy-900/10 bg-navy-50/50 px-3 py-2.5 font-mono text-sm tracking-widest text-navy-800 placeholder:text-navy-400 focus:border-green-400/60 focus:outline-none"
          />
          <label className="mb-1 block text-sm font-medium text-navy-800">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="mb-4 w-full rounded-xl border border-navy-900/10 bg-navy-50/50 px-3 py-2.5 text-sm text-navy-800 placeholder:text-navy-400 focus:border-green-400/60 focus:outline-none"
          />
          {error && <p className="mb-3 text-[12px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={joining || !code.trim() || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-green-500 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
          >
            {joining ? <Loader2 size={16} className="animate-spin" /> : "Join →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JoinJamboardPage() {
  return (
    <Suspense fallback={null}>
      <JoinJamboardForm />
    </Suspense>
  );
}
