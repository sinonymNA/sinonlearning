"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { GameSwitch } from "./GameSwitch";
import { PrefsButtons, PrefsProvider } from "./prefs";
import { FinalScreen, IntroScreen, ResultsScreen, TeamBoard } from "./screens";
import { Banner, ErrorToast, Leaderboard } from "./ui";
import { api, useRoom } from "./useRoom";
import { GAME_CATALOG, GAME_IDS } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function HostDashboard({ code }: { code: string }) {
  return <PrefsProvider><Inner code={code.toUpperCase()} /></PrefsProvider>;
}

function Inner({ code }: { code: string }) {
  const room = useRoom(code, { host: true });
  const { view, stamp, lost, offline } = room;
  const [toast, setToast] = useState<string | null>(null);
  const [sets, setSets] = useState<any[]>([]);
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); api("/api/arcade/content", { type: "list" }).then((d) => setSets(d.sets)).catch(() => undefined); }, []);
  const cmd = async (c: string, args: any = {}) => { try { await room.hostCmd(c, args); } catch (e: any) { setToast(e.message); setTimeout(() => setToast(null), 3500); } };

  if (lost) return <div className="ar-wrap"><div className="ar-panel"><h1 className="ar-h2">Can&apos;t open this room</h1><p className="mt-2">{lost}</p><Link className="ar-btn mt-4" href="/arcade/host">Host a new game</Link></div></div>;
  if (!view) return <div className="ar-wrap ar-h2">Loading dashboard…</div>;

  const playing = view.phase === "playing";
  const needed = Math.max(...view.playlist.map((g: string) => GAME_CATALOG[g].min));
  const canStart = view.phase === "lobby" && view.players.length >= needed;
  const joinUrl = `${origin}/arcade/join?code=${view.code}`;
  const sel: string[] = view.playlist;
  const toggleGame = (g: string) => { const next = sel.includes(g) ? sel.filter((x) => x !== g) : [...sel, g]; if (next.length) cmd("playlist", { playlist: next }); };
  const compat = sets.find((s) => s.id === (view.content?.title === "Arcade starter pack" ? "builtin" : sets.find((x) => x.title === view.content?.title)?.id))?.compatibility;

  return (
    <>
      <header className="ar-topbar"><div className="flex items-center gap-3"><Link href="/arcade" className="font-bold underline">← Arcade</Link><span className="ar-pill">Teacher dashboard</span></div><PrefsButtons /></header>
      {offline && <Banner>📡 Connection lost - retrying…</Banner>}
      {view.paused && <Banner>⏸ Game paused - students see a pause banner</Banner>}
      <main className="ar-wrap grid gap-5">
        <section className="ar-panel grid items-center gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <p className="ar-muted font-bold">Students join at <b className="text-[var(--sun)]">{origin.replace(/^https?:\/\//, "")}/arcade/join</b> with code</p>
            <p className="ar-code" aria-label={`Room code ${view.code.split("").join(" ")}`}>{view.code}</p>
            <p className="mt-1 text-lg font-bold">{view.players.length} / 40 players · {view.players.filter((p: any) => p.connected).length} connected</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a className="ar-btn sky" href={`/arcade/room/${view.code}/projector`} target="_blank" rel="noreferrer">📽 Projector mode</a>
            <button className="ar-btn paper" onClick={() => navigator.clipboard?.writeText(joinUrl).catch(() => undefined)}>📋 Copy join link</button>
          </div>
        </section>

        {view.phase === "lobby" && (
          <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="ar-panel grid gap-4">
              <div><h2 className="ar-h2">Choose games</h2>
                <p className="ar-muted">Pick one game or build a playlist - they run in the order you click. Scores are normalised so no game dominates.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {GAME_IDS.map((g: string) => { const c = GAME_CATALOG[g]; const on = sel.includes(g); return (
                    <button key={g} aria-pressed={on} onClick={() => toggleGame(g)} className="ar-card text-left" style={{ background: on ? c.color : "var(--paper)", color: on ? "#fff" : "var(--ink)", textShadow: on ? "0 2px 0 rgba(0,0,0,.25)" : undefined }}>
                      <div className="flex items-center justify-between"><span className="text-3xl">{c.icon}</span>{on && <span className="ar-chip">#{sel.indexOf(g) + 1}</span>}</div>
                      <div className="mt-1 text-xl font-bold">{c.name}</div><div className="text-sm opacity-90">{c.minutes} min · {c.min}+ players</div>
                    </button>); })}
                </div>
                <div className="mt-3 flex flex-wrap gap-2"><button className="ar-btn sm grape" onClick={() => cmd("playlist", { playlist: GAME_IDS })}>🎉 Arcade Party (all five)</button>{GAME_IDS.map((g: string) => <button key={g} className="ar-btn sm paper" onClick={() => cmd("playlist", { playlist: [g] })}>Only {GAME_CATALOG[g].name}</button>)}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-1 font-bold">Question / word set
                  <select className="ar-input" value={sets.find((s) => s.title === view.content?.title)?.id ?? "builtin"} onChange={(e) => cmd("content", { setId: e.target.value })}>{sets.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
                <label className="grid gap-1 font-bold">Scoring
                  <select className="ar-input" value={view.settings.teams} onChange={(e) => cmd("settings", { teams: Number(e.target.value), lateJoin: view.settings.lateJoin ? "open" : "closed" })}><option value={0}>Solo</option>{[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} teams</option>)}</select></label>
                <label className="grid gap-1 font-bold">Late joiners
                  <select className="ar-input" value={view.settings.lateJoin ? "open" : "closed"} onChange={(e) => cmd("settings", { teams: view.settings.teams, lateJoin: e.target.value })}><option value="open">Wait for next game</option><option value="closed">Not allowed</option></select></label>
              </div>
              {compat && <div className="flex flex-wrap gap-2" aria-label="Content compatibility">{sel.map((g) => <span key={g} className="ar-pill" style={{ background: compat[g]?.ok ? "rgba(47,209,165,.25)" : "rgba(255,93,115,.3)" }}>{GAME_CATALOG[g].icon} {compat[g]?.ok ? `${compat[g].count} ${compat[g].label}` : `Not enough ${compat[g]?.label} - using built-in`}</span>)}</div>}
              <div className="flex flex-wrap items-center gap-3">
                <button className="ar-btn coral xl" disabled={!canStart} onClick={() => cmd("start")}>▶ Start {sel.length > 1 ? "playlist" : GAME_CATALOG[sel[0]].name}</button>
                {!canStart && <span className="font-bold text-[var(--sun)]">Need at least {needed} players to start.</span>}
              </div>
            </div>
            <PlayerList view={view} onRemove={(id) => cmd("remove", { playerId: id })} />
          </section>
        )}

        {view.phase !== "lobby" && (
          <section className="ar-panel flex flex-wrap items-center gap-3">
            <b className="mr-2">Controls</b>
            {view.paused ? <button className="ar-btn mint" onClick={() => cmd("resume")}>▶ Resume</button> : <button className="ar-btn sun" onClick={() => cmd("pause")} disabled={view.phase === "ended"}>⏸ Pause</button>}
            <button className="ar-btn sky" onClick={() => cmd("skip")} disabled={!["playing", "intro", "results"].includes(view.phase)}>⏭ Skip {view.phase === "playing" ? "round" : "ahead"}</button>
            {(view.phase === "final" || view.phase === "results") && view.phase === "final" && <button className="ar-btn lime" onClick={() => cmd("restart")}>🔁 Play again (new lobby)</button>}
            <button className="ar-btn coral" onClick={() => { if (confirm("End this session for everyone?")) cmd("end"); }} disabled={view.phase === "ended"}>⏹ End session</button>
            <span className="ar-pill">Game {Math.max(1, view.gameIndex + 1)} of {view.playlist.length}</span>
          </section>
        )}

        {view.phase === "intro" && <IntroScreen view={view} stamp={stamp} />}
        {view.phase === "playing" && <HostLive view={view} stamp={stamp} room={room} onRemove={(id: string) => cmd("remove", { playerId: id })} />}
        {view.phase === "results" && <ResultsScreen view={view} stamp={stamp} projector />}
        {view.phase === "final" && <FinalScreen view={view} projector />}
        {view.phase === "ended" && <div className="ar-panel text-center ar-h2">Session ended. Thanks for playing!</div>}
      </main>
      <ErrorToast msg={toast} />
    </>
  );
}

