"use client";

import { useEffect, useState } from "react";

interface StatRow {
  task_type: string;
  winner: "a" | "b" | "tie" | "both_bad";
  count: number;
}

export default function KoraStatsPanel({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<StatRow[]>([]);

  useEffect(() => {
    fetch("/api/kora-lab/stats")
      .then((res) => res.json())
      .then((data) => setStats(data.stats ?? []));
  }, [refreshKey]);

  const byTask = stats.reduce<Record<string, StatRow[]>>((acc, s) => {
    (acc[s.task_type] ??= []).push(s);
    return acc;
  }, {});

  if (Object.keys(byTask).length === 0) {
    return <p className="text-sm text-navy-700/50">No rated pairs yet — generate and rate one below to start.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {Object.entries(byTask).map(([taskType, rows]) => {
        const total = rows.reduce((sum, r) => sum + r.count, 0);
        return (
          <div key={taskType} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-navy-900">{taskType}</span>
            <span className="text-navy-700/50">({total} rated)</span>
            {rows.map((r) => (
              <span key={r.winner} className="rounded-full bg-navy-900/5 px-2.5 py-0.5 text-xs text-navy-700">
                {r.winner}: {r.count}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
