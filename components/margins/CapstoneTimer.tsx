"use client";

import { useEffect, useRef, useState } from "react";

// Fork of components/dash/TimerWidget.tsx for the optional practice-course
// capstone — different palette (Margins' teal/stone, not Dash's navy/green),
// different behavior (auto-starts immediately, no preset/custom-minute
// picker since the duration is fixed by the content, and an onExpire
// callback the original widget doesn't have). Deliberately advisory: expiry
// fires the callback and plays a beep, but never disables anything — this
// is still practice, not a real exam.

function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const playTone = (delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.4);
    };
    [0, 0.45, 0.9].forEach(playTone);
  } catch {
    // audio not available
  }
}

interface Props {
  initialMinutes: number;
  onExpire?: () => void;
}

export default function CapstoneTimer({ initialMinutes, onExpire }: Props) {
  const totalSeconds = initialMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          if (!expiredRef.current) {
            expiredRef.current = true;
            playBeep();
            onExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const mins = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const secs = (remaining % 60).toString().padStart(2, "0");
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;

  return (
    <div className="mx-auto w-fit text-center">
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
        <svg className="absolute h-full w-full -rotate-90">
          <circle cx="50%" cy="50%" r="42" fill="none" stroke="rgba(41,37,36,0.08)" strokeWidth="5" />
          <circle
            cx="50%"
            cy="50%"
            r="42"
            fill="none"
            stroke={remaining === 0 ? "#fb923c" : "#0d9488"}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress)}`}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <span className="font-mono text-xl font-semibold tabular-nums text-stone-800">
          {mins}:{secs}
        </span>
      </div>
      {remaining === 0 && (
        <p className="mt-3 max-w-[16rem] text-xs leading-relaxed text-orange-600">
          Time&rsquo;s up — finish whenever you&rsquo;re ready, no penalty either way.
        </p>
      )}
    </div>
  );
}
