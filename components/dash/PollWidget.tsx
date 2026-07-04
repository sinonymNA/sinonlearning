"use client";

import { RotateCcw } from "lucide-react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

interface PollOption {
  label: string;
  votes: number;
}

interface PollState {
  question: string;
  options: PollOption[];
}

const defaultPoll: PollState = {
  question: "Do you understand today's topic?",
  options: [
    { label: "Got it!", votes: 0 },
    { label: "Mostly", votes: 0 },
    { label: "Still confused", votes: 0 },
  ],
};

export default function PollWidget() {
  const [poll, setPoll] = useLocalStorageState<PollState>("classboard:poll", defaultPoll);

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  const vote = (index: number) => {
    setPoll((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === index ? { ...o, votes: o.votes + 1 } : o)),
    }));
  };

  const updateLabel = (index: number, label: string) => {
    setPoll((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === index ? { ...o, label } : o)),
    }));
  };

  const reset = () => {
    setPoll((prev) => ({ ...prev, options: prev.options.map((o) => ({ ...o, votes: 0 })) }));
  };

  return (
    <div className="w-64">
      <input
        value={poll.question}
        onChange={(e) => setPoll((prev) => ({ ...prev, question: e.target.value }))}
        className="w-full rounded-lg border border-navy-900/12 bg-cream-50 px-2.5 py-1.5 text-sm font-medium text-navy-900 focus:border-green-500/50 focus:outline-none"
      />

      <div className="mt-3 space-y-2">
        {poll.options.map((option, i) => {
          const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          return (
            <button
              key={i}
              onClick={() => vote(i)}
              className="relative w-full overflow-hidden rounded-lg border border-navy-900/12 bg-cream-50 px-3 py-2 text-left transition-colors hover:border-green-500/40"
            >
              <div
                className="absolute inset-y-0 left-0 bg-green-400/20 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <input
                  value={option.label}
                  onChange={(e) => updateLabel(i, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="min-w-0 flex-1 bg-transparent text-sm text-navy-900 focus:outline-none"
                />
                <span className="shrink-0 text-xs font-medium text-navy-700/60">
                  {option.votes} · {pct}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={reset}
        className="mt-3 flex items-center gap-1.5 text-xs text-navy-700/50 transition-colors hover:text-navy-900"
      >
        <RotateCcw size={12} />
        Reset votes
      </button>
    </div>
  );
}
