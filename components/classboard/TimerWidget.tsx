"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

const presets = [1, 5, 10, 15, 20];

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

export default function TimerWidget() {
  const [totalSeconds, setTotalSeconds] = useState(5 * 60);
  const [remaining, setRemaining] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          playBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const setMinutes = (minutes: number) => {
    const seconds = minutes * 60;
    setTotalSeconds(seconds);
    setRemaining(seconds);
    setRunning(false);
  };

  const applyCustom = () => {
    const minutes = parseFloat(customInput);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    setMinutes(minutes);
    setCustomInput("");
  };

  const mins = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const secs = (remaining % 60).toString().padStart(2, "0");
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;

  return (
    <div className="w-64 text-center">
      <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
        <svg className="absolute h-full w-full -rotate-90">
          <circle cx="50%" cy="50%" r="56" fill="none" stroke="rgba(13,27,46,0.08)" strokeWidth="6" />
          <circle
            cx="50%"
            cy="50%"
            r="56"
            fill="none"
            stroke={remaining === 0 ? "#fb7185" : "#2dd4bf"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress)}`}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <span className="font-display text-3xl font-medium tabular-nums text-navy-900">
          {mins}:{secs}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={remaining === 0}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500 text-navy-950 transition-colors hover:bg-teal-400 disabled:opacity-30"
          aria-label={running ? "Pause" : "Start"}
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button
          onClick={() => {
            setRemaining(totalSeconds);
            setRunning(false);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-900/15 text-navy-700/70 transition-colors hover:text-navy-900"
          aria-label="Reset"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setMinutes(p)}
            className="rounded-full border border-navy-900/15 px-2.5 py-1 text-xs text-navy-700/70 transition-colors hover:border-teal-500/50 hover:text-navy-900"
          >
            {p}m
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyCustom()}
          placeholder="Custom min"
          className="w-24 rounded-lg border border-navy-900/12 bg-cream-50 px-2.5 py-1 text-center text-xs text-navy-900 placeholder:text-navy-700/35 focus:border-teal-500/50 focus:outline-none"
        />
        <button
          onClick={applyCustom}
          className="rounded-lg border border-navy-900/15 px-2.5 py-1 text-xs text-navy-700/70 transition-colors hover:text-navy-900"
        >
          Set
        </button>
      </div>
    </div>
  );
}
