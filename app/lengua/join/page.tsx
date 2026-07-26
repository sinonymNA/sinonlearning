"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Languages, ArrowRight } from "lucide-react";
import { LENGUA_LANGUAGES, LENGUA_TIERS, DEFAULT_TIER } from "@/lib/lenguaLanguages";

export default function LenguaJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");
  const [tier, setTier] = useState<number>(DEFAULT_TIER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = code.trim().length >= 4 && name.trim().length > 0 && language !== "";

  async function join() {
    setError(null); setLoading(true);
    const clean = code.trim().toUpperCase();
    try {
      const key = `lengua-student-${clean}`;
      let token = localStorage.getItem(key);
      if (!token) {
        token = crypto.randomUUID().replace(/-/g, "");
        localStorage.setItem(key, token);
      }
      const res = await fetch(`/api/lengua/sessions/${clean}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), studentToken: token, language, tier }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not join."); return; }
      router.push(`/lengua/${clean}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2">
          <Languages className="text-teal-600" size={22} />
          <span className="text-[22px] font-bold tracking-tight text-slate-900">Lengua</span>
        </div>

        <label className="mt-8 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Room code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="ABC123"
            autoCapitalize="characters"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-[26px] font-bold uppercase tracking-[0.2em] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-[16px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </label>

        {/* Language — shown in the endonym, because this is the one control a
            newcomer has to be able to use before they read any English. */}
        <div className="mt-5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Your language
          </span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {LENGUA_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={[
                  "rounded-xl border px-3 py-3 text-center transition",
                  language === l.code
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-600 hover:border-teal-300",
                ].join(" ")}
              >
                <span
                  className="block text-[16px] font-semibold"
                  dir={l.rtl ? "rtl" : "ltr"}
                  style={l.fontFamily ? { fontFamily: l.fontFamily } : undefined}
                >
                  {l.endonym}
                </span>
                <span className="block text-[11px] text-slate-400">{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            How much help?
          </span>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {LENGUA_TIERS.map((t) => (
              <button
                key={t.tier}
                onClick={() => setTier(t.tier)}
                className={[
                  "rounded-xl border px-3.5 py-2.5 text-left transition",
                  tier === t.tier ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-teal-300",
                ].join(" ")}
              >
                <span className={["block text-[13px] font-semibold", tier === t.tier ? "text-teal-700" : "text-slate-700"].join(" ")}>
                  {t.label}
                </span>
                <span className="block text-[11.5px] leading-snug text-slate-400">{t.description}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            You can change this any time. Aim to move down the list as the year goes on.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={join}
          disabled={!ready || loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-teal-200 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? "Joining…" : "Join"} {!loading && <ArrowRight size={15} />}
        </button>
      </div>
    </div>
  );
}
