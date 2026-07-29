"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListChecks, ArrowRight } from "lucide-react";

function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("code")?.toUpperCase() ?? "");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = code.trim().length >= 4 && name.trim().length > 0;

  async function join() {
    setError(null);
    setLoading(true);
    const clean = code.trim().toUpperCase();
    try {
      const key = `standard-sort-participant-${clean}`;
      let token = localStorage.getItem(key);
      if (!token) {
        token = crypto.randomUUID().replace(/-/g, "");
        localStorage.setItem(key, token);
      }
      const res = await fetch(`/api/standard-sort/sessions/${clean}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), participantToken: token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not join."); return; }
      router.push(`/tools/standard-sort/${clean}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2">
          <ListChecks className="text-indigo-600" size={22} />
          <span className="text-[22px] font-bold tracking-tight text-slate-900">Standard Sort</span>
        </div>

        <label className="mt-9 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Session code
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter" && ready) join(); }}
            maxLength={8}
            placeholder="ABC123"
            autoCapitalize="characters"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-[26px] font-bold uppercase tracking-[0.2em] text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Your name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && ready) join(); }}
            maxLength={60}
            placeholder="Jordan"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-[16px] text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={join}
          disabled={!ready || loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? "Joining…" : "Start sorting"} {!loading && <ArrowRight size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function StandardSortJoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