function PlayerList({ view, onRemove }: { view: any; onRemove: (id: string) => void }) {
  return (
    <div className="ar-panel"><h2 className="mb-2 font-bold">Players ({view.players.length})</h2>
      <ul className="grid max-h-[520px] gap-2 overflow-auto">
        {view.players.length === 0 && <li className="ar-muted">Nobody yet - share the code!</li>}
        {view.players.map((p: any) => (
          <li key={p.id} className={`lb-row ${p.connected ? "" : "opacity-50"}`}><Avatar id={p.avatar} size={30} /><span className="flex-1 truncate">{p.nickname}{p.waiting ? " ⏳" : ""}</span>
            <span title={p.connected ? "Connected" : "Disconnected"}>{p.connected ? "🟢" : "🔴"}</span>
            <button className="ar-btn sm coral" style={{ minHeight: 30, padding: "0 10px" }} onClick={() => { if (confirm(`Remove ${p.nickname}?`)) onRemove(p.id); }} aria-label={`Remove ${p.nickname}`}>✕</button></li>
        ))}
      </ul></div>
  );
}

function HostLive({ view, stamp, room, onRemove }: any) {
  const [pin, setPin] = useState<number | null>(null);
  const [auto, setAuto] = useState(0);
  const groups = view.game?.groups ?? [];
  useEffect(() => { const t = setInterval(() => setAuto((a) => a + 1), 9000); return () => clearInterval(t); }, []);
  const featured = groups.length ? (pin ?? auto % groups.length) : undefined;
  useEffect(() => { room.optsRef.current = { ...room.optsRef.current, group: featured }; }, [featured, room.optsRef]);
  return (
    <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="grid gap-4">
        {groups.length > 1 && (
          <div className="ar-panel"><p className="mb-2 font-bold">Groups (pinned: {pin == null ? "auto-rotating" : pin + 1})</p>
            <div className="flex flex-wrap gap-2">{groups.map((g: any, i: number) => <button key={i} className={`ar-btn sm ${featured === i ? "sky" : "paper"}`} onClick={() => setPin(pin === i ? null : i)}>G{i + 1} {g.status ?? g.phase ?? ""}</button>)}</div></div>
        )}
        <GameSwitch view={view} stamp={stamp} send={async () => { throw new Error("Teachers watch - students play."); }} meId={undefined} optsRef={room.optsRef} projector />
      </div>
      <div className="grid content-start gap-4">
        <Leaderboard rows={view.leaderboard ?? []} limit={10} title="Live leaderboard" showPoints />
        {view.teams && <TeamBoard teams={view.teams} />}
        <PlayerList view={view} onRemove={onRemove} />
      </div>
    </section>
  );
}
