"use client";

import { Plus, Minus, X, UserPlus } from "lucide-react";
import { ACCENT_STYLES, TEAM_ACCENT_CYCLE } from "./accent";

export interface ScoreboardTeam {
  name: string;
  score: number;
}

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
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-stretch justify-center gap-2 border-t border-white/10 bg-navy-950/85 px-3 py-3 backdrop-blur-md sm:gap-3 sm:px-6">
      {teams.map((team, i) => {
        const accent = ACCENT_STYLES[TEAM_ACCENT_CYCLE[i % TEAM_ACCENT_CYCLE.length]];
        return (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-2xl border ${accent.border} ${accent.bg} px-3 py-2`}
          >
            <button
              onClick={() => removeTeam(i)}
              aria-label="Remove team"
              className="text-white/30 transition-colors hover:text-white/70"
            >
              <X size={12} />
            </button>
            <input
              value={team.name}
              onChange={(e) => renameTeam(i, e.target.value)}
              className="w-20 bg-transparent text-sm font-semibold text-white focus:outline-none sm:w-28"
            />
            <span className={`font-display text-xl font-medium tabular-nums ${accent.text}`}>
              {team.score}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateScore(i, -1)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Subtract a point"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={() => updateScore(i, 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
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
        className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <UserPlus size={14} />
        Add team
      </button>
    </div>
  );
}
