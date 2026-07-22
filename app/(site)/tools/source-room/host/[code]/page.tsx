"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users, Play, Square, Download } from "lucide-react";

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

interface ResponseRow {
  student_name: string;
  student_token: string;
  question_id: string;
  response_text: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HostPage() {
  const params = useParams<{ code: string }>();
  const code = params.code?.toUpperCase() ?? "";

  const [session, setSession] = useState<SessionData | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(`source-room-host-${code}`);
    if (!token) {
      setError("Host token not found. Did you create this session from this browser?");
      return;
    }
    setHostToken(token);
  }, [code]);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/source-room/sessions/${code}`);
      if (!res.ok) return;
      const data = await res.json();
      setSession(data.session);
      setStudentCount(data.studentCount);
    } catch {}
  }, [code]);

  const fetchResponses = useCallback(async () => {
    if (!hostToken) return;
    try {
      const res = await fetch(
        `/api/source-room/sessions/${code}/responses?hostToken=${encodeURIComponent(hostToken)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setResponses(data.responses);
    } catch {}
  }, [code, hostToken]);

  // Poll session state every 2s
  useEffect(() => {
    if (!hostToken) return;
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [hostToken, fetchState]);

  // Poll responses every 2s when active or ended
  useEffect(() => {
    if (!hostToken || !session) return;
    if (session.status === "waiting") return;
    fetchResponses();
    const interval = setInterval(fetchResponses, 2000);
    return () => clearInterval(interval);
  }, [hostToken, session?.status, fetchResponses]);

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

  async function handleStart() {
    if (!hostToken) return;
    await fetch(`/api/source-room/sessions/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostToken }),
    });
    fetchState();
  }

  async function handleEnd() {
    if (!hostToken) return;
    await fetch(`/api/source-room/sessions/${code}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostToken }),
    });
    fetchState();
  }

  function handleExport() {
    if (!session) return;
    const students = Array.from(new Set(responses.map((r) => r.student_name))).sort();
    const lines: string[] = [`Source Room Export — ${code}`, ""];
    for (const name of students) {
      lines.push(`=== ${name} ===`);
      for (const q of session.questions) {
        const r = responses.find(
          (x) => x.student_name === name && x.question_id === q.id,
        );
        lines.push(`${q.prompt}`);
        lines.push(r?.response_text || "(no response)");
        lines.push("");
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `source-room-${code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm text-center">
          <p className="text-lg font-semibold text-navy-900">Session Error</p>
          <p className="mt-2 text-sm text-navy-800/60">{error}</p>
          <Link href="/tools/source-room" className="mt-4 inline-block text-sm text-teal-700 hover:underline">
            Create a new session
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  // ─── Waiting phase ──────────────────────────────────────────────────────────
  if (session.status === "waiting") {
    return (
      <div className="min-h-screen bg-navy-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-widest text-white/40">Source Room</p>
            <p className="mt-2 text-sm text-white/50">Students: go to</p>
            <p className="mt-1 text-xl font-semibold text-teal-400">
              sinonlearning.com/tools/source-room/join
            </p>
            <p className="mt-6 text-sm text-white/40">Enter code</p>
            <p className="mt-1 font-mono text-8xl font-black tracking-[0.15em] text-white">
              {code}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-white/50">
              <Users size={16} />
              <span className="text-sm">
                <span className="font-semibold text-white">{studentCount}</span>{" "}
                {studentCount === 1 ? "student" : "students"} responded so far
              </span>
            </div>
          </div>

          {/* Source preview */}
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/30">
              {session.source_label}
            </p>
            {session.source_text && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {session.source_text}
              </p>
            )}
            {session.source_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.source_image_url}
                alt="Source"
                className="mt-4 max-h-60 rounded-xl object-contain"
              />
            )}
            {session.source_citation && (
              <p className="mt-3 text-xs italic text-white/30">{session.source_citation}</p>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-teal-400"
            >
              <Play size={18} />
              Start Analysis →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active phase ───────────────────────────────────────────────────────────
  if (session.status === "active") {
    const respondingCount = new Set(responses.map((r) => r.student_token)).size;
    const timerColor =
      timeLeft !== null && timeLeft <= 20
        ? "text-rose-400"
        : timeLeft !== null && timeLeft <= 60
          ? "text-amber-400"
          : "text-teal-400";

    return (
      <div className="min-h-screen bg-navy-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/30">Source Room · {code}</p>
              <p className="mt-1 text-sm text-white/50">
                <span className="font-semibold text-white">{respondingCount}</span> students responding
              </p>
            </div>
            <div className="text-right">
              <p className={`font-mono text-5xl font-black ${timerColor}`}>
                {timeLeft !== null ? formatTime(timeLeft) : "–:––"}
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/30">
              {session.source_label}
            </p>
            {session.source_text && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                {session.source_text}
              </p>
            )}
            {session.source_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.source_image_url}
                alt="Source"
                className="mt-3 max-h-48 rounded-xl object-contain"
              />
            )}
            {session.source_citation && (
              <p className="mt-2 text-xs italic text-white/30">{session.source_citation}</p>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={handleEnd}
              className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 px-6 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
            >
              <Square size={14} />
              End Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Ended phase ────────────────────────────────────────────────────────────
  const students = Array.from(new Set(responses.map((r) => r.student_name))).sort();

  return (
    <div className="min-h-screen bg-cream-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-navy-900/40">Source Room · {code}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-navy-900">
              Session Complete
            </h1>
            <p className="mt-1 text-sm text-navy-800/60">
              {students.length} {students.length === 1 ? "student" : "students"} ·{" "}
              {responses.length} {responses.length === 1 ? "response" : "responses"}
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-full border border-navy-900/15 bg-white px-4 py-2 text-sm font-medium text-navy-700 hover:border-navy-900/30"
          >
            <Download size={14} />
            Export
          </button>
        </div>

        {students.length === 0 ? (
          <div className="rounded-2xl border border-navy-900/8 bg-white py-16 text-center">
            <p className="text-navy-800/50">No responses were submitted.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-navy-900/8 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-900/8">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-900/50">
                    Student
                  </th>
                  {session.questions.map((q) => (
                    <th
                      key={q.id}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-900/50"
                    >
                      {q.prompt.split(" — ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((name, i) => (
                  <tr
                    key={name}
                    className={i % 2 === 0 ? "bg-white" : "bg-cream-50/60"}
                  >
                    <td className="px-4 py-3 font-medium text-navy-900">{name}</td>
                    {session.questions.map((q) => {
                      const r = responses.find(
                        (x) => x.student_name === name && x.question_id === q.id,
                      );
                      return (
                        <td key={q.id} className="max-w-xs px-4 py-3 align-top text-navy-800/70">
                          {r?.response_text || (
                            <span className="text-navy-900/25 italic">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/tools/source-room"
            className="text-sm text-teal-700 hover:underline"
          >
            Create a new session
          </Link>
        </div>
      </div>
    </div>
  );
}
