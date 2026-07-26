"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, X, Languages } from "lucide-react";
import type { Slide } from "@/lib/sliderTypes";

interface SlideTerm { term: string; gloss_en: string; gloss_l1: string | null }
interface Me {
  id: string; name: string; language: string; languageName: string;
  rtl: boolean; fontFamily: string | null;
  tier: number; tierLabel: string;
  showL1OnFirstTap: boolean; l1Available: boolean; l1DelayMs: number;
  slideTerms: SlideTerm[]; harvest: string[];
}
interface State {
  code: string; title: string; status: "lobby" | "live" | "ended";
  currentSlide: number; slideCount: number; slide: Slide | null;
  lines: { seq: number; text: string; confidence: number }[];
  me: Me | null;
}
interface Gloss {
  term: string; gloss_en: string; gloss_l1: string | null;
  part_of_speech: string | null; l1Available: boolean;
}

/** Split a line into word / non-word tokens so punctuation stays put. */
function tokenize(text: string): string[] {
  return text.split(/(\b[\w'’-]+\b)/g).filter((t) => t.length > 0);
}
const WORD = /^[\w'’-]+$/;
// Function words are never the barrier and marking them adds noise.
const SKIP = new Set(["the","a","an","and","or","but","of","to","in","on","at","is","are","was","were","be","it","this","that","for","with","as","by","we","you","i","they","he","she","not","do","does","did","so","if","then","than","from","have","has","had","will","can","its","our","your"]);

export default function LenguaStudentPage() {
  const { code } = useParams<{ code: string }>();
  const [state, setState] = useState<State | null>(null);
  const [gloss, setGloss] = useState<Gloss | null>(null);
  const [glossing, setGlossing] = useState(false);
  const [l1Unlocked, setL1Unlocked] = useState(false);
  const [l1Ready, setL1Ready] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (tokenRef.current === null && typeof window !== "undefined") {
    tokenRef.current = localStorage.getItem(`lengua-student-${code}`);
  }

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/lengua/sessions/${code}?studentToken=${tokenRef.current ?? ""}`);
      if (!res.ok) return;
      setState(await res.json());
    } catch { /* next poll retries */ }
  }, [code]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, [fetchState]);

  // Keep the newest speech in view without yanking the page while a student is
  // reading back through earlier lines.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [state?.lines.length]);

  const me = state?.me ?? null;

  async function lookup(term: string, context: string, wantL1: boolean) {
    if (!me) return;
    setGlossing(true);
    if (!wantL1) { setL1Unlocked(false); setL1Ready(false); }
    try {
      const res = await fetch(`/api/lengua/sessions/${code}/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentToken: tokenRef.current, term, context,
          slideIndex: state?.currentSlide ?? 0, wantL1,
        }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setGloss(data);
      if (wantL1) setL1Unlocked(true);
    } catch { /* silent — the student can tap again */ }
    finally { setGlossing(false); }
  }

  // The enforced pause. Not latency — the point is that a beat of hesitation
  // is what makes a student actually read the English gloss before reaching
  // for their own language.
  useEffect(() => {
    if (!gloss || !me) return;
    if (me.showL1OnFirstTap) { setL1Ready(true); return; }
    setL1Ready(false);
    const t = setTimeout(() => setL1Ready(true), me.l1DelayMs);
    return () => clearTimeout(t);
  }, [gloss, me]);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-400" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <Languages className="text-slate-300" size={30} />
        <p className="text-[15px] text-slate-500">You&apos;re not in this room yet.</p>
        <a href="/lengua/join" className="text-[14px] font-semibold text-teal-600 hover:underline">
          Join with your code →
        </a>
      </div>
    );
  }

  if (state.status === "lobby") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-white px-6 text-center">
        <Languages className="text-teal-500" size={30} />
        <p className="mt-3 text-[17px] font-semibold text-slate-800">You&apos;re in, {me.name}.</p>
        <p className="text-[14px] text-slate-400">Waiting for your teacher to start.</p>
        <p className="mt-4 text-[12px] text-slate-400">
          {me.languageName} · {me.tierLabel}
        </p>
      </div>
    );
  }

  const slide = state.slide;
  const l1Style = me.fontFamily ? { fontFamily: me.fontFamily } : undefined;

  return (
    <div className={["flex min-h-screen flex-col bg-white", gloss ? "pb-64" : "pb-4"].join(" ")}>
      {/* Slide */}
      {slide && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Slide {state.currentSlide + 1} of {state.slideCount}
          </p>
          {slide.title && (
            <h1 className="mt-1 text-[19px] font-bold leading-snug text-slate-900">{slide.title}</h1>
          )}
          {slide.subtitle && <p className="mt-0.5 text-[14px] text-slate-500">{slide.subtitle}</p>}
          {slide.body && <p className="mt-2 text-[14px] leading-relaxed text-slate-700">{slide.body}</p>}
          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-slate-700">
                  <span className="text-slate-300">•</span>{b}
                </li>
              ))}
            </ul>
          )}
          {slide.quoteText && (
            <blockquote className="mt-2 border-l-2 border-teal-300 pl-3 text-[14px] italic text-slate-600">
              {slide.quoteText}
            </blockquote>
          )}
        </div>
      )}

      {/* This slide's vocabulary. English definition leads; the translation is
          secondary and absent entirely at the English-only tier. */}
      {me.slideTerms.length > 0 && (
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Words on this slide
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {me.slideTerms.map((t) => (
              <div key={t.term} className="rounded-xl bg-teal-50/60 px-3 py-2">
                <p className="text-[13.5px] font-semibold text-slate-800">{t.term}</p>
                <p className="text-[13px] leading-snug text-slate-600">{t.gloss_en}</p>
                {t.gloss_l1 && (
                  <p
                    className="mt-0.5 text-[13px] leading-snug text-teal-700"
                    dir={me.rtl ? "rtl" : "ltr"}
                    style={l1Style}
                  >
                    {t.gloss_l1}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live transcript — English only, always. Tapping a word is the only
          way to get help, which keeps the reading in English by default. */}
      <div className="flex items-baseline justify-between px-4 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          What your teacher is saying
        </p>
        <p className="text-[10px] text-slate-300">tap any word</p>
      </div>
      {/* Sizes to content up to a cap. Deliberately not flex-1: early in a
          lesson there are two or three lines, and growing to fill the viewport
          left a screen-height gap above the gloss sheet. */}
      <div ref={scrollRef} className="mt-1.5 max-h-[46vh] overflow-y-auto px-4">
        {state.lines.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-slate-300">Listening…</p>
        ) : (
          <div className="flex flex-col gap-2 pb-2">
            {state.lines.map((line) => (
              <p
                key={line.seq}
                className={[
                  "text-[15px] leading-relaxed",
                  line.confidence < 0.6 ? "text-slate-400" : "text-slate-800",
                ].join(" ")}
              >
                {tokenize(line.text).map((tok, i) =>
                  WORD.test(tok) && !SKIP.has(tok.toLowerCase()) && tok.length > 2 ? (
                    <button
                      key={i}
                      onClick={() => lookup(tok, line.text, false)}
                      className="rounded underline decoration-teal-300 decoration-dotted underline-offset-2 transition hover:bg-teal-50 hover:decoration-teal-500"
                    >
                      {tok}
                    </button>
                  ) : (
                    <span key={i}>{tok}</span>
                  )
                )}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Gloss sheet */}
      {gloss && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[17px] font-bold text-slate-900">{gloss.term}</p>
                {gloss.part_of_speech && (
                  <p className="text-[11px] italic text-slate-400">{gloss.part_of_speech}</p>
                )}
              </div>
              <button onClick={() => setGloss(null)} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X size={17} />
              </button>
            </div>

            <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{gloss.gloss_en}</p>

            {gloss.gloss_l1 && (
              <p
                className="mt-2.5 rounded-xl bg-teal-50 px-3 py-2 text-[15px] leading-relaxed text-teal-800"
                dir={me.rtl ? "rtl" : "ltr"}
                style={l1Style}
              >
                {gloss.gloss_l1}
              </p>
            )}

            {!gloss.gloss_l1 && gloss.l1Available && (
              <button
                onClick={() => lookup(gloss.term, "", true)}
                disabled={!l1Ready || glossing}
                className="mt-2.5 w-full rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-slate-500 transition hover:border-teal-300 hover:text-teal-600 disabled:opacity-40"
              >
                {glossing
                  ? "…"
                  : l1Ready
                    ? `Show me in ${me.languageName}`
                    : "Read the English first…"}
              </button>
            )}

            {!gloss.l1Available && (
              <p className="mt-2.5 text-center text-[11px] text-slate-400">
                You&apos;re on English only — you don&apos;t need the translation any more.
              </p>
            )}
          </div>
        </div>
      )}

      {state.status === "ended" && me.harvest.length > 0 && (
        <div className="border-t border-slate-200 px-4 py-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Words you looked up today
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {me.harvest.map((w) => (
              <span key={w} className="rounded-full bg-slate-100 px-3 py-1 text-[13px] text-slate-700">{w}</span>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-slate-400">
            Learn these {me.harvest.length} and tomorrow&apos;s lesson gets easier.
          </p>
        </div>
      )}
    </div>
  );
}
