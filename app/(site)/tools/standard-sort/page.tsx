"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ListChecks, ArrowRight } from "lucide-react";
import { DEFAULT_UNITS, parseStandardsText } from "@/lib/standardSort";

export default function StandardSortCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [unitsText, setUnitsText] = useState(DEFAULT_UNITS.join("\n"));
  const [standardsText, setStandardsText] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const units = useMemo(
    () => unitsText.split(/\r?\n/).map((u) => u.trim()).filter(Boolean),
    [unitsText]
  );
  const standardsPreview = useMemo(() => parseStandardsText(standardsText), [standardsText]);

  async function create() {
    setError(null);
    if (!title.trim()) { setError("Give the session a title."); return; }
    if (units.length < 2) { setError("Add at least two units."); return; }
    if (standardsPreview.length === 0) { setError("Paste at least one standard."); return; }

    setCreating(true);
    try {
      const res = await fetch("/api/standard-sort/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), units, standardsText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not create the session."); return; }
      localStorage.setItem(`standard-sort-host-${data.code}`, data.hostToken);
      router.push(`/tools/standard-sort/${data.code}/results`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-5 py-12">
        <div className="flex items-center gap-2.5">
          <ListChecks className="text-indigo-600" size={26} strokeWidth={2} />
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Standard Sort</h1>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
          Your team sorts standards into units independently — one standard at a time, pick every unit
          that applies. Once a few people finish, the results page shows where you agree and, more
          usefully, where you don&apos;t.
        </p>

        <label className="mt-9 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Session title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Econ & Personal Finance — Unit Realignment"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px] text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Units (one per line)
            </span>
            <span className="text-[11px] text-slate-400">{units.length} units</span>
          </div>
          <textarea
            value={unitsText}
            onChange={(e) => setUnitsText(e.target.value)}
            rows={8}
            className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 font-mono text-[13.5px] leading-relaxed text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1.5 text-[12px] text-slate-400">
            Pre-filled with the 8 you gave — edit, reorder, add, or remove before creating.
          </p>
        </div>

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Standards to sort
            </span>
            <span className="text-[11px] text-slate-400">
              {standardsPreview.length} standard{standardsPreview.length === 1 ? "" : "s"} detected
            </span>
          </div>
          <textarea
            value={standardsText}
            onChange={(e) => setStandardsText(e.target.value)}
            rows={10}
            placeholder={"One per line. Optionally lead with a code:\nSSEC.17a–d: Scarcity, allocation, factors of production, opportunity cost\nSSEC.22a–f: Income types, pay stub, 1040, budgeting, net worth"}
            className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-[13.5px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />

          {standardsPreview.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-2">
              {standardsPreview.slice(0, 8).map((s) => (
                <div key={s.id} className="flex gap-2 px-2 py-1 text-[12.5px] text-slate-600">
                  {s.code && <span className="shrink-0 font-mono font-semibold text-indigo-500">{s.code}</span>}
                  <span className="truncate">{s.text}</span>
                </div>
              ))}
              {standardsPreview.length > 8 && (
                <p className="px-2 py-1 text-[11px] text-slate-400">
                  + {standardsPreview.length - 8} more…
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={create}
          disabled={creating}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {creating ? "Creating…" : "Create session"} {!creating && <ArrowRight size={15} />}
        </button>

        <p className="mt-4 text-center text-[12px] text-slate-400">
          Teammates join at{" "}
          <Link href="/tools/standard-sort/join" className="font-medium text-indigo-600 hover:underline">
            /tools/standard-sort/join
          </Link>
        </p>
      </div>
    </div>
  );
}
