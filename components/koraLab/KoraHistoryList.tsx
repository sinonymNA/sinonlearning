"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface PairRow {
  id: string;
  task_type: string;
  winner: string;
  reason: string | null;
  use_as_reference: boolean;
  created_at: string;
}

export default function KoraHistoryList({ refreshKey }: { refreshKey: number }) {
  const [pairs, setPairs] = useState<PairRow[]>([]);
  const [pending, setPending] = useState<string | null>(null);

  function load() {
    fetch("/api/kora-lab/pairs?limit=20")
      .then((res) => res.json())
      .then((data) => setPairs(data.pairs ?? []));
  }

  useEffect(load, [refreshKey]);

  async function toggleReference(pair: PairRow) {
    setPending(pair.id);
    try {
      const res = await fetch(`/api/kora-lab/pairs/${pair.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAsReference: !pair.use_as_reference }),
      });
      if (res.ok) load();
    } finally {
      setPending(null);
    }
  }

  if (pairs.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Recent ratings</p>
      <p className="text-[11px] text-navy-700/40">
        Starring a pair marks its winning candidate as a live reference example for future generations of that task.
      </p>
      {pairs.map((p) => {
        const canReference = p.winner === "a" || p.winner === "b";
        return (
          <div key={p.id} className="flex items-center gap-2 rounded-lg bg-navy-900/5 px-3 py-1.5 text-[12px] text-navy-700">
            <span className="font-semibold">{p.task_type}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold">{p.winner}</span>
            {p.reason && <span className="truncate text-navy-700/60">{p.reason}</span>}
            <span className="ml-auto shrink-0 text-navy-700/40">{new Date(p.created_at).toLocaleString()}</span>
            {canReference && (
              <button
                onClick={() => toggleReference(p)}
                disabled={pending === p.id}
                title={p.use_as_reference ? "Remove as reference example" : "Use as reference example"}
                className={`shrink-0 rounded-full p-1 transition-colors disabled:opacity-50 ${
                  p.use_as_reference ? "text-amber-500" : "text-navy-700/25 hover:text-amber-500"
                }`}
              >
                <Star size={13} fill={p.use_as_reference ? "currentColor" : "none"} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
