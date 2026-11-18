"use client";

 

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "./useRoom";
import { GAME_CATALOG, GAME_IDS } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function HostSetup() {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>(["hot_potato"]);
  const [sets, setSets] = useState<any[]>([]);
  const [setId, setSetId] = useState("builtin");
  const [teams, setTeams] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api("/api/arcade/content", { type: "list" }).then((d) => setSets(d.sets)).catch(() => undefined); }, []);
  const compat = sets.find((s) => s.id === setId)?.compatibility;

  async function create() {
    setBusy(true); setErr(null);
    try { const d = await api("/api/arcade", { type: "create", playlist: sel, contentSetId: setId, teams }); router.push(`/arcade/room/${d.code}/host`); }
    catch (e: any) { setErr(e.message); setBusy(false); }
  }
  return (
    <div className="grid gap-5">
      <div className="ar-panel"><h2 className="ar-h2 mb-1">1. Pick your games</h2><p className="ar-muted mb-4">Click in the order you want to play. Choose all five for the full Arcade Party.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{GAME_IDS.map((g: string) => { const c = GAME_CATALOG[g]; const on = sel.includes(g); return (
          <button key={g} aria-pressed={on} className="ar-card text-left" style={{ background: on ? c.color : "var(--paper)", color: on ? "#fff" : "var(--ink)" }} onClick={() => setSel(on ? (sel.length > 1 ? sel.filter((x) => x !== g) : sel) : [...sel, g])}>
            <div className="flex items-center justify-between"><span className="text-4xl">{c.icon}</span>{on && <span className="ar-chip">#{sel.indexOf(g) + 1}</span>}</div><div className="mt-1 text-xl font-bold">{c.name}</div><div className="mt-1 text-sm">{c.blurb}</div></button>); })}</div>
        <button className="ar-btn grape sm mt-4" onClick={() => setSel(GAME_IDS)}>🎉 Select all five (Arcade Party)</button></div>
      <div className="ar-panel grid gap-4 sm:grid-cols-2"><label className="grid gap-1 font-bold">2. Content set<select className="ar-input" value={setId} onChange={(e) => setSetId(e.target.value)}>{(sets.length ? sets : [{ id: "builtin", title: "Arcade starter pack" }]).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
        <label className="grid gap-1 font-bold">3. Scoring<select className="ar-input" value={teams} onChange={(e) => setTeams(Number(e.target.value))}><option value={0}>Solo scoring</option>{[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} teams</option>)}</select></label>
        {compat && <div className="flex flex-wrap gap-2 sm:col-span-2">{sel.map((g) => <span key={g} className="ar-pill" style={{ background: compat[g].ok ? "rgba(47,209,165,.25)" : "rgba(255,93,115,.3)" }}>{GAME_CATALOG[g].icon} {compat[g].ok ? `${compat[g].count} ${compat[g].label}` : `needs ${compat[g].need}+ ${compat[g].label} - built-in will be used`}</span>)}</div>}
        <a className="font-bold underline" href="/arcade/content">Create or import your own content →</a></div>
      <div className="flex flex-wrap items-center gap-4"><button className="ar-btn coral xl" disabled={busy} onClick={create}>{busy ? "Creating…" : "Create room"}</button><span role="alert" className="font-bold text-[var(--sun)]">{err}</span></div>
    </div>
  );
}
