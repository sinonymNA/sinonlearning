"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import FadeIn from "@/components/FadeIn";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    if (!cleanCode || !cleanName) {
      setError("Enter both your name and the session code.");
      return;
    }
    setError("");
    setJoining(true);
    try {
      const res = await fetch(`/api/source-room/sessions/${cleanCode}`);
      if (res.status === 404) {
        setError("Session not found. Check the code and try again.");
        setJoining(false);
        return;
      }
      if (!res.ok) throw new Error("Server error.");

      const token = crypto.randomUUID();
      localStorage.setItem(`source-room-student-${cleanCode}`, JSON.stringify({ token, name: cleanName }));
      router.push(`/tools/source-room/${cleanCode}?name=${encodeURIComponent(cleanName)}&token=${token}`);
    } catch {
      setError("Something went wrong. Try again.");
      setJoining(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-6 py-12">
      <FadeIn>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white">
              <BookOpen size={26} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-navy-900">Source Room</h1>
              <p className="mt-1 text-sm text-navy-800/55">
                Enter your name and the code from your teacher&apos;s screen.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-900/50">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="First name or full name"
                autoFocus
                className="w-full rounded-xl border border-navy-900/12 bg-white px-4 py-3 text-sm text-navy-900 placeholder:text-navy-900/30 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-900/50">
                Session Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="6-letter code"
                maxLength={6}
                className="w-full rounded-xl border border-navy-900/12 bg-white px-4 py-3 font-mono text-lg font-bold tracking-widest text-navy-900 placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-navy-900/30 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
                {error}
              </p>
            )}

            <button
              onClick={handleJoin}
              disabled={joining}
              className="mt-1 w-full rounded-xl bg-teal-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
            >
              {joining ? "Joining…" : "Join →"}
            </button>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
