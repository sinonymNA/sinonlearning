"use client";

import { useEffect, useState } from "react";

interface PairRow {
  id: string;
  task_type: string;
  winner: string;
  reason: string | null;
  created_at: string;
}

export default function KoraHistoryList({ refreshKey }: { refreshKey: number }) {
  const [pairs, setPairs] = useState<PairRow[]>([]);

  useEffect(() => {
    fetch("/api/kora-lab/pairs?limit=20")
      .then((res) => res.json())
      .then((data) => setPairs(data.pairs ?? []));
  }, [refreshKey]);

  if (pairs.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Recent ratings</p>
      {pairs.map((p) => (
        <div key={p.id} className="flex items-center gap-2 rounded-lg bg-navy-900/5 px-3 py-1.5 text-[12px] text-navy-700">
          <span className="font-semibold">{p.task_type}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold">{p.winner}</span>
          {p.reason && <span className="truncate text-navy-700/60">{p.reason}</span>}
          <span className="ml-auto shrink-0 text-navy-700/40">{new Date(p.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
