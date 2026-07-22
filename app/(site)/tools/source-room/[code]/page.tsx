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

interface QuestionGrade {
  question_id: string;
  score: number;
  label: "Strong" | "Developing" | "Needs Work" | "No Response";
  feedback: string;
}

interface GradeResult {
  grades: QuestionGrade[];
  overall_feedback: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SCORE_COLORS: Record<string, string> = {
  Strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Developing: "bg-amber-100 text-amber-800 border-amber-200",
  "Needs Work": "bg-rose-100 text-rose-800 border-rose-200",
  "No Response": "bg-navy-900/5 text-navy-800/50 border-navy-900/10",
};

const SCORE_DOTS: Record<string, string[]> = {
  Strong: ["bg-emerald-500", "bg-emerald-500", "bg-emerald-500"],
  Developing: ["bg-amber-400", "bg-amber-400", "bg-navy-900/10"],
  "Needs Work": ["bg-rose-400", "bg-navy-900/10", "bg-navy-900/10"],
  "No Response": ["bg-navy-900/10", "bg-navy-900/10", "bg-navy-900/10"],
};

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
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
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

    // Request KORA grading after save
    requestGrade();
  }

  async function requestGrade() {
    if (!studentToken) return;
    setGrading(true);
    try {
      const res = await fetch(`/api/source-room/sessions/${code}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentToken }),
      });
      if (res.ok) {
        const data = await res.json() as GradeResult;
        setGradeResult(data);
      }
    } catch {}
    setGrading(false);
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

  // ─── Ended / auto-submitted phase ───────────────────────────────────────────
  if (session.status === "ended" || autoSubmitted) {
    return (
      <div className="min-h-screen bg-cream-50 px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <div className="mb-3 text-4xl">✓</div>
            <p className="font-display text-xl font-semibold text-navy-900">
              {autoSubmitted ? "Time's up — responses saved!" : "Session ended"}
            </p>
            <p className="mt-1 text-sm text-navy-800/55">
              Your teacher will review your responses.
            </p>
          </div>

          {/* Grade results */}
          {grading && (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-navy-900/8 bg-white py-6 text-sm text-navy-800/50">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
              KORA is grading your responses…
            </div>
          )}

          {gradeResult && !grading && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  Overall Feedback
                </p>
                <p className="mt-1 text-sm text-teal-900">{gradeResult.overall_feedback}</p>
              </div>

              {gradeResult.grades.map((g) => {
                const q = session.questions.find((x) => x.id === g.question_id);
                const dots = SCORE_DOTS[g.label] ?? SCORE_DOTS["No Response"];
                return (
                  <div
                    key={g.question_id}
                    className="rounded-2xl border border-navy-900/8 bg-white p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold text-navy-900">
                        {q?.prompt ?? g.question_id}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="flex gap-1">
                          {dots.map((dot, i) => (
                            <span key={i} className={`h-2 w-2 rounded-full ${dot}`} />
                          ))}
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${SCORE_COLORS[g.label]}`}
                        >
                          {g.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-navy-800/70">{g.feedback}</p>
                    {answers[g.question_id] && (
                      <p className="mt-2 rounded-lg bg-cream-50 px-3 py-2 text-xs italic text-navy-900/40">
                        Your response: {answers[g.question_id]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!grading && !gradeResult && (
            <p className="text-center text-sm text-navy-800/40">
              Grading unavailable — your responses were still saved.
            </p>
          )}

          <div className="mt-8 text-center">
            <Link href="/tools/source-room/join" className="text-sm text-teal-700 hover:underline">
              Join another session
            </Link>
          </div>
        </div>
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
              const grade = gradeResult?.grades.find((g) => g.question_id === q.id);
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
                    {wasSaved && !grade && (
                      <span className="text-[11px] text-teal-600">✓ Saved</span>
                    )}
                    {grade && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${SCORE_COLORS[grade.label]}`}
                      >
                        {grade.label}
                      </span>
                    )}
                  </div>
                  {grade && (
                    <p className="mt-2 rounded-lg border border-navy-900/6 bg-cream-50 px-3 py-2 text-xs text-navy-800/70">
                      {grade.feedback}
                    </p>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleSave}
              disabled={saving || grading}
              className={`w-full rounded-xl py-3.5 text-sm font-semibold transition-colors ${
                grading
                  ? "border border-teal-400/50 bg-teal-50 text-teal-600"
                  : allSaved && gradeResult
                    ? "border border-teal-500 bg-teal-50 text-teal-700"
                    : "bg-teal-600 text-white hover:bg-teal-700"
              } disabled:opacity-60`}
            >
              {saving
                ? "Saving…"
                : grading
                  ? "KORA is grading…"
                  : allSaved && gradeResult
                    ? "✓ Submitted & Graded"
                    : allSaved
                      ? "✓ Saved — Resubmit to re-grade"
                      : "Submit for Feedback"}
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
