"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface SessionData {
  code: string;
  source_text: string | null;
  source_image_url: string | null;
  source_label: string;
  source_citation: string | null;
  questions: { id: string; prompt: string }[];
  timer_seconds: number;
  status: "waiting" | "active" | "ended";
  started_at: string | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function StudentPage() {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const code = params.code?.toUpperCase() ?? "";

  const [session, setSession] = useState<SessionData | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentToken, setStudentToken] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSubmitFiredRef = useRef(false);

  // Resolve identity from URL params or localStorage
  useEffect(() => {
    const urlName = searchParams.get("name") ?? "";
    const urlToken = searchParams.get("token") ?? "";

    if (urlName && urlToken) {
      setStudentName(urlName);
      setStudentToken(urlToken);
      return;
    }

    // Fallback: check localStorage
    try {
      const stored = localStorage.getItem(`source-room-student-${code}`);
      if (stored) {
        const { token, name } = JSON.parse(stored) as { token: string; name: string };
        setStudentName(name);
        setStudentToken(token);
      }
    } catch {}
  }, [code, searchParams]);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/source-room/sessions/${code}`);
      if (!res.ok) return;
      const data = await res.json();
      setSession(data.session);
    } catch {}
  }, [code]);

  // Poll session every 2s
  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 2000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  // Timer countdown
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!session || session.status !== "active" || !session.started_at) {
      setTimeLeft(null);
      return;
    }
    function tick() {
      const elapsed = (Date.now() - new Date(session!.started_at!).getTime()) / 1000;
      const remaining = Math.max(0, Math.floor(session!.timer_seconds - elapsed));
      setTimeLeft(remaining);
    }
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.status, session?.started_at, session?.timer_seconds]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !autoSubmitFiredRef.current && session?.questions) {
      autoSubmitFiredRef.current = true;
      setAutoSubmitted(true);
      submitAll(session.questions);
    }
  }, [timeLeft, session?.questions]);

  async function submitAll(questions: { id: string; prompt: string }[]) {
    if (!studentToken || !studentName) return;
    setSaving(true);
    try {
      await Promise.all(
        questions.map((q) =>
          fetch(`/api/source-room/sessions/${code}/respond`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentToken,
              studentName,
              questionId: q.id,
              responseText: answers[q.id] ?? "",
            }),
          }),
        ),
      );
      const now = Date.now();
      const newSaved: Record<string, number> = {};
      questions.forEach((q) => { newSaved[q.id] = now; });
      setSavedAt((prev) => ({ ...prev, ...newSaved }));
    } catch {}
    setSaving(false);
  }

  async function handleSave() {
    if (!session?.questions || !studentToken) return;
    await submitAll(session.questions);
  }

  const timerColor =
    timeLeft !== null && timeLeft <= 20
      ? "text-rose-500"
      : timeLeft !== null && timeLeft <= 60
        ? "text-amber-500"
        : "text-teal-600";

  const timerPulse = timeLeft !== null && timeLeft <= 10;

  // ─── Waiting phase ──────────────────────────────────────────────────────────
  if (!session || session.status === "waiting") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream-50 px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        <div className="text-center">
          <p className="font-semibold text-navy-900">Waiting for your teacher to start…</p>
          {studentName && (
            <p className="mt-1 text-sm text-navy-800/50">You&apos;re in as {studentName}</p>
          )}
          <p className="mt-1 font-mono text-lg font-bold tracking-widest text-navy-900/30">
            {code}
          </p>
        </div>
      </div>
    );
  }

  // ─── Ended phase ────────────────────────────────────────────────────────────
  if (session.status === "ended" || autoSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-50 px-6 text-center">
        <div className="text-4xl">✓</div>
        <p className="font-display text-xl font-semibold text-navy-900">
          {autoSubmitted ? "Time&apos;s up!" : "Session ended"}
        </p>
        <p className="max-w-xs text-sm text-navy-800/60">
          Your responses were saved. Your teacher will review them.
        </p>
        <Link href="/tools/source-room/join" className="mt-4 text-sm text-teal-700 hover:underline">
          Join another session
        </Link>
      </div>
    );
  }

  // ─── Active phase ────────────────────────────────────────────────────────────
  const allSaved =
    session.questions.length > 0 &&
    session.questions.every((q) => savedAt[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left column — source */}
          <div className="lg:w-[55%]">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {session.source_label}
              </p>
              {session.source_text && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
                  {session.source_text}
                </p>
              )}
              {session.source_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.source_image_url}
                  alt="Source"
                  className="mt-4 max-h-72 w-full rounded-xl object-contain"
                />
              )}
              {session.source_citation && (
                <p className="mt-4 text-xs italic text-stone-400">{session.source_citation}</p>
              )}
            </div>
          </div>

          {/* Right column — timer + questions */}
          <div className="flex flex-col gap-4 lg:w-[45%]">
            {/* Timer */}
            <div className="rounded-2xl border border-navy-900/8 bg-white p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-900/40">
                Time Remaining
              </p>
              <p
                className={`mt-1 font-mono text-5xl font-black transition-colors ${timerColor} ${
                  timerPulse ? "animate-pulse" : ""
                }`}
              >
                {timeLeft !== null ? formatTime(timeLeft) : "–:––"}
              </p>
            </div>

            {/* Questions */}
            {session.questions.map((q) => {
              const wasSaved = savedAt[q.id] !== undefined;
              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-navy-900/8 bg-white p-4"
                >
                  <label className="mb-2 block text-xs font-semibold text-navy-900">
                    {q.prompt}
                  </label>
                  <textarea
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    rows={4}
                    maxLength={500}
                    placeholder="Type your response here…"
                    className="w-full resize-none rounded-xl border border-navy-900/10 bg-cream-50 px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-900/25 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-navy-900/30">
                      {(answers[q.id] ?? "").length}/500
                    </span>
                    {wasSaved && (
                      <span className="text-[11px] text-teal-600">✓ Saved</span>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full rounded-xl py-3.5 text-sm font-semibold transition-colors ${
                allSaved
                  ? "border border-teal-500 bg-teal-50 text-teal-700"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              } disabled:opacity-60`}
            >
              {saving ? "Saving…" : allSaved ? "✓ All Saved" : "Submit Responses"}
            </button>

            <p className="text-center text-xs text-navy-900/30">
              You can re-submit as many times as you&apos;d like before time runs out.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
