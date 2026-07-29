"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Loader2, ArrowLeft, ArrowRight, ListChecks } from "lucide-react";

interface StandardItem { id: string; code: string | null; text: string }
interface State {
  code: string;
  title: string;
  units: string[];
  standards: StandardItem[];
  me: { name: string; responses: Record<string, string[]> } | null;
}

export default function StandardSortPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const initialisedRef = useRef(false);
  const tokenRef = useRef<string | null>(null);

  if (tokenRef.current === null && typeof window !== "undefined") {
    tokenRef.current = localStorage.getItem(`standard-sort-participant-${code}`);
  }

  useEffect(() => {
    if (!tokenRef.current) {
      router.replace(`/tools/standard-sort/join?code=${code}`);
    }
  }, [code, router]);

  const fetchState = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const res = await fetch(`/api/standard-sort/sessions/${code}?participantToken=${tokenRef.current}`);
      if (!res.ok) return;
      const data: State = await res.json();
      setState(data);

      // Resume at the first standard with no saved answer. Only done once,
      // on load — after that the index is driven by Back/Next so a poll
      // mid-sort can't yank a participant to a different question.
      if (!initialisedRef.current && data.me) {
        initialisedRef.current = true;
        const firstUnanswered = data.standards.findIndex((s) => !data.me!.responses[s.id]);
        const startAt = firstUnanswered === -1 ? data.standards.length : firstUnanswered;
        if (startAt >= data.standards.length && data.standards.length > 0) {
          router.replace(`/tools/standard-sort/${code}/results`);
          return;
        }
        setIndex(startAt);
        setPicked(new Set(data.me.responses[data.standards[startAt]?.id]?.filter(Boolean) ?? []));
      }
    } catch { /* transient — next poll retries */ }
  }, [code, router]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 4000);
    return () => clearInterval(id);
  }, [fetchState]);

  function toggleUnit(unit: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(unit)) next.delete(unit); else next.add(unit);
      return next;
    });
  }

  function goTo(newIndex: number) {
    if (!state) return;
    setIndex(newIndex);
    const std = state.standards[newIndex];
    setPicked(new Set(state.me?.responses[std?.id]?.filter(Boolean) ?? []));
  }

  async function saveAndAdvance() {
    if (!state || picked.size === 0) return;
    const std = state.standards[index];
    setSaving(true);
    try {
      await fetch(`/api/standard-sort/sessions/${code}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantToken: tokenRef.current,
          standardId: std.id,
          units: Array.from(picked),
        }),
      });
      // Reflect locally so Back shows what was just saved even before the
      // next poll comes back.
      setState((s) => (s ? { ...s, me: { ...s.me!, responses: { ...s.me!.responses, [std.id]: Array.from(picked) } } } : s));

      if (index + 1 >= state.standards.length) {
        router.push(`/tools/standard-sort/${code}/results`);
      } else {
        goTo(index + 1);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-400" />
      </div>
    );
  }

  const standard = state.standards[index];
  if (!standard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-400">
        No standards in this session.
      </div>
    );
  }

  const pct = Math.round((index / state.standards.length) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="text-indigo-500" size={16} />
            <span className="truncate text-[13px] font-semibold text-slate-600">{state.title}</span>
          </div>
          <span className="shrink-0 font-mono text-[12px] text-slate-400">
            {index + 1} / {state.standards.length}
          </span>
        </div>
        <div className="mx-auto mt-2.5 h-1 max-w-xl overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-8">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
          {standard.code && (
            <p className="mb-1.5 font-mono text-[12px] font-semibold text-indigo-500">{standard.code}</p>
          )}
          <p className="text-[18px] font-semibold leading-snug text-slate-900">{standard.text}</p>
        </div>

        <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Which unit does this belong in? Pick every unit that applies.
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          {state.units.map((unit) => {
            const on = picked.has(unit);
            return (
              <button
                key={unit}
                onClick={() => toggleUnit(unit)}
                className={[
                  "flex items-start gap-2 rounded-xl border px-3.5 py-3 text-left transition",
                  on
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50",
                ].join(" ")}
              >
                <span
                  className={[
                    "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border",
                    on ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300",
                  ].join(" ")}
                >
                  {on && <Check size={11} strokeWidth={3} />}
                </span>
                <span className="text-[13.5px] font-medium leading-snug">{unit}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={() => goTo(Math.max(0, index - 1))}
            disabled={index === 0}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-[13px] font-semibold text-slate-500 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={saveAndAdvance}
            disabled={picked.size === 0 || saving}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-[14px] font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {saving ? "Saving…" : index + 1 >= state.standards.length ? "Finish" : "Next"}
            {!saving && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
