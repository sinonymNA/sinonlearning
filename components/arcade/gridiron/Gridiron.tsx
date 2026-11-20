"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs, @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Game, PlaySim, PLAYBOOK, SIM, FIELD, OPPONENT, TEAMS } from "../../../arcade-server/gridiron/index.mjs";
import { PrefsProvider, PrefsButtons, sfx } from "../prefs";
import { CW, CH, VIEW, VW, LABEL_COLORS, drawField, drawPlayer, drawBall, drawRing, drawRoutes, drawLanding, drawEdgeMarkers, drawParticles, stepParticles, type Cam, type Particle } from "./render";
import "./gridiron.css";

type Screen = "menu" | "plays" | "fourth" | "presnap" | "live" | "fg" | "cpu" | "final";
type Hud = {
  score: { you: number; cpu: number }; qLabel: string; clock: number; down: string; spot: string; phase: string; seps: number[]; pressure: boolean;
  playName: string; blurb: string; carrying: boolean; canThrow: boolean; mode: string; possession: string;
};
const DIFFS: { id: "easy" | "normal" | "hard"; label: string }[] = [{ id: "easy", label: "ROOKIE" }, { id: "normal", label: "PRO" }, { id: "hard", label: "LEGEND" }];
const mmss = (s: number) => { const t = Math.max(0, Math.ceil(s)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const spotText = (yl: number) => (Math.round(yl) === 50 ? "50" : yl < 50 ? `OWN ${Math.max(1, Math.round(yl))}` : `OPP ${Math.max(1, Math.round(100 - yl))}`);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const BANNER: Record<string, (r: any) => [string, string]> = {
  td: () => ["TOUCHDOWN!", "good"], interception: () => ["INTERCEPTED!", "bad"], sack: (r) => [`SACKED  ${Math.round(r.yards)}`, "bad"],
  incomplete: () => ["INCOMPLETE", "neutral"], drop: () => ["DROPPED!", "neutral"], deflection: () => ["BROKEN UP", "neutral"],
  oob: (r) => [`OUT OF BOUNDS  ${r.yards >= 0 ? "+" : ""}${Math.round(r.yards)}`, "good"], tackle: (r) => [`${r.yards >= 0 ? "+" : ""}${Math.round(r.yards)} YARDS`, r.yards >= 0 ? "good" : "bad"],
};

export default function Gridiron() { return <PrefsProvider><GridironInner /></PrefsProvider>; }

function PlayDiagram({ id }: { id: string }) {
  const p = PLAYBOOK.find((x: any) => x.id === id)!;
  return (
    <svg viewBox="-28 -30 56 36" className="gr-diagram" aria-hidden>
      <rect x="-28" y="-30" width="56" height="36" fill="#1f6b2e" />
      <line x1="-28" y1="0" x2="28" y2="0" stroke="#3b82f6" strokeWidth="0.8" />
      {[-4, -2, 0, 2, 4].map((x) => <rect key={x} x={x - 0.9} y="0.3" width="1.8" height="1.8" fill="#dbe6ff" />)}
      {p.receivers.map((r: any, i: number) => {
        let x = r.start.x, y = -r.start.dy; const pts = [`${x},${y}`];
        for (const w of r.route) pts.push(`${r.start.x + w.dx},${-(r.start.dy + w.dy)}`);
        const last = pts[pts.length - 1].split(",");
        return <g key={i}><polyline points={pts.join(" ")} fill="none" stroke={LABEL_COLORS[i]} strokeWidth="1.3" strokeLinejoin="round" strokeDasharray={p.kind === "screen" && i !== 0 ? "1.5 1.5" : undefined} /><circle cx={x} cy={y} r="1.6" fill={LABEL_COLORS[i]} /><circle cx={last[0]} cy={last[1]} r="1.1" fill="#fff" /></g>;
      })}
    </svg>
  );
}

function GridironInner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const R = useRef<any>({
    game: null, sim: null, preview: false, screen: "menu", paused: false, cam: { bottom: -3, left: 0 } as Cam, parts: [] as Particle[], freezeUntil: 0, shake: 0, suggest: [] as string[], sIdx: 0, cheerUntil: 0, camSnap: true, acc: 0, last: 0, tick: 0, deadAt: 0, hudAt: 0, input: { l: false, r: false, pl: false, pr: false },
    trail: [] as { x: number; y: number }[], sepShown: [3, 3, 3, 3], sepAt: -9, bannerTimer: 0, fg: { pos: 0, locked: false, t0: 0 }, fgTimer: 0, mode: "quick", diff: "normal", after: null as null | (() => void), heldScore: null as any,
  });
  const [screen, setScreenState] = useState<Screen>("menu");
  const [hud, setHud] = useState<Hud | null>(null);
  const [banner, setBanner] = useState<{ text: string; kind: string } | null>(null);
  const [paused, setPaused] = useState(false);
  const [diff, setDiff] = useState<"easy" | "normal" | "hard">("normal");
  const [howto, setHowto] = useState(false);
  const [cpuView, setCpuView] = useState<{ lines: string[]; shown: number; summary: string; kind: string; halftime: boolean; scoreAfter: { you: number; cpu: number }; points: number } | null>(null);
  const [fgView, setFgView] = useState<{ dist: number; chance: number; pos: number; locked: boolean; outcome?: string } | null>(null);
  const [finalView, setFinalView] = useState<any>(null);
  const [flash, setFlash] = useState(false);

  const setScreen = useCallback((s: Screen) => { R.current.screen = s; setScreenState(s); }, []);
  useEffect(() => { try { const d = localStorage.getItem("gridiron:diff"); if (d === "easy" || d === "normal" || d === "hard") { setDiff(d); R.current.diff = d; } } catch { /* storage blocked */ } }, []);

  // ---- hud ---------------------------------------------------------------------------------------------------
  const pushHud = useCallback(() => {
    const r = R.current, g = r.game, sim = r.sim; if (!g) return;
    const st = g.state();
    const live = r.screen === "live" && sim;
    const clock = live ? Math.max(0, g.clock - sim.t) : g.clock;
    let pressure = false;
    if (live && (sim.phase === "pocket" || sim.phase === "windup")) for (const d of sim.defenders) if (d.state === "RUSH" && Math.hypot(d.x - sim.qb.x, d.y - sim.qb.y) < 7) pressure = true;
    const play = sim && !r.preview ? sim.play : null;
    setHud({
      score: r.heldScore ?? st.score, qLabel: st.qLabel, clock, down: g.downText(), spot: spotText(st.yardline), phase: sim ? sim.phase : "presnap", seps: [...r.sepShown], pressure,
      playName: play ? play.name : "", blurb: play ? play.blurb : "", carrying: !!live && sim.phase === "carry", canThrow: !!live && sim.phase === "pocket", mode: st.mode, possession: r.heldScore || r.screen === "cpu" ? "cpu" : st.possession,
    });
  }, []);

  const preview = useCallback(() => {
    const r = R.current, g = r.game; if (!g) return;
    r.sim = new PlaySim({ play: "slants", los: g.losY, seed: 7, coverage: "zone" }); r.preview = true; r.camSnap = true; r.deadAt = 0;
  }, []);

  // ---- flow ---------------------------------------------------------------------------------------------------
  const nextCall = useCallback(() => {
    const r = R.current, g = r.game; if (!g) return;
    setBanner(null); r.heldScore = null;
    if (g.phase === "final") { setFinalView(g.final); setScreen("final"); return; }
    if (g.phase === "cpu") { runCpu(); return; }
    if (g.down === 4) { preview(); setScreen("fourth"); pushHud(); } else setupPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runCpu = useCallback(() => {
    const r = R.current, g = r.game; if (!g) return;
    const before = { ...g.score }; const wasHalf = g.quarter;
    const drive = g.runOpponent(); if (!drive) { nextCall(); return; }
    const summary: Record<string, [string, string]> = {
      td: [`${TEAMS.cpu.name.toUpperCase()} SCORE  +${drive.points}`, "bad"], fg: ["THEY KICK A FIELD GOAL  +3", "bad"], punt: ["THEY PUNT. YOUR BALL", "good"], turnover: ["THEY TURN IT OVER. YOUR BALL", "good"],
      downs: ["TURNOVER ON DOWNS. YOUR BALL", "good"], clock: ["TIME RUNS OUT ON THE DRIVE", "neutral"], safety: ["SAFETY! +2 FOR YOU", "good"],
    };
    const [text, kind] = summary[drive.result] || ["DRIVE OVER", "neutral"];
    r.heldScore = before;
    const lines = drive.plays.length ? drive.plays.map((p: any) => p.text) : ["Kneel down."];
    setCpuView({ lines, shown: 0, summary: text, kind, halftime: g.phase === "cpu" || (wasHalf === 2 && g.quarter === 3), scoreAfter: { ...g.score }, points: drive.points });
    setScreen("cpu"); pushHud();
  }, [nextCall, pushHud, setScreen]);

  const startGame = useCallback((mode: "quick" | "twoMinute") => {
    const r = R.current; r.mode = mode;
    r.game = new Game({ mode, difficulty: r.diff, seed: (Math.random() * 1e9) >>> 0 });
    setFinalView(null); setCpuView(null); setBanner(null); setPaused(false); r.paused = false; r.heldScore = null;
    nextCall();
  }, [nextCall]);

  const choosePlay = useCallback((id: string) => {
    const r = R.current, g = r.game; if (!g || g.phase !== "playcall") return;
    r.sim = g.beginPlay(id); r.preview = false; r.camSnap = true; r.deadAt = 0; r.acc = 0; r.sepAt = -9;
    setScreen("presnap"); pushHud(); sfx("pop");
  }, [pushHud, setScreen]);

  /** The coordinator calls the play; the player can audible to one of three situational options. */
  const setupPlay = useCallback(() => {
    const r = R.current, g = r.game; if (!g) return;
    r.suggest = g.suggestPlays(); r.sIdx = 0; choosePlay(r.suggest[0]);
  }, [choosePlay]);
  const audible = useCallback(() => {
    const r = R.current; if (r.screen !== "presnap" || !r.suggest.length) return;
    r.sIdx = (r.sIdx + 1) % r.suggest.length; choosePlay(r.suggest[r.sIdx]); sfx("pop");
  }, [choosePlay]);

  const snap = useCallback(() => {
    const r = R.current; if (r.screen !== "presnap" || !r.sim) return;
    r.sim.snap(); r.acc = 0; setScreen("live"); sfx("tick"); pushHud();
  }, [pushHud, setScreen]);

  const doThrow = useCallback((idx: number) => {
    const r = R.current; if (r.screen !== "live" || r.paused || !r.sim || r.sim.phase !== "pocket") return;
    r.sim.throwTo(idx);
  }, []);

  const puntNow = useCallback(() => {
    const r = R.current, g = r.game; if (!g) return;
    g.punt(); setBanner({ text: "PUNT", kind: "neutral" }); setScreen("live"); r.deadAt = performance.now(); r.after = nextCall; r.sim = r.sim; pushHud();
  }, [nextCall, pushHud, setScreen]);

  const openFG = useCallback(() => {
    const r = R.current, g = r.game; if (!g || !g.canFG) return;
    r.fg = { pos: 0, locked: false, t0: performance.now() }; setFgView({ dist: g.fgDistance, chance: g.state().fgChance, pos: 0, locked: false }); setScreen("fg");
  }, [setScreen]);

  const lockKick = useCallback(() => {
    const r = R.current, g = r.game; if (r.screen !== "fg" || r.fg.locked || !g) return;
    r.fg.locked = true; const q = 1 - Math.min(1, Math.abs(r.fg.pos - 0.5) * 2);
    const before = g.score.you; g.kickFieldGoal(q); const good = g.score.you > before;
    setFgView((v) => (v ? { ...v, locked: true, pos: r.fg.pos, outcome: good ? "GOOD!" : "NO GOOD" } : v)); sfx(good ? "win" : "bad");
    window.clearTimeout(r.fgTimer); r.fgTimer = window.setTimeout(() => { setFgView(null); nextCall(); }, 1700);
  }, [nextCall]);

  const finishPlay = useCallback(() => {
    const r = R.current, g = r.game, sim = r.sim; if (!g || !sim?.result) return;
    g.finishPlay(sim.result); r.deadAt = 0; r.heldScore = null;
    // let the player see the stat line for a moment, then move on
    nextCall();
  }, [nextCall]);

  const pause = useCallback((p: boolean) => { R.current.paused = p; setPaused(p); }, []);
  const toMenu = useCallback(() => { const r = R.current; r.game = null; r.sim = null; setBanner(null); setCpuView(null); setFgView(null); pause(false); setScreen("menu"); }, [pause, setScreen]);
  const restart = useCallback(() => { startGame(R.current.mode); }, [startGame]);

  // ---- keyboard -----------------------------------------------------------------------------------------------
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const r = R.current; if (e.repeat && !["ArrowLeft", "ArrowRight"].includes(e.code)) return;
      const k = e.code;
      if (k === "Escape" || k === "KeyP") { if (r.screen === "live" || r.screen === "presnap") { e.preventDefault(); pause(!r.paused); } return; }
      if (r.paused) return;
      if (k === "Space" || k === "Enter") {
        e.preventDefault();
        if (r.screen === "presnap") snap(); else if (r.screen === "fg") lockKick(); else if (r.screen === "cpu") document.getElementById("gr-continue")?.click();
        return;
      }
      if (r.screen === "live") {
        const phase = r.sim?.phase;
        if (phase === "pocket") { const idx = ["KeyA", "KeyB", "KeyC", "KeyD"].indexOf(k); const d = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(k); if (idx >= 0 || d >= 0) { e.preventDefault(); doThrow(idx >= 0 ? idx : d); } }
        if (k === "ArrowLeft") { r.input.l = true; e.preventDefault(); } if (k === "ArrowRight") { r.input.r = true; e.preventDefault(); }
        if (phase === "carry" && k === "KeyA") r.input.l = true; if (phase === "carry" && k === "KeyD") r.input.r = true;
      }
      if (r.screen === "presnap" && (k === "KeyX" || k === "Tab")) { e.preventDefault(); audible(); }
    };
    const up = (e: KeyboardEvent) => { const r = R.current; if (e.code === "ArrowLeft" || e.code === "KeyA") r.input.l = false; if (e.code === "ArrowRight" || e.code === "KeyD") r.input.r = false; };
    const vis = () => { if (document.hidden && (R.current.screen === "live")) pause(true); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); document.addEventListener("visibilitychange", vis);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); document.removeEventListener("visibilitychange", vis); };
  }, [audible, doThrow, lockKick, pause, snap]);

  // CPU drive reveal
  useEffect(() => {
    if (screen !== "cpu" || !cpuView) return;
    if (cpuView.shown >= cpuView.lines.length) { R.current.heldScore = null; pushHud(); return; }
    const id = window.setTimeout(() => { setCpuView((v) => (v ? { ...v, shown: v.shown + 1 } : v)); sfx("tick"); }, 320);
    return () => window.clearTimeout(id);
  }, [screen, cpuView, pushHud]);

  // ---- main loop ---------------------------------------------------------------------------------------------
  useEffect(() => {
    let raf = 0; const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext("2d"); if (!ctx) return;
    const burst = (x: number, y: number, n: number, colors: string[], o: { up?: number; spread?: number; g?: number; life?: number } = {}) => {
      const r = R.current;
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, sp = (o.spread ?? 4) * (0.3 + Math.random()); r.parts.push({ x, y, z: 0.8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: (o.up ?? 5) * (0.4 + Math.random()), life: 0, max: (o.life ?? 0.7) * (0.6 + Math.random() * 0.6), c: colors[(Math.random() * colors.length) | 0], s: 3 + ((Math.random() * 3) | 0), g: o.g ?? 16 }); }
    };
    const DUST = ["#d9c9a0", "#b8a67a", "#f2e8c9"], POP = ["#ffffff", "#ffe08a", "#ffd23f"], RED = ["#ff5d6c", "#ffffff", "#ff9aa4"], CONF = ["#ff5d9e", "#ffd23f", "#4cc3ff", "#86efac", "#ffffff", "#a98bff"];
    const juice = (ev: any, sim: any, ts: number) => {
      const r = R.current, c = sim.carrier || sim.qb, bp = sim.ballPos();
      const hit = (ms: number, sh: number) => { r.freezeUntil = ts + ms; r.shake = Math.max(r.shake, sh); };
      if (ev.type === "catch") { burst(c.x, c.y, 16, POP, { up: 6, spread: 5 }); hit(75, 2); }
      else if (ev.type === "tackle") { burst(c.x, c.y, 22, DUST, { up: 4, spread: 6 }); hit(95, 3.5); }
      else if (ev.type === "broken") { burst(c.x, c.y, 10, POP, { spread: 6 }); hit(45, 1.5); }
      else if (ev.type === "int") { burst(bp.x, bp.y, 24, RED, { up: 7, spread: 7 }); hit(130, 5); }
      else if (ev.type === "sack") { burst(sim.qb.x, sim.qb.y, 24, DUST, { up: 5, spread: 7 }); hit(110, 4.5); }
      else if (ev.type === "td") { burst(c.x, c.y, 110, CONF, { up: 11, spread: 9, g: 14, life: 1.7 }); hit(110, 3); r.cheerUntil = ts + 3500; setFlash(true); window.setTimeout(() => setFlash(false), 450); }
      else if (ev.type === "deflect" || ev.type === "drop" || ev.type === "incomplete") { burst(bp.x, bp.y, 8, ["#ffffff", "#cfe0ff"], { spread: 4 }); hit(40, 1.2); }
      else if (ev.type === "oob") { hit(30, 1); }
    };
    const loop = (ts: number) => {
      const r = R.current; const dt = clamp((ts - (r.last || ts)) / 1000, 0, 0.05); r.last = ts; r.tick++;
      const g = r.game, sim = r.sim;
      const frozen = ts < r.freezeUntil;
      if (r.after && r.deadAt && !r.paused && ts - r.deadAt > 1000) { const a = r.after; r.after = null; r.deadAt = 0; a(); }
      else if (sim && g && r.screen === "live" && !r.paused && !r.after) {
        if (sim.phase !== "dead") {
          if (!frozen) r.acc += dt * SIM.GAME_SPEED; let n = 0;
          const lat = (r.input.l ? -1 : 0) + (r.input.r ? 1 : 0) + (r.input.pl ? -1 : 0) + (r.input.pr ? 1 : 0);
          while (!frozen && r.acc >= SIM.DT && n < 5 && sim.phase !== "dead") { sim.setLateral(clamp(lat, -1, 1)); sim.step(SIM.DT); r.acc -= SIM.DT; n++; }
          for (const e of sim.drainEvents()) {
            juice(e, sim, ts);
            if (e.type === "throw") sfx("whoosh"); else if (e.type === "catch") sfx("good"); else if (e.type === "tackle") sfx("boom"); else if (e.type === "int" || e.type === "sack") sfx("bad");
            else if (e.type === "td") sfx("win"); else if (e.type === "drop" || e.type === "deflect" || e.type === "incomplete" || e.type === "broken" || e.type === "missed") sfx("pop"); else if (e.type === "oob") sfx("tick");
          }
          if (sim.phase === "dead" && sim.result) {
            r.deadAt = ts; const [text, kind] = (BANNER[sim.result.kind] || (() => ["PLAY OVER", "neutral"]))(sim.result); setBanner({ text, kind });
          }
          if (sim.phase === "pocket" && sim.t - r.sepAt > 0.4) { r.sepAt = sim.t; r.sepShown = sim.wr.map((w: any, i: number) => clamp(sim.separation(w) + Math.sin(sim.t * 2.1 + i * 1.7) * 0.7, 0, 9)); }
        } else if (r.deadAt && ts - r.deadAt > (sim.result?.kind === "td" ? 2300 : 1150)) { r.deadAt = 0; finishPlay(); }
      }
      if (g && sim && ts - r.hudAt > 90) { r.hudAt = ts; pushHud(); }
      if (!frozen && !r.paused) stepParticles(r.parts, dt);
      r.shake *= Math.exp(-11 * dt); if (r.shake < 0.15) r.shake = 0;
      if (r.screen === "fg" && !r.fg.locked) { const t = (performance.now() - r.fg.t0) / 1000; const ph = (t * 0.85) % 2; r.fg.pos = ph < 1 ? ph : 2 - ph; setFgView((v) => (v && !v.locked ? { ...v, pos: r.fg.pos } : v)); }
      if (sim && g) {
        const cam: Cam = r.cam, los = sim.los; let tb = cam.bottom, tl = cam.left;
        if (["presnap", "pocket", "windup"].includes(sim.phase)) {
          let top = los; for (const w of sim.wr) top = Math.max(top, w.y);
          tb = Math.min(Math.max(los - 9, top - (VIEW - 6)), sim.qb.y - 3); tl = FIELD.CX - VW / 2;
        } else if (sim.phase === "flight") { const bp = sim.ballPos(); tb = Math.min(Math.max(los - 9, bp.y - 20), sim.qb.y - 3 + (bp.y - los) * 0.5); tl = FIELD.CX - VW / 2 + (bp.x - FIELD.CX) * 0.3; }
        else if (sim.phase === "carry" && sim.carrier) { tb = sim.carrier.y - 9; tl = sim.carrier.x - VW / 2; }
        tb = clamp(tb, -3, FIELD.LEN + 3 - VIEW); tl = clamp(tl, -3, FIELD.W + 3 - VW);
        if (r.camSnap) { cam.bottom = tb; cam.left = tl; r.camSnap = false; } else { const k = 1 - Math.exp(-6 * dt); cam.bottom += (tb - cam.bottom) * k; cam.left += (tl - cam.left) * k; }
        const snapS = sim.snapshot();
        const ox = r.shake ? Math.round((Math.random() - 0.5) * 2 * r.shake) : 0, oy = r.shake ? Math.round((Math.random() - 0.5) * 2 * r.shake) : 0;
        ctx.fillStyle = "#171a2e"; ctx.fillRect(0, 0, CW, CH); ctx.save(); ctx.translate(ox, oy);
        drawField(ctx, cam, { losY: los, firstY: g.firstY, tick: r.tick, cheer: ts < r.cheerUntil });
        const showRoutes = !r.preview && ["presnap", "pocket", "windup"].includes(sim.phase);
        if (showRoutes) drawRoutes(ctx, sim.wr, cam, sim.phase === "presnap" ? 0.95 : 0.4, sim.phase === "presnap", r.tick);
        const res = sim.result; const players = [...snapS.players].sort((a: any, b: any) => b.y - a.y);
        for (const p of players) {
          const prone = sim.phase === "dead" && res && ((res.kind === "sack" && p.id === "QB") || (res.kind === "tackle" && p.ball));
          drawPlayer(ctx, p, cam, r.tick, { you: p.team === "o", prone: !!prone, label: !r.preview && p.role === "WR" && sim.phase !== "carry" && sim.phase !== "dead", selected: sim.thrownTo != null && p.id === "WR" + sim.thrownTo });
        }
        if (sim.phase === "carry" && sim.carrier) drawRing(ctx, sim.carrier.x, sim.carrier.y, cam, "#ffd23f", r.tick);
        if (snapS.landing) drawLanding(ctx, snapS.landing, cam);
        let ball = snapS.ball;
        if (sim.phase === "dead" && res && res.incomplete && sim.target && r.deadAt) { const tt = (ts - r.deadAt) / 1000; ball = { x: sim.target.x + tt * 1.2, y: sim.target.y - tt * 0.6, z: Math.abs(Math.sin(tt * 8.5)) * 2.6 * Math.exp(-tt * 2.4) }; }
        if (sim.phase === "flight") { r.trail.push({ x: snapS.ball.x, y: snapS.ball.y }); if (r.trail.length > 7) r.trail.shift(); } else r.trail.length = 0;
        drawBall(ctx, ball, cam, sim.phase === "flight" ? r.trail : undefined);
        drawParticles(ctx, r.parts, cam);
        if (!r.preview && ["pocket", "windup", "presnap"].includes(sim.phase)) drawEdgeMarkers(ctx, sim.wr, cam);
        ctx.restore();
      } else { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, CW, CH); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [finishPlay, pushHud]);

  // touch steering: hold the left/right half of the field while carrying the ball
  const stagePtr = (e: React.PointerEvent, on: boolean) => {
    const r = R.current; if (r.screen !== "live" || r.sim?.phase !== "carry") return;
    if (!on) { r.input.pl = r.input.pr = false; return; }
    const b = (e.currentTarget as HTMLElement).getBoundingClientRect(); const left = e.clientX < b.left + b.width / 2;
    r.input.pl = left; r.input.pr = !left;
  };
  const padProps = (side: "pl" | "pr") => ({
    onPointerDown: (e: React.PointerEvent) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); R.current.input[side] = true; },
    onPointerUp: () => { R.current.input[side] = false; }, onPointerCancel: () => { R.current.input[side] = false; }, onLostPointerCapture: () => { R.current.input[side] = false; },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  useEffect(() => { if (typeof window !== "undefined" && location.search.includes("debug=1")) (window as any).__gr = { R, nextCall }; }, [nextCall]);
  const g = R.current.game;
  const inPlay = screen === "live" || screen === "presnap";
  const sepLvl = (s: number) => clamp((s - 0.6) / 5, 0.12, 1);

  return (
    <div className="gr-root" data-screen={screen}>
      {/* scoreboard */}
      {hud && screen !== "menu" && (
        <header className="gr-top" aria-label="Scoreboard">
          <div className="gr-team you"><span className="gr-short">{TEAMS.you.short}</span><b>{hud.score.you}</b>{hud.possession === "you" && <i className="gr-ball" aria-label="has the ball" />}</div>
          <div className="gr-clock"><span>{hud.qLabel}</span><b>{mmss(hud.clock)}</b></div>
          <div className="gr-team cpu"><b>{hud.score.cpu}</b><span className="gr-short">{TEAMS.cpu.short}</span>{hud.possession === "cpu" && <i className="gr-ball" aria-label="has the ball" />}</div>
          <div className="gr-dd">{hud.possession === "cpu" ? "OPPONENT BALL" : `${hud.down}  ·  ${hud.spot}`}</div>
          <div className="gr-tools">{inPlay && <button className="gr-mini" onClick={() => pause(true)} aria-label="Pause">II</button>}<PrefsButtons /></div>
        </header>
      )}

      <main className="gr-main">
        <aside className="gr-side left">
          <div className="gr-pad" aria-label="Steer left or right">
            <button className={`gr-key arrow ${hud?.carrying ? "hot" : ""}`} {...padProps("pl")} aria-label="Steer left">◀</button>
            <button className={`gr-key arrow ${hud?.carrying ? "hot" : ""}`} {...padProps("pr")} aria-label="Steer right">▶</button>
          </div>
          <small className="gr-hint">{hud?.carrying ? "STEER!" : "STEER AFTER THE CATCH"}<br />← → or A D</small>
        </aside>

        <section className="gr-stage" onPointerDown={(e) => stagePtr(e, true)} onPointerUp={(e) => stagePtr(e, false)} onPointerLeave={(e) => stagePtr(e, false)} onPointerCancel={(e) => stagePtr(e, false)}>
          <canvas ref={canvasRef} width={CW} height={CH} className="gr-canvas" aria-label="Football field" />
          <div className="gr-crt" aria-hidden />
          {hud?.pressure && <div className="gr-pressure" aria-hidden />}
          {flash && <div className="gr-flash" aria-hidden />}
          {banner && screen === "live" && <div className={`gr-banner ${banner.kind}`} role="status">{banner.text}</div>}
          {screen === "presnap" && hud && (
            <div className="gr-snapbar">
              <div className="gr-snapplay"><PlayDiagram id={R.current.sim?.play?.id ?? "slants"} /><div className="gr-playname"><b>{hud.playName.toUpperCase()}</b><small>{hud.blurb}</small></div></div>
              <div className="gr-row"><button className="gr-btn" onClick={audible} title="Change the call (X)">AUDIBLE ⟳</button><button className="gr-btn go" onClick={snap}>SNAP ▶</button></div>
            </div>
          )}

          {screen === "fourth" && g && (
            <div className="gr-panel narrow">
              <h2>4TH DOWN</h2>
              <p className="gr-sub">{g.downText()} · {spotText(g.yardline)}{g.canFG ? ` · ${g.fgDistance}-YD FG` : ""}</p>
              <div className="gr-col">
                <button className="gr-btn big go" onClick={setupPlay}>GO FOR IT</button>
                {g.canFG && <button className="gr-btn big" onClick={openFG}>FIELD GOAL <small>{Math.round(g.state().fgChance * 100)}% IF YOU HIT IT</small></button>}
                <button className="gr-btn big" onClick={puntNow}>PUNT</button>
              </div>
            </div>
          )}

          {screen === "fg" && fgView && (
            <div className="gr-panel narrow">
              <h2>FIELD GOAL</h2>
              <p className="gr-sub">{fgView.dist} YARDS · STOP THE MARKER IN THE MIDDLE</p>
              <div className="gr-meter"><i className="zone" /><i className="mark" style={{ left: `${fgView.pos * 100}%` }} /></div>
              {fgView.outcome ? <div className={`gr-result ${fgView.outcome === "GOOD!" ? "good" : "bad"}`}>{fgView.outcome}</div> : <button className="gr-btn big go" onClick={lockKick}>KICK!</button>}
            </div>
          )}

          {screen === "cpu" && cpuView && (
            <div className="gr-panel narrow cpu">
              <h2>{cpuView.halftime && g?.quarter === 3 ? "HALFTIME" : "OPPONENT DRIVE"}</h2>
              <ol className="gr-log">{cpuView.lines.slice(0, cpuView.shown).map((l, i) => <li key={i}>{l}</li>)}</ol>
              {cpuView.shown >= cpuView.lines.length && <div className={`gr-result ${cpuView.kind}`}>{cpuView.summary}</div>}
              <button id="gr-continue" className="gr-btn big go" onClick={() => { R.current.heldScore = null; nextCall(); }}>{cpuView.shown >= cpuView.lines.length ? "CONTINUE ▶" : "SKIP ▶"}</button>
            </div>
          )}

          {screen === "final" && finalView && (
            <div className="gr-panel narrow final">
              <h2>FINAL</h2>
              <div className="gr-final-score"><span>{TEAMS.you.short} <b>{finalView.score.you}</b></span><span>{TEAMS.cpu.short} <b>{finalView.score.cpu}</b></span></div>
              <div className={`gr-result ${finalView.result === "win" ? "good" : finalView.result === "loss" ? "bad" : "neutral"}`}>{finalView.result === "win" ? "YOU WIN!" : finalView.result === "loss" ? "YOU LOSE" : "TIE GAME"}</div>
              <ul className="gr-stats">
                <li><span>PASSES</span><b>{finalView.stats.comps}/{finalView.stats.passes}</b></li><li><span>YARDS</span><b>{finalView.stats.yards}</b></li>
                <li><span>TOUCHDOWNS</span><b>{finalView.stats.tds}</b></li><li><span>INTS</span><b>{finalView.stats.ints}</b></li><li><span>SACKS</span><b>{finalView.stats.sacks}</b></li>
              </ul>
              <div className="gr-col"><button className="gr-btn big go" onClick={restart}>PLAY AGAIN</button><button className="gr-btn" onClick={toMenu}>MENU</button><Link className="gr-btn" href="/arcade/solo">BACK TO ARCADE</Link></div>
            </div>
          )}

          {paused && (
            <div className="gr-panel narrow pause">
              <h2>PAUSED</h2>
              <div className="gr-col">
                <button className="gr-btn big go" onClick={() => pause(false)}>RESUME</button>
                <button className="gr-btn" onClick={restart}>RESTART GAME</button>
                <button className="gr-btn" onClick={toMenu}>MAIN MENU</button>
                <Link className="gr-btn" href="/arcade/solo">EXIT TO ARCADE</Link>
              </div>
            </div>
          )}

          {screen === "menu" && (
            <div className="gr-panel menu">
              <div className="gr-logo"><span>RETRO</span><b>GRIDIRON</b></div>
              <p className="gr-sub">Read the defence. Pick your target. Then run!</p>
              <div className="gr-col">
                <button className="gr-btn big go" onClick={() => startGame("quick")}>QUICK PLAY <small>4 SHORT QUARTERS VS THE CPU</small></button>
                <button className="gr-btn big" onClick={() => startGame("twoMinute")}>TWO-MINUTE DRILL <small>DOWN 7 · 2:00 LEFT</small></button>
              </div>
              <div className="gr-diff" role="radiogroup" aria-label="Difficulty">
                {DIFFS.map((d) => (
                  <button key={d.id} role="radio" aria-checked={diff === d.id} className={`gr-chip ${diff === d.id ? "on" : ""}`} onClick={() => { setDiff(d.id); R.current.diff = d.id; try { localStorage.setItem("gridiron:diff", d.id); } catch { /* ignore */ } }}>{d.label}</button>
                ))}
              </div>
              <small className="gr-sub">OPPONENT: {String((OPPONENT as any)[diff].name).toUpperCase()}</small>
              <div className="gr-row"><button className="gr-btn" onClick={() => setHowto((v) => !v)}>{howto ? "HIDE" : "HOW TO PLAY"}</button><Link className="gr-btn" href="/arcade/solo">← ARCADE</Link></div>
              {howto && (
                <ol className="gr-how">
                  <li><b>PICK A PLAY.</b> Each shows its four routes, A B C D.</li>
                  <li><b>SNAP.</b> Receivers run and the defence reacts. Watch who gets open.</li>
                  <li><b>THROW.</b> Tap A / B / C / D (or press the key). The ball leads the receiver, so timing and coverage matter.</li>
                  <li><b>RUN.</b> After the catch you only steer: hold ◀ ▶ (or ← →, A D, or touch the left/right of the field).</li>
                  <li>4 downs to gain 10 yards. Score touchdowns and field goals. Beat the clock!</li>
                </ol>
              )}
            </div>
          )}
        </section>

        <aside className="gr-side right">
          <div className="gr-abcd" aria-label="Pick a receiver">
            {["A", "B", "C", "D"].map((l, i) => (
              <button key={l} className={`gr-key abcd ${hud?.canThrow ? "hot" : ""}`} style={{ ["--c" as any]: LABEL_COLORS[i] }} onPointerDown={(e) => { e.preventDefault(); doThrow(i); }} disabled={!hud?.canThrow} aria-label={`Throw to receiver ${l}`}>
                <span>{l}</span><i style={{ width: `${Math.round(sepLvl(hud?.seps?.[i] ?? 3) * 100)}%` }} />
              </button>
            ))}
          </div>
          <small className="gr-hint">{hud?.canThrow ? "THROW NOW!" : "PICK A TARGET"}<br />A B C D · 1–4</small>
        </aside>
      </main>
    </div>
  );
}
