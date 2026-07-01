"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import KoraGamePlay from "@/components/game/KoraGamePlay";
import type { GameSession, StudentResponse } from "@/lib/koraGame";

function getOrCreateStudentId(code: string): string {
  const key = `koraGame:${code}:studentId`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function getStudentName(code: string): string | null {
  return sessionStorage.getItem(`koraGame:${code}:studentName`);
}

function setStudentName(code: string, name: string) {
  sessionStorage.setItem(`koraGame:${code}:studentName`, name);
}

export default function GamePlayerPage() {
  const { code } = useParams<{ code: string }>();

  const [session, setSession] = useState<GameSession | null>(null);
  const [loadError, setLoadError] = useState("");
  const [studentName, setName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!code) return;
    const saved = getStudentName(code);
    if (saved) setName(saved);

    fetch(`/api/kora-game/${code}/state`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Game not found");
        return r.json();
      })
      .then(({ session: s }) => setSession(s))
      .catch(() => setLoadError("Game not found. Check your code and try again."));
  }, [code]);

  function handleJoin() {
    const n = nameInput.trim();
    if (!n || !code) return;
    setJoining(true);
    setStudentName(code, n);
    setName(n);
    setJoining(false);
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4">
        <div className="text-center">
          <p className="mb-2 font-display text-xl text-navy-900">Game not found</p>
          <p className="text-sm text-navy-700/60">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <Loader2 size={24} className="animate-spin text-navy-400" />
      </div>
    );
  }

  if (!studentName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="mb-2 inline-block rounded-2xl bg-teal-50 px-4 py-2 font-display text-4xl font-bold tracking-widest text-teal-700">
              {code}
            </div>
            <h1 className="mt-3 font-display text-2xl text-navy-900">Join the game</h1>
            <p className="mt-1 text-sm text-navy-700/60">{session.concept}</p>
          </div>
          <div className="rounded-3xl border border-navy-900/8 bg-white p-6 shadow-sm">
            <label className="mb-1 block text-sm font-medium text-navy-800">Your name</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Enter your name"
              autoFocus
              className="mb-4 w-full rounded-xl border border-navy-900/10 bg-navy-50/50 px-3 py-2.5 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining || !nameInput.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-teal-500 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50"
            >
              {joining ? <Loader2 size={16} className="animate-spin" /> : "Join →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const studentId = getOrCreateStudentId(code);
  const studentData = session.students[studentId];
  const priorResponses: StudentResponse[] = studentData?.responses ?? [];

  return (
    <div className="min-h-screen bg-cream-50 px-4 py-10 sm:px-6">
      <KoraGamePlay
        code={code}
        studentId={studentId}
        studentName={studentName}
        session={session}
        priorResponses={priorResponses}
      />
    </div>
  );
}
