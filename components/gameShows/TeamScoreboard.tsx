"use client";

import { Plus, Minus, X, UserPlus } from "lucide-react";
import { ACCENT_STYLES, TEAM_ACCENT_CYCLE } from "./accent";

export interface ScoreboardTeam {
  name: string;
  score: number;
}

const TEAM_COLORS = [
  { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9" },
  { bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  { bg: "#fff1f2", border: "#fecdd3", text: "#be123c" },
  { bg: "#fdf4ff", border: "#f5d0fe", text: "#a21caf" },
];

export default function TeamScoreboard({
  teams,
  onChange,
}: {
  teams: ScoreboardTeam[];
  onChange: (teams: ScoreboardTeam[]) => void;
}) {
  const updateScore = (index: number, delta: number) => {
    const next = teams.map((t, i) => (i === index ? { ...t, score: t.score + delta } : t));
    onChange(next);
  };

  const renameTeam = (index: number, name: string) => {
    const next = teams.map((t, i) => (i === index ? { ...t, name } : t));
    onChange(next);
  };

  const removeTeam = (index: number) => {
    onChange(teams.filter((_, i) => i !== index));
  };

  const addTeam = () => {
    onChange([...teams, { name: `Team ${teams.length + 1}`, score: 0 }]);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-stretch justify-center gap-2 border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md sm:gap-3 sm:px-6">
      {teams.map((team, i) => {
        const color = TEAM_COLORS[i % TEAM_COLORS.length];
        return (
          <div
            key={i}
            className="flex items-center gap-2 rounded-2xl px-3 py-2"
            style={{
              background: color.bg,
              border: `1px solid ${color.border}`,
            }}
          >
            <button
              onClick={() => removeTeam(i)}
              aria-label="Remove team"
              className="text-slate-300 transition-colors hover:text-slate-600"
            >
              <X size={12} />
            </button>
            <input
              value={team.name}
              onChange={(e) => renameTeam(i, e.target.value)}
              className="w-20 bg-transparent text-sm font-semibold focus:outline-none sm:w-28"
              style={{ color: color.text }}
            />
            <span
              className="font-display text-xl font-black tabular-nums"
              style={{ color: color.text }}
            >
              {team.score}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateScore(i, -1)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-colors hover:text-slate-700"
                aria-label="Subtract a point"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={() => updateScore(i, 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-colors hover:text-slate-700"
                aria-label="Add a point"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        );
      })}

      <button
        onClick={addTeam}
        className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-700"
      >
        <UserPlus size={14} />
        Add team
      </button>
    </div>
  );
}
