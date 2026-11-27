"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any, react-hooks/refs */
// MEOWDOKU: put one cat in every row, every column and every colour, and never let two cats touch (corners count).
// A home screen leads to: the candy-style world map (100 levels, 10 cat-themed areas), the Daily Puzzle, and Endless play. Rules and puzzles live in arcade-server/meowdoku (pure ESM, tested).
// Marks: tap = one mark, double-tap = the other (TAP switch), and holding + swiping draws a line of X's (or erases a line of them).
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  newGame, toggleX, toggleCat, markX, setCell, setMark, undo as undoMove, retract, clearBoard, beginStroke, endStroke, cats, conflictCells, blocked, smartHint, wink, completeLevel, totalStars,
  areaOf, areaIndex, AREAS, entersNewArea, LEVEL_COUNT, MAX_FISH, regionName, normalizeProfile, DIFF_KEYS,
  dailySpec, newDailyGame, newEndlessGame, completeDaily, completeEndless, buy, sweepBoard, feedFish, dayKey, prevDay, parFor,
  setRegionNames, colorNames, colorsFor, buyItem, equipItem, clearFresh, itemOf,
} from "../../../arcade-server/meowdoku/index.mjs";
import { PrefsProvider, PrefsButtons, usePrefs, sfx, tone } from "../prefs";
import { catUrl, makeLogo } from "./sprites";
import { starUrl, yarnUrl, flameUrl, boltUrl, broomUrl, bulbUrl } from "./mapArt";
import LevelMap from "./LevelMap";
import Home from "./Home";
import { EndlessSheet, itemIcon } from "./Sheets";
import Closet from "./Closet";
import { catUrlFor, fishSkinUrl, markUrl } from "./closetArt";
import "./meowdoku.css";

export const GAME_NAME = "Meowdoku";
const KEY = "meowdoku:v1", OLD_KEY = "catgrid:v1", LOGO = "/arcade/meowdoku-logo.png";
const COLORS = ["#9ed36a", "#e8706f", "#f6b3d2", "#ffab5e", "#9b7fdc", "#ecc84a", "#8fb4e0", "#5fcab8", "#c9a27a"];
const SHAPES = ["●", "▲", "■", "◆", "★", "♥", "✚", "⬟", "▼", "◉"];
const DOUBLE_MS = 380;
type Settings = { auto: boolean; shapes: boolean; mode: "x" | "cat"; endless: { n: number; diff: string } };
type Saved = { profile: any; game: any; secs: number; settings: Settings };
type Drag = { r: number; c: number; cur: [number, number]; mode: "paint" | "erase" | null; moved: boolean; lx: number; ly: number; startMark: number; n: number };

export default function Meowdoku() { return <PrefsProvider><Inner /></PrefsProvider>; }

