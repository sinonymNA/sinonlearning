"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { RELAY_SPRITES } from "@/lib/relayGame";

export default function RelayJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setError(null);
    setLoading(true);
    const clean = code.trim().toUpperCase();
    try {
      // A token per (student, room) so a shared laptop can host two students in
      // different rooms without one clobbering the other.
      const key = `relay-student-${clean}`;
      let token = localStorage.getItem(key);
      if (!token) {
        token = crypto.randomUUID().replace(/-/g, "");
        localStorage.setItem(key, token);
      }

      const res = await fetch(`/api/relay/sessions/${clean}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), studentToken: token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not join."); return; }
      localStorage.setItem(`relay-name-${clean}`, name.trim());
      router.push(`/margins/relay/${clean}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const ready = code.trim().length >= 4 && name.trim().length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5">
      <div className="w-full max-w-sm">
        <img src={RELAY_SPRITES.logo} alt="Relay" className="mx-auto h-16 w-auto" />

        <label className="mt-9 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Room code
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter" && ready) join(); }}
            maxLength={8}
            placeholder="ABC123"
            autoCapitalize="characters"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-[26px] font-bold uppercase tracking-[0.2em] text-slate-800 outline-none transition placeholder:text-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
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
            maxLength={40}
            placeholder="Jordan"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-[16px] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
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
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? "Joining…" : "Join"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
