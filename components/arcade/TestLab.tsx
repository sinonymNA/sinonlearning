"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react";
import { api, saveCreds } from "./useRoom";
import { GAME_CATALOG, GAME_IDS } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function TestLab() {
  const [code, setCode] = useState<string>("");
  const [sel, setSel] = useState<string[]>(["hot_potato"]);
  const [bots, setBots] = useState(34);
  const [behavior, setBehavior] = useState("mixed");
  const [scale, setScale] = useState(1);
  const [state, setState] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [lat, setLat] = useState<number[]>([]);
  const stop = useRef(false);

  const run = useCallback(async (body: any) => { try { const d = await api("/api/arcade/dev", body); setMsg(null); return d; } catch (e: any) { setMsg(e.message); throw e; } }, []);
  useEffect(() => { try { const c = sessionStorage.getItem("arcade:lab"); if (c) setCode(c); } catch { /* ignore */ } }, []);
  useEffect(() => {
    if (!code) return; stop.current = false;
    const tick = async () => {
      if (stop.current) return;
      const t0 = performance.now();
      try { const d = await api("/api/arcade/dev", { type: "state", code }); setState(d); setLat((l) => [...l.slice(-29), Math.round(performance.now() - t0)]); } catch (e: any) { setMsg(e.message); }
      setTimeout(tick, 1000);
    };
    tick(); return () => { stop.current = true; };
  }, [code]);

  async function create() { const d = await run({ type: "create", playlist: sel, bots, behavior, timeScale: scale }); setCode(d.code); try { sessionStorage.setItem("arcade:lab", d.code); } catch { /* ignore */ } }
  async function joinSelf() { const d = await run({ type: "join_self", code }); saveCreds(code, { playerId: d.playerId, token: d.token, nickname: "Dev" }); window.open(`/arcade/room/${code}`, "_blank"); }
  const host = (cmd: string, args: any = {}) => run({ type: "host", code, cmd, args });
  const v = state?.view;
  const avgLat = lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : 0;

  return (
    <div className="grid gap-5">
      <section className="ar-panel grid gap-4">
        <h2 className="ar-h2">1. Create a test room</h2>
        <div className="flex flex-wrap gap-2">{GAME_IDS.map((g: string) => <button key={g} aria-pressed={sel.includes(g)} className={`ar-btn sm ${sel.includes(g) ? "" : "paper"}`} onClick={() => setSel(sel.includes(g) ? (sel.length > 1 ? sel.filter((x) => x !== g) : sel) : [...sel, g])}>{GAME_CATALOG[g].icon} {GAME_CATALOG[g].name}</button>)}<button className="ar-btn sm grape" onClick={() => setSel(GAME_IDS)}>All games</button></div>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="grid gap-1 font-bold">Bots: {bots}<input type="range" min={0} max={39} value={bots} onChange={(e) => setBots(Number(e.target.value))} /></label>
          <label className="grid gap-1 font-bold">Bot behavior<select className="ar-input" value={behavior} onChange={(e) => setBehavior(e.target.value)}>{["mixed", "smart", "average", "sloppy", "afk", "chaotic"].map((b) => <option key={b}>{b}</option>)}</select></label>
          <label className="grid gap-1 font-bold">Time scale<select className="ar-input" value={scale} onChange={(e) => setScale(Number(e.target.value))}><option value={1}>Real time</option><option value={0.5}>2x faster</option><option value={0.25}>4x faster</option><option value={0.1}>10x faster</option></select></label>
          <div className="flex items-end"><button className="ar-btn coral" onClick={create}>Create test room</button></div>
        </div>
        <p className="ar-muted text-sm">Bots act through the same server-side validation as students. Create with up to 39 bots, then join as the 40th (real) player.</p>
      </section>
      {msg && <div role="alert" className="ar-banner rounded-xl">{msg}</div>}
      {code && v && (
        <>
          <section className="ar-panel grid gap-3">
            <div className="flex flex-wrap items-center gap-3"><span className="ar-code" style={{ fontSize: "2.4rem" }}>{code}</span><span className="ar-pill">phase: {v.phase}{v.paused ? " (paused)" : ""}</span><span className="ar-pill">game {v.gameIndex + 1}/{v.playlist.length}: {v.gameId ?? v.next?.name ?? "-"}</span><span className="ar-pill">{v.players.length} players</span></div>
            <div className="flex flex-wrap gap-2">
              <button className="ar-btn sm sky" onClick={joinSelf}>🎮 Join as real player</button>
              <button className="ar-btn sm mint" onClick={() => host("start")} disabled={v.phase !== "lobby"}>▶ Start</button>
              <button className="ar-btn sm" onClick={() => host(v.paused ? "resume" : "pause")}>{v.paused ? "Resume" : "Pause"}</button>
              <button className="ar-btn sm" onClick={() => host("skip")}>⏭ Skip</button>
              <button className="ar-btn sm coral" onClick={() => host("end")}>End</button>
              <button className="ar-btn sm paper" onClick={() => run({ type: "spawn", code, count: 5, behavior })}>+5 bots</button>
              <button className="ar-btn sm paper" onClick={() => run({ type: "disconnect", code, count: 10 })}>Disconnect 10 bots</button>
              <button className="ar-btn sm paper" onClick={() => run({ type: "disconnect", code })}>Disconnect all bots</button>
              <button className="ar-btn sm paper" onClick={() => run({ type: "reconnect", code })}>Reconnect all</button>
              <a className="ar-btn sm paper" href={`/arcade/room/${code}/projector`} target="_blank" rel="noreferrer">📽 Projector</a>
              <a className="ar-btn sm paper" href={`/arcade/room/${code}/host`} target="_blank" rel="noreferrer">🎤 Host view</a>
            </div>
            {v.phase === "lobby" && <div className="flex flex-wrap gap-2"><span className="font-bold">Change playlist:</span>{GAME_IDS.map((g: string) => <button key={g} className="ar-btn sm paper" onClick={() => run({ type: "set_game", code, playlist: [g] })}>{GAME_CATALOG[g].name}</button>)}</div>}
          </section>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="ar-panel"><h3 className="mb-2 font-bold">Metrics</h3><ul className="grid gap-1 text-sm tabular-nums">
              <li>Connected: {state.metrics.connected}/{state.metrics.players}</li><li>Actions: {state.metrics.actions} (rejected {state.metrics.rejected})</li><li>Polls: {state.metrics.polls}</li>
              <li>Tick avg/max: {state.metrics.tickMsAvg.toFixed(2)} / {state.metrics.tickMsMax.toFixed(1)} ms</li><li>Round-trip (browser): {avgLat} ms</li><li>Memory: {state.metrics.rssMb} MB rss / {state.metrics.heapMb} MB heap</li><li>Uptime: {state.metrics.uptimeSec}s · rooms: {state.metrics.rooms}</li></ul></div>
            <div className="ar-panel"><h3 className="mb-2 font-bold">Live scores</h3><ol className="grid max-h-64 gap-1 overflow-auto text-sm">{state.scores.slice(0, 25).map((s: any, i: number) => <li key={s.id} className="flex justify-between"><span>{i + 1}. {s.nickname} {s.connected ? "" : "🔴"}</span><b>{s.total} <span className="opacity-60">+{s.points}</span></b></li>)}</ol></div>
            <div className="ar-panel"><h3 className="mb-2 font-bold">Bots ({state.bots.length})</h3><div className="grid max-h-64 gap-1 overflow-auto text-xs">{state.bots.map((b: any) => <div key={b.id} className="flex justify-between"><span>{b.nickname} · {b.kind} {b.offline ? "🔴" : ""}</span><span>{b.actions} act / {b.errors} err</span></div>)}</div></div>
          </section>
          <section className="ar-panel"><h3 className="mb-2 font-bold">Game log (latest 120)</h3><div className="max-h-72 overflow-auto rounded-xl bg-black/40 p-3 font-mono text-xs">{[...state.logs].reverse().map((l: any, i: number) => <div key={i}>[{Math.round(l.at / 1000)}s] {l.type} {JSON.stringify({ ...l, at: undefined, type: undefined })}</div>)}</div></section>
          {v.game && <details className="ar-panel"><summary className="cursor-pointer font-bold">Inspect authoritative game state (developer view incl. secrets)</summary><pre className="mt-2 max-h-96 overflow-auto rounded-xl bg-black/40 p-3 text-xs">{JSON.stringify(v.game, null, 1).slice(0, 12000)}</pre></details>}
        </>
      )}
    </div>
  );
}