const DEFAULT_SETTINGS: Settings = { auto: false, shapes: false, mode: "x", endless: { n: 6, diff: "medium" } };
function load(): Saved {
  const today = dayKey(new Date());
  for (const key of [KEY, OLD_KEY]) {
    try {
      const j = JSON.parse(localStorage.getItem(key) || "null");
      if (j?.profile?.v === 1) {
        const profile = normalizeProfile({ ...j.profile, level: Math.min(LEVEL_COUNT + 1, Math.max(1, j.profile.level || 1)) });
        // an older save with progress but no stars: count the levels already passed as one star each so the map is not empty
        if (!Object.keys(profile.stars).length && profile.level > 1) for (let l = 1; l < Math.min(profile.level, LEVEL_COUNT + 1); l++) profile.stars[l] = 1;
        const lv = Math.min(profile.level, LEVEL_COUNT), g0 = j.game?.v === 1 && !j.game.done ? j.game : null;
        const ok = g0 && (!g0.mode || g0.mode === "campaign" ? g0.level <= lv : g0.mode === "daily" ? g0.day === today : true), g = ok ? { combo: 0, bestCombo: 0, mode: "campaign", startFish: MAX_FISH, maxFish: MAX_FISH, tier: 1, label: "", ...g0 } : null;
        const e = j.settings?.endless;
        return { profile, game: g ?? newGame(lv), secs: g ? j.secs || 0 : 0, settings: { auto: !!j.settings?.auto, shapes: !!j.settings?.shapes, mode: j.settings?.mode === "cat" ? "cat" : "x", endless: { n: e?.n >= 5 && e?.n <= 9 ? e.n : 6, diff: DIFF_KEYS.includes(e?.diff) ? e.diff : "medium" } } };
      }
    } catch { /* blocked or corrupt: try the next key */ }
  }
  const profile = normalizeProfile({}); return { profile, game: newGame(1), secs: 0, settings: { ...DEFAULT_SETTINGS } };
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Its own component so the once-a-second tick never re-renders the board. */
function Clock({ s }: { s: React.MutableRefObject<Saved | null> }) {
  const [, t] = useState(0);
  useEffect(() => { const id = window.setInterval(() => { const x = s.current; if (!x || x.game.done || document.hidden || !x.game.moves) return; x.secs += 1; t((v) => v + 1); }, 1000); return () => clearInterval(id); }, [s]);
  return <b>{mmss(s.current?.secs ?? 0)}</b>;
}

/** A tiny board that teaches one rule. cells: [colour, mark] where mark is "" | "x" | "cat". */
function Mini({ cells, label }: { cells: [string, string][]; label: string }) {
  const n = Math.round(Math.sqrt(cells.length));
  return (
    <figure className="cg-mini"><div style={{ ["--n" as any]: n }}>{cells.map(([bg, m], i) => <span key={i} style={{ background: bg }}>{m === "x" ? <i className="x" /> : m === "cat" ? <img src={catUrl("normal")} alt="" draggable={false} /> : null}</span>)}</div><figcaption>{label}</figcaption></figure>
  );
}
const G = COLORS[0], P = COLORS[2], O = COLORS[3];
const MINI_ROWS: [string, string][] = [["#b9c3e6", "x"], ["#b9c3e6", "cat"], ["#b9c3e6", "x"], ["#b9c3e6", ""], ["#b9c3e6", "x"], ["#b9c3e6", ""], ["#b9c3e6", ""], ["#b9c3e6", "x"], ["#b9c3e6", ""]];
const MINI_COLOURS: [string, string][] = [[G, "cat"], [P, ""], [O, ""], [G, "x"], [P, "cat"], [O, "x"], [G, "x"], [P, ""], [O, "cat"]];
const MINI_TOUCH: [string, string][] = [["#b9c3e6", "x"], ["#b9c3e6", "x"], ["#b9c3e6", "x"], ["#b9c3e6", "x"], ["#b9c3e6", "cat"], ["#b9c3e6", "x"], ["#b9c3e6", "x"], ["#b9c3e6", "x"], ["#b9c3e6", "x"]];

function Inner() {
  const S = useRef<Saved | null>(null), last = useRef<{ key: string; t: number } | null>(null), nid = useRef(0), drag = useRef<Drag | null>(null), boardRef = useRef<HTMLDivElement>(null);
  const { prefs } = usePrefs();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [view, setView] = useState<"home" | "map" | "play">("home");
  const [sheet, setSheet] = useState<null | "endless" | "shop">(null), [closetTab, setClosetTab] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [today, setToday] = useState("");
  const [rip, setRip] = useState<{ id: number; r: number; c: number } | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  const [arrived, setArrived] = useState(0);
  const [say, setSay] = useState<{ text: string; kind: string; cells: number[][]; apply?: () => void } | null>(null);
  const [mood, setMood] = useState<"normal" | "oops" | "happy">("normal");
  const [shake, setShake] = useState<string | null>(null);
  const [fishHit, setFishHit] = useState<number | null>(null);
  const [puffs, setPuffs] = useState<{ id: number; k: string }[]>([]);
  const [result, setResult] = useState<any>(null);
  const [confetti, setConfetti] = useState(false);
  const [panel, setPanel] = useState(false);
  const [help, setHelp] = useState(false);
  const [tools, setTools] = useState<string | null>(null);
  const [round, setRound] = useState(0);   // bumps on every new board so the board animates in
  const [focus, setFocus] = useState<[number, number]>([0, 0]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(() => { try { const s = S.current; if (s) localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ } }, []);
  const flashMood = useCallback((m: "oops" | "happy", ms = 1100) => { setMood(m); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setMood("normal"), ms); }, []);

  /** On the first levels a free "start here" tip appears, so nobody ever stares at a blank board. */
  const coach = useCallback(() => {
    const x = S.current; if (!x || x.game.mode !== "campaign" || x.game.level > 3 || x.game.moves || x.game.done) return;
    const h: any = smartHint(x.game); if (h.kind !== "cat" && h.kind !== "cross") return; const st = x.game;
    const apply = () => { if (h.kind === "cat") setMark(st, h.cell[0], h.cell[1], 2); else for (const [r, c] of h.cells) if (st.marks[r][c] === 0) st.marks[r][c] = 1; setSay(null); bump(); save(); };
    setSay({ text: `Start here! ${h.text}`, kind: h.kind, cells: h.cell ? [h.cell] : h.cells, apply });
  }, [save]);

  useEffect(() => { const t = () => setToday(dayKey(new Date())); t(); document.addEventListener("visibilitychange", t); return () => document.removeEventListener("visibilitychange", t); }, []);
  useEffect(() => { S.current = load(); setHelp(!S.current.profile.seenHelp); setTools(new URLSearchParams(location.search).has("logo") ? makeLogo(8) : null); bump(); }, []);
  useEffect(() => { const sv = window.setInterval(save, 4000); window.addEventListener("pagehide", save); return () => { clearInterval(sv); window.removeEventListener("pagehide", save); save(); }; }, [save]);

  const s = S.current;
  const burst = (r: number, c: number) => { const id = ++nid.current, k = `${r},${c}`; setPuffs((p) => [...p, { id, k }]); window.setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== id)), 520); };
  const finishWin = (st: any) => {
    const x = S.current!, secs = x.secs, mode = st.mode || "campaign"; let r: any;
    if (mode === "daily") r = completeDaily(x.profile, st, secs, st.day); else if (mode === "endless") r = { ...completeEndless(x.profile, st, secs, today || dayKey(new Date()), st.diff), first: true }; else r = completeLevel(x.profile, st, secs);
    const speedy = st.helps === 0 && secs <= parFor(st.n); flashMood("happy", 5000); sfx("win"); setConfetti(true); setBanner(r.stars === 3 ? "PURRFECT!" : speedy ? "SPEEDY!" : "NICE!");
    if (mode === "campaign") setArrived(st.level + 1);
    window.setTimeout(() => { setConfetti(false); setBanner(null); setResult({ won: true, mode, ...r, speedy, level: st.level, secs, fish: st.fish, helps: st.helps, n: st.n, label: st.label, bestCombo: st.bestCombo || 0, newArea: mode === "campaign" && entersNewArea(st.level) ? areaOf(st.level + 1) : null, finished: mode === "campaign" && st.level >= LEVEL_COUNT }); save(); }, 1500);
  };
  const afterMove = (st: any, r: number, c: number, res: any) => {
    setSay(null);
    if (res.conflict) { sfx("bad"); navigator.vibrate?.(40); flashMood("oops"); setShake(`${r},${c}`); window.setTimeout(() => setShake(null), 380); setFishHit(st.fish); window.setTimeout(() => setFishHit(null), 700); }
    if (res.mark === 2) {
      burst(r, c); if (!res.conflict) { tone(520 + Math.min(cats(st).length, 9) * 40, 0.09, "triangle", 0.12); const id = ++nid.current; setRip({ id, r, c }); window.setTimeout(() => setRip((v) => (v && v.id === id ? null : v)), 800); if ((res.combo || 0) >= 3) tone(700 + res.combo * 60, 0.07, "square", 0.07); }
    } else if (res.mark === 1) tone(300, 0.04, "square", 0.07); else if (res.changed) tone(220, 0.05, "triangle", 0.07);
    if (st.won) finishWin(st); else if (st.lost) { sfx("bad"); window.setTimeout(() => setResult({ lost: true, mode: st.mode, level: st.level }), 600); }
    bump(); save();
  };
  /** One tap on a cell. Two quick taps on the same cell = the OTHER mark: the first tap is cancelled (fish refunded), then the other mark is applied. */
  const onCell = (r: number, c: number, at: number) => {
    const x = S.current; if (!x || x.game.done) return; const st = x.game, key = `${r},${c}`, catMode = x.settings.mode === "cat"; setFocus([r, c]);
    const p = last.current, dbl = !!p && p.key === key && at - p.t < DOUBLE_MS;
    if (dbl) { retract(st); last.current = null; const res = catMode ? markX(st, r, c) : toggleCat(st, r, c); afterMove(st, r, c, { ...res, changed: true }); return; }
    const res = catMode ? toggleCat(st, r, c) : toggleX(st, r, c); last.current = res.changed ? { key, t: at } : null; if (res.changed) afterMove(st, r, c, res);
  };

  // ---- holding and swiping: paint a line of X's, or (starting on an X) erase a line of them. Cats are never touched by a swipe.
  const cellAt = (x: number, y: number): [number, number] | null => { const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest?.("[data-rc]") as HTMLElement | null; if (!el) return null; const [r, c] = el.dataset.rc!.split(",").map(Number); return [r, c]; };
  const strokeOn = (d: Drag, r: number, c: number) => {
    const st = S.current!.game, m = st.marks[r][c];
    if (d.mode === "paint" && m === 0) { setCell(st, r, c, 1); d.n++; tone(280 + Math.min(d.n, 14) * 14, 0.03, "square", 0.06); } else if (d.mode === "erase" && m === 1) { setCell(st, r, c, 0); d.n++; tone(240, 0.025, "triangle", 0.05); }
  };
  const onBoardDown = (e: React.PointerEvent) => {
    const st = S.current?.game; if (!st || st.done) return; const hit = (e.target as HTMLElement).closest("[data-rc]") as HTMLElement | null; if (!hit) return;
    e.preventDefault(); try { boardRef.current?.setPointerCapture(e.pointerId); } catch { /* not supported */ }
    const [r, c] = hit.dataset.rc!.split(",").map(Number); drag.current = { r, c, cur: [r, c], mode: null, moved: false, lx: e.clientX, ly: e.clientY, startMark: st.marks[r][c], n: 0 }; setFocus([r, c]);
  };
  const onBoardMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return; const st = S.current!.game, w = boardRef.current?.getBoundingClientRect().width ?? 300, step = Math.max(4, w / st.n / 3);
    const dx = e.clientX - d.lx, dy = e.clientY - d.ly, dist = Math.hypot(dx, dy), steps = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i <= steps; i++) {   // sample along the path so a fast swipe never skips a square
      const cell = cellAt(d.lx + (dx * i) / steps, d.ly + (dy * i) / steps); if (!cell || (cell[0] === d.cur[0] && cell[1] === d.cur[1])) continue;
      if (!d.mode) { beginStroke(st); d.mode = d.startMark === 1 ? "erase" : "paint"; d.moved = true; last.current = null; strokeOn(d, d.cur[0], d.cur[1]); }
      d.cur = cell; strokeOn(d, cell[0], cell[1]);
    }
    d.lx = e.clientX; d.ly = e.clientY; if (d.moved) bump();
  };
  const onBoardUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null; if (!d) return; try { boardRef.current?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    const st = S.current!.game;
    if (d.moved) { endStroke(st); setSay(null); bump(); save(); } else if (e.type === "pointerup") onCell(d.r, d.c, e.timeStamp);
  };

  const none = (what: string) => setSay({ text: `No ${what} left. Earn yarn from levels and the Daily Puzzle, then visit the shop.`, kind: "shop", cells: [], apply: () => setSheet("shop") });
  const useHint = () => {
    const x = S.current!, st = x.game; if (st.done) return; if (x.profile.hints < 1) { none("hints"); return; }
    const h: any = smartHint(st); if (h.kind === "done") { setSay({ text: h.text, kind: "none", cells: [] }); return; }
    x.profile.hints--; st.helps++; sfx("reveal");
    const apply = () => {
      if (h.kind === "cat" || h.kind === "nudge") setMark(st, h.cell[0], h.cell[1], 2); else if (h.kind === "cross") { for (const [r, c] of h.cells) if (st.marks[r][c] === 0) st.marks[r][c] = 1; } else if (h.kind === "badx") for (const [r, c] of h.cells) st.marks[r][c] = 0;
      setSay(null); if (h.cell) burst(h.cell[0], h.cell[1]); if (st.won) finishWin(st); bump(); save();
    };
    setSay({ text: h.text, kind: h.kind, cells: h.cell ? [h.cell] : h.cells, apply: h.kind === "conflict" ? undefined : apply }); bump(); save();
  };
  const useHelper = () => {
    const x = S.current!, st = x.game; if (st.done) return; if (x.profile.winks < 1) { none("Cat Helpers"); return; }
    x.profile.winks--; const w = wink(st); if (!w) return; sfx("good"); if (w.placed) { burst(w.cell[0], w.cell[1]); const id = ++nid.current; setRip({ id, r: w.cell[0], c: w.cell[1] }); window.setTimeout(() => setRip((v) => (v && v.id === id ? null : v)), 800); }
    setSay({ text: w.placed ? "The Cat Helper put a cat in the right spot." : "The Cat Helper took away a cat that did not belong.", kind: "none", cells: [w.cell] }); if (st.won) finishWin(st); bump(); save();
  };
  const useSweep = () => {
    const x = S.current!, st = x.game; if (st.done) return; if (x.profile.sweeps < 1) { none("Sweeps"); return; }
    const n = sweepBoard(st); if (!n) { setSay({ text: "Nothing to sweep yet. Place a cat first, then Sweep crosses out every spot it rules out.", kind: "none", cells: [] }); return; }
    x.profile.sweeps--; last.current = null; sfx("good"); tone(420, 0.05, "triangle", 0.08); window.setTimeout(() => tone(640, 0.05, "triangle", 0.08), 70);
    setSay({ text: `Swept ${n} square${n === 1 ? "" : "s"} your cats rule out. Undo takes it back.`, kind: "none", cells: [] }); bump(); save();
  };
  const useSardine = () => {
    const x = S.current!, st = x.game; if (st.done) return; if (x.profile.sardines < 1) { none("Sardines"); return; }
    if (!feedFish(st)) { setSay({ text: st.fish >= st.maxFish ? "Your fish are already full. Save the Sardine!" : "Nothing to do.", kind: "none", cells: [] }); return; }
    x.profile.sardines--; sfx("good"); setGain(st.fish - 1); window.setTimeout(() => setGain(null), 900); setSay({ text: "Yum! You got a fish back.", kind: "none", cells: [] }); bump(); save();
  };
  const doUndo = () => { const st = S.current!.game; if (undoMove(st)) { setSay(null); last.current = null; tone(260, 0.05, "triangle", 0.07); bump(); save(); } };
  const doClear = () => { const st = S.current!.game; clearBoard(st); setSay(null); last.current = null; bump(); save(); };

  const resetPlay = () => { last.current = null; drag.current = null; setResult(null); setSay(null); setMood("normal"); setFocus([0, 0]); setRound((v) => v + 1); setRip(null); setBanner(null); setConfetti(false); setGain(null); };
  const begin = (game: any, secs = 0) => { const x = S.current!; x.game = game; x.secs = secs; resetPlay(); setSheet(null); setView("play"); bump(); save(); window.setTimeout(coach, 0); };
  /** Open a level from the map. An unfinished game on the same level resumes where it was. */
  const openLevel = (level: number) => {
    const x = S.current!; if (x.game.mode === "campaign" && x.game.level === level && !x.game.done && x.game.moves > 0) { resetPlay(); setView("play"); bump(); return; }
    begin(newGame(level));
  };
  const goMap = () => { setResult(null); setSay(null); setView("map"); bump(); save(); window.setTimeout(() => setArrived(0), 2500); };
  const goHome = () => { setResult(null); setSay(null); setSheet(null); setView("home"); bump(); save(); };
  const startDaily = () => {
    const x = S.current!, day = today || dayKey(new Date()), g = x.game; if (g.mode === "daily" && g.day === day && !g.done && g.moves > 0) { resetPlay(); setView("play"); bump(); return; }
    setBusy("Knitting today's puzzle…"); window.setTimeout(() => { const ng: any = newDailyGame(day); ng.day = day; setBusy(null); begin(ng); }, 60);
  };
  const startEndless = (n: number, diff: string) => {
    const x = S.current!; x.settings.endless = { n, diff }; setSheet(null); setBusy("Knitting a fresh puzzle…");
    window.setTimeout(() => { const ng: any = newEndlessGame({ n, diff, seed: Math.floor(Math.random() * 2147483646) + 1 }); ng.diff = diff; setBusy(null); begin(ng); }, 60);
  };
  const retry = () => {
    const x = S.current!, st = x.game; if (st.mode === "campaign") { openLevel(st.level); return; }
    const g: any = newGame(0, { n: st.n, regions: st.regions, solution: st.solution }, { mode: st.mode, label: st.label, fish: st.startFish, tier: st.tier }); g.day = st.day; g.diff = st.diff; begin(g);
  };
  const next = () => { const x = S.current!, st = x.game; if (st.mode === "endless") { const e = x.settings.endless; startEndless(e.n, e.diff); return; } const l = st.level + 1; if (l > LEVEL_COUNT) goMap(); else openLevel(l); };
  const doBuy = (item: string) => { const x = S.current!, r = buy(x.profile, item); if (r.ok) { sfx("good"); tone(760, 0.06, "square", 0.08); bump(); save(); } };
  const doBuyItem = (slot: string, id: string) => { const x = S.current!, r = buyItem(x.profile, slot, id); if (r.ok) { sfx("good"); tone(760, 0.06, "square", 0.08); window.setTimeout(() => tone(980, 0.08, "square", 0.08), 90); bump(); save(); } else sfx("bad"); };
  const doEquip = (slot: string, id: string) => { const x = S.current!, r = equipItem(x.profile, slot, id); if (r.ok) { tone(640, 0.05, "triangle", 0.09); bump(); save(); } };
  const doVisit = (slot: string) => { const x = S.current; if (x && x.profile.closet.fresh.some((k: string) => k.startsWith(`${slot}:`))) { clearFresh(x.profile, slot); bump(); save(); } };
  const setting = (k: "auto" | "shapes") => { const x = S.current!; x.settings[k] = !x.settings[k]; bump(); save(); };
  const setMode = (m: "x" | "cat") => { S.current!.settings.mode = m; last.current = null; bump(); save(); };
  const closeHelp = () => { S.current!.profile.seenHelp = true; setHelp(false); save(); };

  // keyboard: arrows move, Space/Enter taps, X and C set a mark, Backspace clears the cell
  const onKey = (e: React.KeyboardEvent) => {
    const x = S.current; if (!x || x.game.done) return; const st = x.game, n = st.n; let [r, c] = focus;
    if (e.key === "ArrowUp") r = (r + n - 1) % n; else if (e.key === "ArrowDown") r = (r + 1) % n; else if (e.key === "ArrowLeft") c = (c + n - 1) % n; else if (e.key === "ArrowRight") c = (c + 1) % n;
    else if (e.key === " " || e.key === "Enter") { e.preventDefault(); onCell(r, c, -1e9); return; }
    else if (e.key.toLowerCase() === "x") { e.preventDefault(); const res = markX(st, r, c); if (res.changed) afterMove(st, r, c, res); return; }
    else if (e.key.toLowerCase() === "c") { e.preventDefault(); const res = toggleCat(st, r, c); if (res.changed) afterMove(st, r, c, res); return; }
    else if (e.key === "Backspace") { e.preventDefault(); if (st.marks[r][c]) { const res = setCell(st, r, c, 0); afterMove(st, r, c, res); } return; } else return;
    e.preventDefault(); setFocus([r, c]); requestAnimationFrame(() => document.getElementById(`cg-${r}-${c}`)?.focus());
  };

  if (!s) return <div className="cg-root"><div className="cg-loading">LOADING…</div></div>;
  const eq = s.profile.closet.equip as Record<string, string>, PAL: string[] = colorsFor(s.profile);
  setRegionNames(colorNames(PAL));   // hints always name the colours the player actually sees
  const cat = (m: "normal" | "oops" | "happy") => catUrlFor(eq, m), fish = (lost = false) => fishSkinUrl(eq.fish, lost);
  const bdItem: any = itemOf("backdrop", eq.backdrop), bdCss: string = bdItem?.css || "";
  const st = s.game, n = st.n, bad = conflictCells(st), placed = cats(st).length, block = s.settings.auto ? blocked(st) : null, catMode = s.settings.mode === "cat", mode = st.mode || "campaign";
  const inPlay = view === "play", camp = mode === "campaign";
  const themeIdx = view !== "play" ? areaIndex(Math.min(s.profile.level, LEVEL_COUNT)) : camp ? areaIndex(st.level) : (mode === "daily" ? (+((st.day || "0-0-0").split("-")[2]) || 0) : n + (DIFF_KEYS.indexOf(st.diff) + 1) * 2) % AREAS.length;
  const area = AREAS[themeIdx];
  const hl = new Set((say?.cells ?? []).map(([r, c]) => `${r},${c}`)), puffAt = new Set(puffs.map((p) => p.k));
  const edge = (r: number, c: number, dr: number, dc: number) => { const rr = r + dr, cc = c + dc; return rr < 0 || cc < 0 || rr >= n || cc >= n || st.regions[rr][cc] !== st.regions[r][c] ? "var(--thick)" : "var(--thin)"; };
  const dayNow = today || "2000-01-01", spec = dailySpec(dayNow), doneToday = !!s.profile.daily.done[dayNow];
  const streakNow = s.profile.daily.last === dayNow || s.profile.daily.last === prevDay(dayNow) ? s.profile.daily.streak : 0;
  const resume = !st.done && st.moves > 0 ? { title: camp ? `Level ${st.level}` : st.label, sub: `${placed} of ${n} cats` } : null;
  const fishSlots = Math.max(st.startFish ?? MAX_FISH, st.fish), tag = camp ? area.name.toUpperCase() : `${mode === "daily" ? "DAILY" : "ENDLESS"} · ${String(st.label).toUpperCase()}`;
  const chips = (rw: any) => rw ? [["yarn", rw.yarn, "yarn"], ["hint", rw.hint, "hint"], ["helper", rw.wink, "Cat Helper"], ["sweep", rw.sweep, "Sweep"], ["sardine", rw.sardine, "Sardine"]].filter(([, v]) => v > 0) : [];
  let ci = 0;
  const rd = (r: number, c: number) => rip && (r === rip.r || c === rip.c || st.regions[r][c] === st.regions[rip.r][rip.c]) ? `${Math.max(Math.abs(r - rip.r), Math.abs(c - rip.c)) * 55}ms` : null;
  const backTo = () => (inPlay ? (camp ? goMap() : goHome()) : goHome());

  return (
    <div className={`cg-root ${prefs.calm ? "cg-calm" : ""} v-${view}`} style={{ ["--bgA" as any]: area.bgA, ["--bgB" as any]: area.bgB, ["--accent" as any]: area.accent, ["--ground" as any]: area.ground, ...(inPlay && bdCss ? { background: bdCss } : {}) }}>
      {view !== "home" && (
        <header className="cg-top">
          <button className="cg-btn round" onClick={backTo} aria-label={inPlay && camp ? "Back to the map" : "Back to the home screen"}>←</button>
          <button className="cg-logo" onClick={() => setHelp(true)} aria-label="How to play Meowdoku"><img src={LOGO} alt="" draggable={false} /></button>
          {inPlay ? (<>
            <div className="cg-stat"><small>{camp ? "LEVEL" : mode === "daily" ? "DAILY" : "ENDLESS"}</small><b>{camp ? st.level : `${n}×${n}`}</b></div>
            <div className="cg-stat"><small>SCORE</small><b>{s.profile.score.toLocaleString("en-US")}</b></div>
            <div className="cg-stat dim"><small>TIME</small><Clock s={S} /></div>
          </>) : (<>
            <div className="cg-stat"><small>STARS</small><b>{totalStars(s.profile)}</b></div>
            <div className="cg-stat"><small>YARN</small><b className="cg-yarn"><img src={yarnUrl()} alt="" draggable={false} />{s.profile.yarn}</b></div>
            <div className="cg-stat dim"><small>WORLD</small><b className="cg-world">{area.name}</b></div>
          </>)}
          <button className="cg-btn round" onClick={() => setHelp(true)} aria-label="How to play">?</button>
          <button className="cg-btn round" onClick={() => setPanel((v) => !v)} aria-label="Settings" aria-expanded={panel}>⚙</button>
        </header>
      )}
      {panel && (
        <div className="cg-panel" role="dialog" aria-label="Settings">
          <label><input type="checkbox" checked={s.settings.auto} onChange={() => setting("auto")} /> Show spots that are already ruled out (dots)</label>
          <label><input type="checkbox" checked={s.settings.shapes} onChange={() => setting("shapes")} /> Show a shape on each colour (for colour blindness)</label>
          <div className="cg-panel-row"><PrefsButtons /><button className="cg-btn" onClick={() => setPanel(false)}>DONE</button></div>
        </div>
      )}

      {view === "home" && (
        <Home cat={(m) => cat(m)} fresh={s.profile.closet.fresh.length} logo={LOGO} area={area} areaIndex={themeIdx} stars={totalStars(s.profile)} yarn={s.profile.yarn} streak={streakNow} level={s.profile.level} finished={s.profile.level > LEVEL_COUNT}
          resume={resume} daily={{ name: spec.name, n: spec.n, done: doneToday, stars: s.profile.daily.done[dayNow] || 0 }} endlessBest={s.profile.endless.wins}
          onPlay={goMap} onResume={() => { resetPlay(); setView("play"); bump(); }} onDaily={startDaily} onEndless={() => setSheet("endless")} onShop={() => setSheet("shop")} onHelp={() => setHelp(true)} onSettings={() => setPanel((v) => !v)} backHref="/arcade" />
      )}
      {view === "map" && <LevelMap profile={s.profile} onPlay={openLevel} arrived={arrived} meUrl={cat("happy")} />}

      {inPlay && (
      <main className="cg-main">
        <section className="cg-side">
          <div className="cg-world-tag" aria-hidden><small>{tag}</small></div>
          <div className="cg-fish" aria-label={`${st.fish} of ${fishSlots} fish left`}>
            {Array.from({ length: fishSlots }, (_, i) => <img key={`${i}:${i >= st.fish}`} src={fish(i >= st.fish)} alt="" className={`${i >= st.fish ? "lost" : ""} ${fishHit === i ? "hit" : ""} ${gain === i ? "gain" : ""}`} draggable={false} />)}
            {st.combo >= 2 && !st.done && <span className="cg-combo" key={st.combo} aria-label={`Combo ${st.combo}`}>COMBO ×{st.combo}</span>}
          </div>
          <ul className="cg-rules" aria-label="Rules">
            <li><span><b>1 cat</b> in every row and column</span></li>
            <li><span><b>1 cat</b> in every colour</span></li>
            <li><span>Cats <b>can&apos;t touch</b>, even corners</span></li>
          </ul>
          <div className="cg-slots" aria-label={`${placed} of ${n} cats placed`}>{Array.from({ length: n }, (_, i) => <span key={i} className={i < placed ? "on" : ""}>{i < placed && <img src={cat("normal")} alt="" draggable={false} />}</span>)}</div>
          <div className="cg-mode" role="group" aria-label="What a single tap does">
            <span className="lbl">TAP =</span>
            <button className={!catMode ? "on" : ""} aria-pressed={!catMode} onClick={() => setMode("x")}>✖ X</button>
            <button className={catMode ? "on" : ""} aria-pressed={catMode} onClick={() => setMode("cat")}><img src={cat("normal")} alt="" draggable={false} /> CAT</button>
            <button className="mini" onClick={doUndo} disabled={st.done || !st.history.length} aria-label="Undo">↩<span> UNDO</span></button>
            <button className="mini" onClick={doClear} disabled={st.done || !st.history.length} aria-label="Clear the board">⌫<span> CLEAR</span></button>
            <small>Double-tap = {catMode ? "✖ X" : "CAT"} · Swipe = X&apos;s</small>
          </div>
          <div className="cg-say" role="status" aria-live="polite">
            {say ? (<><p>{say.text}</p>{say.apply && <button className="cg-btn go" onClick={say.apply}>{say.kind === "cat" || say.kind === "nudge" ? "PUT THE CAT" : say.kind === "badx" ? "REMOVE X" : say.kind === "shop" ? "OPEN SHOP" : "CROSS THEM OUT"}</button>}</>) : <p className="mute">{catMode ? "Tap puts a cat. Double-tap marks an X. Swipe to draw X's." : "Tap marks an X. Double-tap puts a cat. Swipe to draw X's."}</p>}
          </div>
          <div className="cg-powers">
            <button className="cg-pw" onClick={useHelper} disabled={st.done} aria-label={`Cat Helper, ${s.profile.winks} left`}><img src={cat(mood === "oops" ? "oops" : "happy")} alt="" draggable={false} /><span>HELPER</span><i>{s.profile.winks}</i></button>
            <button className="cg-pw" onClick={useHint} disabled={st.done} aria-label={`Hint, ${s.profile.hints} left`}><img src={bulbUrl()} alt="" draggable={false} /><span>HINT</span><i>{s.profile.hints}</i></button>
            <button className="cg-pw" onClick={useSweep} disabled={st.done} aria-label={`Sweep, ${s.profile.sweeps} left`}><img src={broomUrl()} alt="" draggable={false} /><span>SWEEP</span><i>{s.profile.sweeps}</i></button>
            <button className="cg-pw" onClick={useSardine} disabled={st.done} aria-label={`Sardine, ${s.profile.sardines} left`}><img src={fish()} alt="" draggable={false} /><span>SARDINE</span><i>{s.profile.sardines}</i></button>
          </div>
        </section>

        <section className="cg-stage">
          <div ref={boardRef} className={`cg-board frame-${eq.frame} ${st.won ? "won" : ""}`} key={`${st.level}:${round}`} role="grid" aria-label={`${n} by ${n} cat grid`} style={{ ["--n" as any]: n }} onKeyDown={onKey}
            onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={onBoardUp} onPointerCancel={onBoardUp}>
            {st.regions.map((row: number[], r: number) => row.map((g: number, c: number) => {
              const m = st.marks[r][c], isBad = bad.has(`${r},${c}`), key = `${r},${c}`, firstOfRegion = s.settings.shapes && st.regions.flat().indexOf(g) === r * n + c, catIndex = m === 2 ? ci++ : 0, ripD = rd(r, c);
              return (
                <button key={key} id={`cg-${r}-${c}`} data-rc={key} role="gridcell" tabIndex={focus[0] === r && focus[1] === c ? 0 : -1} className={`cg-cell ${m === 2 ? "cat" : ""} ${isBad ? "bad" : ""} ${shake === key ? "shake" : ""} ${hl.has(key) ? "hint" : ""} ${ripD ? "rip" : ""}`}
                  style={{ background: PAL[g], borderTopWidth: edge(r, c, -1, 0), borderBottomWidth: edge(r, c, 1, 0), borderLeftWidth: edge(r, c, 0, -1), borderRightWidth: edge(r, c, 0, 1), ["--d" as any]: `${(r + c) * 32}ms`, ["--i" as any]: catIndex, ["--rd" as any]: ripD ?? undefined }}
                  onFocus={() => setFocus([r, c])}
                  aria-label={`Row ${r + 1}, column ${c + 1}, ${regionName(g)} area, ${m === 2 ? "cat" : m === 1 ? "marked X" : "empty"}`}>
                  {firstOfRegion && <i className="shape" aria-hidden>{SHAPES[g]}</i>}
                  {m === 1 && (eq.mark === "x" ? <span className="x" aria-hidden /> : <img className="mk" src={markUrl(eq.mark)} alt="" aria-hidden draggable={false} />)}
                  {m === 0 && block?.[r][c] && <span className="dot" aria-hidden />}
                  {m === 2 && <img src={cat(isBad ? "oops" : st.won ? "happy" : "normal")} alt="" draggable={false} />}
                  {puffAt.has(key) && <span className={`puff fx-${eq.fx}`} aria-hidden>{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ ["--a" as any]: `${i * 51}deg` }} />)}</span>}
                </button>
              );
            }))}
          </div>
          {banner && <div className="cg-banner" aria-hidden><span>{banner}</span></div>}
        </section>
      </main>
      )}

      {confetti && <div className="cg-confetti" aria-hidden>{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ ["--x" as any]: `${(i * 37) % 100}%`, ["--d" as any]: `${(i % 7) * 90}ms`, ["--c" as any]: PAL[i % PAL.length], ["--r" as any]: `${(i * 53) % 360}deg` }} />)}</div>}

      {busy && <div className="cg-modal cg-busy" role="status"><div className="cg-card"><img className="cg-hero" src={cat("happy")} alt="" draggable={false} /><h2>{busy}</h2><div className="cg-dots" aria-hidden><i /><i /><i /></div></div></div>}
      {sheet === "endless" && <EndlessSheet profile={s.profile} last={s.settings.endless} today={dayNow} onStart={startEndless} onClose={() => setSheet(null)} />}
      {sheet === "shop" && <Closet profile={s.profile} level={s.profile.level} startSlot={closetTab} onBuy={doBuyItem} onBuyPower={doBuy} onEquip={doEquip} onVisit={doVisit} onClose={() => { setSheet(null); setClosetTab(undefined); }} />}

      {help && (
        <div className="cg-modal" role="dialog" aria-label="How to play" onClick={closeHelp}>
          <div className="cg-card wide" onClick={(e) => e.stopPropagation()}>
            <img className="cg-logo-big" src={LOGO} alt="" draggable={false} />
            <h2>{GAME_NAME.toUpperCase()}</h2>
            <p>Put <b>one cat</b> in every row, every column and every colour. Cats can&apos;t touch, not even at the corners.</p>
            <div className="cg-minis"><Mini cells={MINI_ROWS} label="A cat takes its whole row and column" /><Mini cells={MINI_COLOURS} label="One cat in every colour" /><Mini cells={MINI_TOUCH} label="Cats can't touch, even corners" /></div>
            <p className="mute">Tap marks an X (a note), double-tap puts a cat, and you can hold and swipe to draw a line of X&apos;s. Prefer cats on a single tap? Flip the TAP switch under the board. Stuck? The hint explains why. Chain clean cats for a combo!</p>
            <button className="cg-btn go big" onClick={closeHelp}>LET&apos;S PLAY ▶</button>
          </div>
        </div>
      )}
      {result && (
        <div className="cg-modal" role="dialog" aria-label={result.won ? "Level complete" : "Out of fish"}>
          <div className="cg-card">
            <img className="cg-hero" src={cat(result.won ? "happy" : "oops")} alt="" draggable={false} />
            {result.won ? (<>
              <h2>{result.finished ? "YOU DID IT!" : result.mode === "daily" ? "DAILY DONE!" : result.mode === "endless" ? "SOLVED!" : `LEVEL ${result.level} DONE!`}</h2>
              <div className="cg-starrow" aria-label={`${result.stars} of 3 stars`}>{[1, 2, 3].map((k) => <img key={k} src={starUrl(k <= result.stars)} alt="" style={{ animationDelay: `${k * 160}ms` }} draggable={false} />)}</div>
              {result.speedy && <p className="cg-speedy"><img src={boltUrl()} alt="" draggable={false} /> SPEEDY! Under {mmss(parFor(result.n))}</p>}
              {result.finished && <p>All {LEVEL_COUNT} levels cleared. The whole Catdom is yours!</p>}
              {result.newArea && <p className="cg-newarea"><b>NEW WORLD: {result.newArea.name}</b><br /><span className="mute">{result.newArea.blurb}</span></p>}
              {result.mode === "daily" && result.first && <p className="cg-streak"><img src={flameUrl()} alt="" draggable={false} /> <b>{result.streak}</b> day streak{result.streak > 1 ? "!" : ". Come back tomorrow!"}</p>}
              {result.mode === "daily" && !result.first && <p className="mute">You already finished today&apos;s puzzle. Replays earn no extra rewards.</p>}
              {result.mode === "endless" && result.record && <p className="cg-streak"><b>NEW BEST TIME</b> for this size and difficulty!</p>}
              {result.mode === "endless" && !result.paid && <p className="mute">{result.points === 0 && result.yarn === 0 ? "No yarn this time (help was used, or today's yarn is all earned)." : ""}</p>}
              <ul className="cg-sum"><li><span>{result.mode === "campaign" ? "Board" : result.label || "Board"}</span><b>{result.n}×{result.n}</b></li><li><span>Time</span><b>{mmss(result.secs)}</b></li><li><span>Fish left</span><b>{result.fish}</b></li>{result.bestCombo >= 3 && <li><span>Best combo</span><b>×{result.bestCombo}</b></li>}{result.helps > 0 && <li><span>Helps used</span><b>{result.helps}</b></li>}{result.first || result.paid ? <li className="tot"><span>Points</span><b>+{result.points}</b></li> : <li><span>Replay</span><b>stars only</b></li>}</ul>
              {chips(result.reward ?? { yarn: result.yarn }).length > 0 && <div className="cg-chips" aria-label="Rewards">{chips(result.reward ?? { yarn: result.yarn }).map(([k, v, label]: any) => <span key={k}><img src={k === "yarn" ? yarnUrl() : itemIcon(k)} alt="" draggable={false} />+{v} {label}</span>)}</div>}
              {(result.reward?.unlocked ?? result.unlocked ?? []).length > 0 && <div className="cg-unlock" aria-label="New closet items"><b>NEW IN YOUR CLOSET</b>{(result.reward?.unlocked ?? result.unlocked).map((it: any) => <button key={`${it.slot}:${it.id}`} onClick={() => { setClosetTab(it.slot); setResult(null); setSheet("shop"); }}>{it.name}</button>)}</div>}
              <div className="cg-row"><button className="cg-btn" onClick={camp ? goMap : goHome}>{camp ? "MAP" : "HOME"}</button>{!result.finished && (result.mode === "campaign" || result.mode === "endless") && <button className="cg-btn go big" onClick={next}>{result.mode === "endless" ? "AGAIN ▶" : "NEXT LEVEL ▶"}</button>}</div>
            </>) : (<>
              <h2>OUT OF FISH</h2><p>Cats that break a rule cost a fish. Try the same puzzle again, or use a hint or a Sardine.</p>
              <div className="cg-row"><button className="cg-btn" onClick={camp ? goMap : goHome}>{camp ? "MAP" : "HOME"}</button><button className="cg-btn go big" onClick={retry}>TRY AGAIN</button></div>
            </>)}
          </div>
        </div>
      )}
      {tools && <div className="cg-tools"><a className="cg-btn" href={tools} download="meowdoku-logo.png">download logo</a></div>}
    </div>
  );
}
