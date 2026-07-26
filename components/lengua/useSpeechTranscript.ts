"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Browser speech recognition for the presenter.
//
// Runs entirely on the teacher's machine: no audio leaves the device and no
// model is billed, which is what makes a 45-minute continuous transcript free.
// The trade is robustness — this is Chrome/Edge/Safari-flavoured and degrades
// in a noisy room, so the caller must handle `supported === false` rather than
// assume a transcript exists.
//
// Two things the Web Speech API does that have to be worked around:
//   1. It stops on its own — after a silence, and on some builds after ~60s
//      regardless. A lesson needs it to run for the whole period, so it is
//      restarted on every `end` until the caller explicitly stops.
//   2. It emits growing interim guesses before a final result. Only finals are
//      published upward; interims drive the on-screen "listening" line so the
//      teacher can see it is working without spamming the network.

interface SpeechRecognitionAlternative { transcript: string; confidence: number }
interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResult };
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

export interface UseSpeechTranscriptOptions {
  lang?: string;
  /** Called once per finalised utterance. */
  onFinal: (text: string, confidence: number) => void;
}

export function useSpeechTranscript({ lang = "en-US", onFinal }: UseSpeechTranscriptOptions) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) { setSupported(false); return; }
    if (recRef.current) return;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const alt = r[0];
        if (r.isFinal) {
          const text = alt.transcript.trim();
          // Chrome reports confidence 0 on some final results even when the
          // transcript is fine; treat that as "unknown" rather than "certain
          // garbage", or every line renders as low-confidence.
          if (text) onFinalRef.current(text, alt.confidence > 0 ? alt.confidence : 0.9);
        } else {
          pending += alt.transcript;
        }
      }
      setInterim(pending);
    };

    rec.onerror = (e) => {
      // `no-speech` and `aborted` are routine in a classroom — a pause between
      // sentences, or our own restart. Only surface things a teacher can act on.
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone permission was denied. Allow the mic and press Start again.");
        wantRef.current = false;
        setListening(false);
      } else if (e.error === "audio-capture") {
        setError("No microphone found.");
        wantRef.current = false;
        setListening(false);
      }
    };

    rec.onend = () => {
      setInterim("");
      recRef.current = null;
      // The API stops itself on silence and on some builds after about a
      // minute. Restart unless the teacher actually pressed stop.
      if (wantRef.current) {
        setTimeout(() => { if (wantRef.current) start(); }, 250);
      } else {
        setListening(false);
      }
    };

    try {
      rec.start();
      recRef.current = rec;
      wantRef.current = true;
      setListening(true);
      setError(null);
    } catch {
      // start() throws if called while already running — harmless.
    }
  }, [lang]);

  const stop = useCallback(() => {
    wantRef.current = false;
    setListening(false);
    setInterim("");
    try { recRef.current?.stop(); } catch { /* already stopped */ }
    recRef.current = null;
  }, []);

  useEffect(() => () => { wantRef.current = false; try { recRef.current?.abort(); } catch {} }, []);

  return { supported, listening, interim, error, start, stop };
}
