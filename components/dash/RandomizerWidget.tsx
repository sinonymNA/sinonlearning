"use client";

import { useRef, useState } from "react";
import { Shuffle, Plus, X } from "lucide-react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

export default function RandomizerWidget() {
  const [roster, setRoster] = useLocalStorageState<string[]>("classboard:roster", [
    "Ava",
    "Noah",
    "Maya",
    "Liam",
    "Sofia",
    "Ethan",
  ]);
  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [noRepeat, setNoRepeat] = useState(true);
  const [remaining, setRemaining] = useState<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addName = () => {
    const name = draft.trim();
    if (!name) return;
    setRoster((prev) => [...prev, name]);
    setDraft("");
  };

  const removeName = (name: string) => {
    setRoster((prev) => prev.filter((n) => n !== name));
  };

  const pool = () => {
    if (!noRepeat) return roster;
    const left = remaining.length > 0 ? remaining : roster;
    return left;
  };

  const spin = () => {
    if (roster.length === 0 || spinning) return;
    setSpinning(true);
    const candidates = pool();
    let ticks = 0;
    const maxTicks = 14;
    const tick = () => {
      const random = candidates[Math.floor(Math.random() * candidates.length)];
      setPicked(random);
      ticks += 1;
      if (ticks < maxTicks) {
        timeoutRef.current = setTimeout(tick, 60 + ticks * 12);
      } else {
        setSpinning(false);
        if (noRepeat) {
          setRemaining((prevRemaining) => {
            const base = prevRemaining.length > 0 ? prevRemaining : roster;
            const next = base.filter((n) => n !== random);
            return next.length > 0 ? next : [];
          });
        }
      }
    };
    tick();
  };

  return (
    <div className="w-64">
      <div className="flex h-20 items-center justify-center rounded-xl border border-navy-900/10 bg-cream-50 px-3">
        <span
          className={`font-display text-xl font-medium text-navy-900 ${spinning ? "opacity-70" : ""}`}
        >
          {picked ?? (roster.length > 0 ? "Ready to pick" : "Add names below")}
        </span>
      </div>

      <button
        onClick={spin}
        disabled={roster.length === 0}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-2 text-sm font-medium text-navy-950 transition-colors hover:bg-green-400 disabled:opacity-30"
      >
        <Shuffle size={14} />
        Pick a student
      </button>

      <label className="mt-3 flex items-center gap-2 text-xs text-navy-700/60">
        <input
          type="checkbox"
          checked={noRepeat}
          onChange={(e) => {
            setNoRepeat(e.target.checked);
            setRemaining([]);
          }}
          className="accent-green-500"
        />
        Don&apos;t repeat until everyone&apos;s picked
      </label>

      <div className="mt-3 max-h-28 space-y-1 overflow-y-auto pr-1">
        {roster.map((name) => (
          <div
            key={name}
            className="group flex items-center justify-between rounded-lg px-2 py-1 text-sm text-navy-800/80 hover:bg-navy-900/5"
          >
            {name}
            <button
              onClick={() => removeName(name)}
              aria-label={`Remove ${name}`}
              className="text-navy-700/0 group-hover:text-navy-700/40 hover:text-navy-900"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addName()}
          placeholder="Add student..."
          className="min-w-0 flex-1 rounded-lg border border-navy-900/12 bg-cream-50 px-2.5 py-1.5 text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-green-500/50 focus:outline-none"
        />
        <button
          onClick={addName}
          aria-label="Add student"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-500 text-navy-950 transition-colors hover:bg-green-400"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
