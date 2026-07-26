"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Download, Loader2, Mic, ArrowRight, Languages } from "lucide-react";
import { LENGUA_LANGUAGES } from "@/lib/lenguaLanguages";

interface DeckRow { id: string; title: string; }

export default function LenguaSetupPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckRow[] | null>(null);
  const [deckId, setDeckId] = useState<string>("");
  const [selected, setSelected] = useState<string[]>(["es"]);
  const [ready, setReady] = useState<string[]>([]);
  const [building, setBuilding] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/slider/decks")
      .then((r) => (r.ok ? r.json() : { decks: [] }))
      .then((d) => setDecks(d.decks ?? []))
      .catch(() => setDecks([]));
  }, []);

  const refreshReady = useCallback((id: string) => {
    if (!id) { setReady([]); return; }
    fetch(`/api/lengua/glossary?deckId=${id}`)
      .then((r) => (r.ok ? r.json() : { languages: [] }))
      .then((d) => setReady(d.languages ?? []))
      .catch(() => setReady([]));
  }, []);

  useEffect(() => { refreshReady(deckId); }, [deckId, refreshReady]);

  function toggle(code: string) {
    setSelected((s) => (s.includes(code) ? s.filter((c) => c !== code) : [...s, code]));
  }

  async function buildGlossary(code: string) {
    if (!deckId) { setError("Choose a lesson first."); return; }
    setBuilding(code); setError(null);
    try {
      const res = await fetch("/api/lengua/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, language: code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not build that glossary."); return; }
      refreshReady(deckId);
    } catch {
      setError("Network error building the glossary.");
    } finally {
      setBuilding(null);
    }
  }

  async function createRoom() {
    setCreating(true); setError(null);
    try {
      const title = decks?.find((d) => d.id === deckId)?.title ?? "Lesson";
      const res = await fetch("/api/lengua/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: deckId || null, title, languages: selected }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not create the room."); return; }
      localStorage.setItem(`lengua-host-${data.code}`, data.hostToken);
      router.push(`/lengua/host/${data.code}`);
    } catch {
      setError("Network error creating the room.");
    } finally {
      setCreating(false);
    }
  }

  const missing = selected.filter((c) => !ready.includes(c));

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-5 py-12">
        <div className="flex items-center gap-2.5">
          <Languages className="text-teal-600" size={26} strokeWidth={2} />
          <h1 className="text-[30px] font-bold tracking-tight text-slate-900">Lengua</h1>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
          Your slides go to every screen. Your speech becomes a live English transcript.
          Students tap any word they don&apos;t know — and get simpler <em>English</em> first,
          their own language second.
        </p>

        {/* Deck */}
        <div className="mt-9">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Lesson</span>
          {decks === null ? (
            <div className="mt-1.5 flex items-center gap-2 text-[13px] text-slate-400">
              <Loader2 size={13} className="animate-spin" /> Loading your decks…
            </div>
          ) : decks.length === 0 ? (
            <p className="mt-1.5 text-[13px] text-slate-400">
              No decks yet —{" "}
              <Link href="/slider/build" className="font-medium text-teal-600 hover:underline">
                build one in Slider
              </Link>{" "}
              first. You can still run a transcript-only room below.
            </p>
          ) : (
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">No slides — transcript only</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          )}
        </div>

        {/* Languages */}
        <div className="mt-7">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Languages in the room
            </span>
            <span className="text-[11px] text-slate-400">Built once, reused forever</span>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {LENGUA_LANGUAGES.map((l) => {
              const on = selected.includes(l.code);
              const has = ready.includes(l.code);
              return (
                <div
                  key={l.code}
                  className={[
                    "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
                    on ? "border-teal-300 bg-teal-50/50" : "border-slate-200",
                  ].join(" ")}
                >
                  <button
                    onClick={() => toggle(l.code)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                        on ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300",
                      ].join(" ")}
                    >
                      {on && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-slate-800">{l.name}</span>
                      <span
                        className="block text-[13px] text-slate-400"
                        dir={l.rtl ? "rtl" : "ltr"}
                        style={l.fontFamily ? { fontFamily: l.fontFamily } : undefined}
                      >
                        {l.endonym}
                      </span>
                    </span>
                  </button>

                  {deckId && (
                    has ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                        <Check size={11} /> Glossary ready
                      </span>
                    ) : (
                      <button
                        onClick={() => buildGlossary(l.code)}
                        disabled={building !== null}
                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:border-teal-300 hover:text-teal-600 disabled:opacity-40"
                      >
                        {building === l.code ? (
                          <><Loader2 size={11} className="animate-spin" /> Building…</>
                        ) : (
                          <><Download size={11} /> Build glossary</>
                        )}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {deckId && missing.length > 0 && (
            <p className="mt-2.5 text-[12px] text-amber-600">
              {missing.length} selected language{missing.length === 1 ? " has" : "s have"} no glossary for this
              lesson yet. You can still start — students will get live look-ups instead of a pre-built
              vocabulary panel.
            </p>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={createRoom}
          disabled={creating || selected.length === 0}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-teal-200 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {creating ? "Creating…" : <><Mic size={16} /> Start a Lengua room</>}
          {!creating && <ArrowRight size={15} />}
        </button>

        <p className="mt-4 text-center text-[12px] text-slate-400">
          Students join at{" "}
          <Link href="/lengua/join" className="font-medium text-teal-600 hover:underline">
            /lengua/join
          </Link>
        </p>
      </div>
    </div>
  );
}
