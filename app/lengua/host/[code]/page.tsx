"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Mic, MicOff, ChevronLeft, ChevronRight, Play, Square, AlertTriangle } from "lucide-react";
import { useSpeechTranscript } from "@/components/lengua/useSpeechTranscript";
import { languageByCode } from "@/lib/lenguaLanguages";
import type { Slide } from "@/lib/sliderTypes";

interface State {
  code: string; title: string; status: "lobby" | "live" | "ended";
  currentSlide: number; slideCount: number; slide: Slide | null;
  slides: Slide[]; languages: string[]; studentCount: number;
  lines: { seq: number; text: string; confidence: number }[];
  roster: { id: string; name: string; language: string; tier: number }[];
  heatmap: { term: string; language: string; n: number }[];
}

export default function LenguaHostPage() {
  const { code } = useParams<{ code: string }>();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const hostToken = useRef<string | null>(null);
  const seqRef = useRef(0);

  if (hostToken.current === null && typeof window !== "undefined") {
    hostToken.current = localStorage.getItem(`lengua-host-${code}`);
  }

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/lengua/sessions/${code}?host=1`);
      if (!res.ok) return;
      const data: State = await res.json();
      setState(data);
      // Keep the local sequence ahead of whatever is stored, so a page refresh
      // mid-lesson doesn't start overwriting earlier lines.
      const maxSeq = data.lines.reduce((m, l) => Math.max(m, l.seq), -1);
      if (maxSeq + 1 > seqRef.current) seqRef.current = maxSeq + 1;
    } catch { /* next poll retries */ }
  }, [code]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, [fetchState]);

  const pushLine = useCallback(
    async (text: string, confidence: number) => {
      const seq = seqRef.current++;
      try {
        await fetch(`/api/lengua/sessions/${code}/line`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostToken: hostToken.current, seq, text, confidence }),
        });
      } catch { /* a dropped line is survivable; the lesson continues */ }
    },
    [code]
  );

  const { supported, listening, interim, error: micError, start, stop } = useSpeechTranscript({
    onFinal: pushLine,
  });

  async function post(path: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    try {
      await fetch(`/api/lengua/sessions/${code}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostToken: hostToken.current, ...body }),
      });
      await fetchState();
    } finally { setBusy(false); }
  }

  const go = (delta: number) => {
    if (!state) return;
    const next = Math.max(0, Math.min(state.slideCount - 1, state.currentSlide + delta));
    if (next !== state.currentSlide) post("slide", { index: next });
  };

  // Arrow keys — a teacher presenting shouldn't have to aim at a button.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-teal-300" />
      </div>
    );
  }

  const slide = state.slide;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Lobby */}
        {state.status === "lobby" ? (
          <div className="text-center">
            <p className="text-[13px] font-bold uppercase tracking-[0.3em] text-slate-400">
              Join at lengua · join
            </p>
            <p className="mt-3 font-mono text-[84px] font-bold leading-none tracking-[0.12em]">{state.code}</p>
            <p className="mt-6 text-[15px] text-slate-300">
              {state.studentCount} {state.studentCount === 1 ? "student" : "students"} joined
            </p>
            <div className="mx-auto mt-3 flex max-w-3xl flex-wrap justify-center gap-2">
              {state.roster.map((r) => (
                <span key={r.id} className="rounded-full bg-slate-800 px-3 py-1.5 text-[13px] text-slate-200">
                  {r.name}
                  <span className="ml-1.5 text-slate-500">{languageByCode(r.language)?.endonym ?? r.language}</span>
                </span>
              ))}
            </div>
            <button
              onClick={() => post("start")}
              disabled={busy}
              className="mx-auto mt-9 flex items-center gap-2 rounded-2xl bg-teal-600 px-8 py-4 text-[16px] font-semibold transition hover:bg-teal-500 disabled:opacity-40"
            >
              <Play size={17} /> Start the lesson
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Slide + controls */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-slate-400">{state.title}</p>
                  <p className="font-mono text-[15px] tracking-widest text-slate-300">{state.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!supported ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-[12px] font-semibold text-amber-300">
                      <AlertTriangle size={13} /> Mic unsupported in this browser
                    </span>
                  ) : listening ? (
                    <button
                      onClick={stop}
                      className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-2 text-[13px] font-semibold text-red-300 transition hover:bg-red-500/30"
                    >
                      <MicOff size={14} /> Stop mic
                    </button>
                  ) : (
                    <button
                      onClick={start}
                      className="flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-[13px] font-semibold transition hover:bg-teal-500"
                    >
                      <Mic size={14} /> Start mic
                    </button>
                  )}
                  <button
                    onClick={() => post("end")}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-full bg-slate-800 px-4 py-2 text-[13px] font-semibold text-slate-300 transition hover:bg-slate-700 disabled:opacity-40"
                  >
                    <Square size={12} /> End
                  </button>
                </div>
              </div>

              {micError && (
                <div className="mt-3 rounded-xl bg-amber-500/15 px-4 py-2.5 text-[13px] text-amber-200">
                  {micError}
                </div>
              )}

              {/* The board */}
              <div className="mt-4 min-h-[46vh] rounded-2xl bg-white p-8 text-slate-900">
                {slide ? (
                  <>
                    {slide.title && <h1 className="text-[34px] font-bold leading-tight">{slide.title}</h1>}
                    {slide.subtitle && <p className="mt-1 text-[18px] text-slate-500">{slide.subtitle}</p>}
                    {slide.body && <p className="mt-4 text-[18px] leading-relaxed">{slide.body}</p>}
                    {slide.bullets && (
                      <ul className="mt-4 flex flex-col gap-2">
                        {slide.bullets.map((b, i) => (
                          <li key={i} className="flex gap-3 text-[18px] leading-relaxed">
                            <span className="text-teal-500">•</span>{b}
                          </li>
                        ))}
                      </ul>
                    )}
                    {slide.quoteText && (
                      <blockquote className="mt-4 border-l-4 border-teal-400 pl-4 text-[20px] italic">
                        {slide.quoteText}
                      </blockquote>
                    )}
                  </>
                ) : (
                  <p className="text-slate-400">No slides — transcript only.</p>
                )}
              </div>

              {state.slideCount > 0 && (
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button onClick={() => go(-1)} disabled={state.currentSlide === 0}
                    className="rounded-full bg-slate-800 p-2.5 transition hover:bg-slate-700 disabled:opacity-30">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-mono text-[14px] text-slate-400 tabular-nums">
                    {state.currentSlide + 1} / {state.slideCount}
                  </span>
                  <button onClick={() => go(1)} disabled={state.currentSlide >= state.slideCount - 1}
                    className="rounded-full bg-slate-800 p-2.5 transition hover:bg-slate-700 disabled:opacity-30">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Right rail */}
            <div className="flex flex-col gap-5">
              {/* The diagnostic — what just lost the room. This is the thing no
                  translation tool gives a teacher. */}
              <div className="rounded-2xl bg-slate-800/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Words students are stopping on
                </p>
                {state.heatmap.length === 0 ? (
                  <p className="mt-2 text-[13px] text-slate-500">Nothing yet.</p>
                ) : (
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {state.heatmap.map((h) => {
                      const share = state.studentCount > 0 ? h.n / state.studentCount : 0;
                      return (
                        <div key={`${h.term}-${h.language}`} className="flex items-center gap-2.5">
                          <span className="w-28 shrink-0 truncate text-[13px] text-slate-200">{h.term}</span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700">
                            <span
                              className={share > 0.4 ? "block h-full bg-amber-400" : "block h-full bg-teal-400"}
                              style={{ width: `${Math.max(8, share * 100)}%` }}
                            />
                          </span>
                          <span className="w-6 shrink-0 text-right text-[12px] tabular-nums text-slate-400">{h.n}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Live transcript */}
              <div className="flex-1 rounded-2xl bg-slate-800/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Transcript</p>
                  {listening && (
                    <span className="flex items-center gap-1.5 text-[11px] text-teal-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" /> live
                    </span>
                  )}
                </div>
                <div className="mt-2 max-h-[34vh] overflow-y-auto">
                  {state.lines.length === 0 && !interim ? (
                    <p className="py-4 text-[13px] text-slate-500">
                      {listening ? "Listening…" : "Press Start mic to begin."}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {state.lines.map((l) => (
                        <p key={l.seq} className={l.confidence < 0.6 ? "text-[13px] text-slate-500" : "text-[13px] text-slate-200"}>
                          {l.text}
                        </p>
                      ))}
                      {interim && <p className="text-[13px] italic text-slate-500">{interim}</p>}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-800/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {state.studentCount} in the room
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {state.roster.map((r) => (
                    <span key={r.id} className="rounded-full bg-slate-700/70 px-2.5 py-1 text-[11px] text-slate-200">
                      {r.name} <span className="text-slate-400">{languageByCode(r.language)?.endonym ?? r.language}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
