"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any, react-hooks/refs */
// SHELF STOCKER: you are the stock clerk. Tap a shelf to lift its top items, tap another shelf to move them (or drag them). Nine departments teach nine rules; a Daily Delivery gives the
// whole class the same board; coins buy shop decorations. Built for feel and smoothness: flat cached sprites moved with GPU transforms, one Web Animations arc per item (lift, tilt,
// glide, drop, squash), dust and sparkle particles made imperatively (no React re-renders), synthesized sound and haptics. React re-renders only when the game state changes. Rules live in arcade-server/shelf.
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { newGame, newDailyGame, whyNot, move, undo as undoMove, addCart, hint as getHint, hasMoves, looksStuck, bayDone, isLocked, doneCount, topRun, newProfile, normalizeProfile, completeLevel, completeDaily, totalStars, specFor, deptOf, posOf as levelPos, dayKey, dailyLevel, buyDecor, equipDecor, DEPTS, DEPT_COUNT, SUBJECTS, MAX_EXTRA } from "../../../arcade-server/shelf/index.mjs";
import { PrefsProvider, PrefsButtons, usePrefs } from "../prefs";
import { itemUrl, iconUrl, stampUrl, padlockUrl, coinUrl, SPR_W, SPR_H, SHIRT_NAMES } from "./sprites";
import { play, setAudioOptions } from "./audio";
import Scene from "./Scene";
import Home from "./Home";
import Decor from "./Decor";
import "./shelf.css";

export const GAME_NAME = "Shelf Stocker";
const KEY = "shelfstocker:v1";
type Settings = { symbols: boolean; sfx: boolean; music: boolean; seasons: boolean };
type Saved = { profile: any; game: any; settings: Settings; fresh?: boolean };
const SLOT = 68, FLOOR = 18;                                  // design units: one item's step, and the gap under the floor of a bay
const DEPT_BG = [["#dff4ea", "#b7e2cf"], ["#fbefd2", "#efd3a0"], ["#e9e0fb", "#cdbff0"], ["#fff3c4", "#ffe08a"], ["#fff7ea", "#f1ddba"], ["#e4f3ff", "#a9d2f2"], ["#ffe6ee", "#ffd0de"], ["#fbf3e4", "#f1e0bf"], ["#fff6d6", "#ece4ff"]];
const COACH = ["Tap this shelf to lift its top shirts, then tap the shelf they should go on.", "Every shelf has a sign. Lift a book, then tap the shelf for its subject.", "Shirts go on racks and books on shelves. Try this move.", "Smaller toys sit on bigger ones. Lift this toy and drop it here.", "Jars can only be moved a few times (see the dots on the lid). Try this move.",
  "Left, right, left, right! A shoe goes next to its partner. Try this move.", "Padlocked shelves open when you finish a shelf. Start with this move.", "Pack exactly what the ticket asks for. Lift the item and drop it in the bag.", "Two rules at once! Follow the hand for the first move."];
const DEFAULTS: Settings = { symbols: false, sfx: true, music: false, seasons: true };
const KINDNAME: Record<string, string> = { shirt: "shirt", book: "book", toy: "toy", jar: "jar", tin: "tin", shoe: "shoe", gift: "gift" };

export default function ShelfStocker() { return <PrefsProvider><Inner /></PrefsProvider>; }

function load(): Saved {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "null");
    if (j?.profile?.v === 1) {
      const profile = normalizeProfile(j.profile), g = j.game, today = dayKey(new Date());
      const ok = g?.v === 2 && !g.done && Array.isArray(g.bays) && g.bays.every((b: any) => Array.isArray(b?.items)) && (g.daily ? g.daily === today : g.level <= profile.level);
      return { profile, game: ok ? g : newGame(profile.level), settings: { ...DEFAULTS, ...(j.settings || {}) }, fresh: false };
    }
  } catch { /* blocked or corrupt */ }
  const profile = newProfile(); return { profile, game: newGame(1), settings: { ...DEFAULTS }, fresh: true };
}

/** Size everything for the space available. Units: u = screen px per design unit (an item is 200 units wide). */
function computeLay(W: number, H: number, B: number, cap: number) {
  const rowArt = cap * SLOT + 140;   // a row: sign, the stack, the floor, and room to lift and fly
  let best = { w: 24, rows: 1, cols: B };
  for (let rows = 1; rows <= B; rows++) { const cols = Math.ceil(B / rows), w = Math.min(W / cols / 1.3, (H / (rows * rowArt)) * SPR_W, 128); if (w > best.w || rows === 1) best = { w, rows, cols }; }
  const { w, rows, cols } = best, u = w / SPR_W, rowH = rowArt * u, cellW = W / cols, cx: number[] = [], Yb: number[] = [], row: number[] = [];
  for (let i = 0; i < B; i++) { const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, B - r * cols); cx.push((W - inRow * cellW) / 2 + (c + 0.5) * cellW); const top = (H - rows * rowH) / 2 + r * rowH; Yb.push(top + rowH - FLOOR * u); row.push(r); }
  return { w, u, rows, cols, rowH, cx, Yb, row };
}
type Lay = ReturnType<typeof computeLay>;
const T = (x: number, y: number, rot = 0, sx = 1, sy = 1) => `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${sx}, ${sy})`;
type Pend = { ids: number[]; from: Map<number, { x: number; y: number }>; src: number; dst: number; fast: boolean; won: boolean; finished: number[]; revealed: number | null; unwrapped: number[]; unlocked: number[] };
type Drag = { b: number; x0: number; y0: number; active: boolean; ids: number[]; base: Map<number, { x: number; y: number }>; now: Map<number, { x: number; y: number }>; hover: number | null; z: Map<number, number> };

function Inner() {
  const S = useRef<Saved | null>(null), stage = useRef<HTMLDivElement>(null), fx = useRef<HTMLDivElement>(null), els = useRef(new Map<number, HTMLImageElement>()), bayEls = useRef<(HTMLElement | null)[]>([]);
  const pend = useRef<Pend | null>(null), bobs = useRef(new Map<number, Animation>()), coachRef = useRef<{ key: string; move: any } | null>(null), selRef = useRef<number | null>(null), drag = useRef<Drag | null>(null), suppress = useRef(false);
  const noTrans = useRef(new Set<number>()), hold = useRef(new Set<number>()), timers = useRef<number[]>([]), msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null), roRef = useRef<ResizeObserver | null>(null);
  const { prefs } = usePrefs();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [size, setSize] = useState({ w: 320, h: 400 });
  const [sel, setSel] = useState<number | null>(null);
  const [panel, setPanel] = useState(false), [introOpen, setIntro] = useState<number | null>(null), [picker, setPicker] = useState(false), [decorOpen, setDecorOpen] = useState(false), [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [msg, setMsg] = useState<{ text: string; kind: string } | null>(null);
  const [hintBays, setHintBays] = useState<number[]>([]);
  const [stamped, setStamped] = useState<Set<number>>(new Set());
  const [nudge, setNudge] = useState(false);
  const [round, setRound] = useState(0), [view, setView] = useState<"home" | "play">("home");

  const save = useCallback(() => { try { const s = S.current; if (s) localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ } }, []);
  useEffect(() => { S.current = load(); setAudioOptions({ sfx: S.current.settings.sfx, music: S.current.settings.music }); bump(); save(); }, [save]);
  useEffect(() => { const sv = () => save(); window.addEventListener("pagehide", sv); return () => { window.removeEventListener("pagehide", sv); save(); timers.current.forEach(clearTimeout); setAudioOptions({ music: false }); }; }, [save]);
  const stageRef = useCallback((el: HTMLDivElement | null) => { stage.current = el; roRef.current?.disconnect(); if (!el) return; const go = () => setSize({ w: Math.max(240, el.clientWidth), h: Math.max(200, el.clientHeight) }); go(); roRef.current = new ResizeObserver(go); roRef.current.observe(el); }, []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const flash = (text: string, kind = "info", ms = 2600) => { setMsg({ text, kind }); if (msgTimer.current) clearTimeout(msgTimer.current); msgTimer.current = setTimeout(() => setMsg(null), ms); };
  const setSelBoth = (v: number | null) => { selRef.current = v; setSel(v); };

  const s = S.current, st = s?.game, dept = st ? deptOf(st.level) : 0;
  const intro = introOpen !== null ? introOpen : (s && view === "play" && !st?.daily && !s.profile.seen[dept] ? dept : null);
  const lay: Lay | null = useMemo(() => (st ? computeLay(size.w, size.h, st.bays.length, st.cap) : null), [size.w, size.h, st?.bays.length, st?.cap]);   // eslint-disable-line react-hooks/exhaustive-deps
  const reduce = prefs.calm || (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  // ---- geometry
  const itemXY = (L: Lay, b: number, i: number, lift = 0) => ({ x: L.cx[b] - L.w / 2, y: L.Yb[b] - (SPR_H - 4) * L.u - i * SLOT * L.u - lift });
  const rimY = (L: Lay, b: number, cap: number) => L.Yb[b] - (cap * SLOT + 16) * L.u;
  const liftFor = (L: Lay) => 22 * L.u;
  const selRun = (g: any, b: number | null) => (b === null ? 0 : topRun(g, b));
  const posOf = (L: Lay, g: any, id: number, selB: number | null) => { for (let b = 0; b < g.bays.length; b++) { const i = g.bays[b].items.findIndex((n: any) => n.id === id); if (i >= 0) { const n = selRun(g, selB), lifted = selB === b && i >= g.bays[b].items.length - n; return itemXY(L, b, i, lifted ? liftFor(L) : 0); } } return null; };

  // ---- feel: particles, wobble, haptics (all imperative, no React renders)
  const burst = (x: number, y: number, kind: "dust" | "spark" | "flake", n = 5, colour = "#fff") => {
    const layer = fx.current; if (!layer || reduce) return;
    for (let i = 0; i < n; i++) {
      const d = document.createElement("i"), a = kind === "dust" ? Math.PI + (i % 2 ? 0.2 : -0.2) + (i - n / 2) * 0.35 : (i / n) * Math.PI * 2, dist = (kind === "dust" ? 18 : 30) + (i % 3) * 8;
      d.className = `sh-p ${kind}`; d.style.left = `${x}px`; d.style.top = `${y}px`; if (kind === "spark") d.style.color = colour; if (kind === "flake") d.style.background = i % 2 ? "#ffd23f" : colour; if (kind === "spark") d.textContent = "✦";
      layer.appendChild(d);
      const dx = kind === "dust" ? (i % 2 ? 1 : -1) * dist * (0.5 + (i % 3) * 0.3) : Math.cos(a) * dist * (kind === "flake" ? 1.4 : 1), dy = kind === "dust" ? -4 - (i % 3) * 5 : kind === "flake" ? -34 - (i % 4) * 12 : Math.sin(a) * dist - 8;
      d.animate([{ transform: "translate(-50%,-50%) scale(.5)", opacity: kind === "dust" ? 0.8 : 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${kind === "dust" ? 1.5 : 1}) rotate(${kind === "flake" ? (i % 2 ? 260 : -260) : 0}deg)`, opacity: 0 }], { duration: kind === "dust" ? 420 : kind === "flake" ? 760 : 640, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }).onfinish = () => d.remove();
    }
  };
  const wobble = (b: number, amp = 3) => { const el = bayEls.current[b]; if (!el || reduce) return; el.animate([{ transform: "translateY(0) scale(1,1)" }, { transform: `translateY(${amp}px) scale(1.012,.985)` }, { transform: "translateY(0) scale(1,1)" }], { duration: 240, easing: "ease-out" }); };
  const haptic = (ms: number | number[]) => { try { navigator.vibrate?.(ms); } catch { /* not supported */ } };

  // ---- after a move renders: fly each moved item along an arc, then land with a squash, dust and a thud
  useLayoutEffect(() => {
    const p = pend.current, g = S.current?.game; if (!p || !g || !lay) return; pend.current = null; noTrans.current.clear();
    const L = lay, dur = p.fast ? 420 : 640, peak = Math.min(rimY(L, p.src, g.cap), rimY(L, p.dst, g.cap)) - (SPR_H + 14) * L.u;
    p.ids.forEach((id, k) => {
      const el = els.current.get(id), from = p.from.get(id), to = posOf(L, g, id, null); if (!el || !from || !to) return;
      const delay = k * (p.fast ? 35 : 60), pk = peak - k * 10 * L.u, dir = to.x >= from.x ? 1 : -1;
      if (!reduce) el.animate([
        { transform: T(from.x, from.y, 0, 1.03, 1.03), offset: 0, easing: "cubic-bezier(.3,.1,.3,1)" },
        { transform: T(from.x, pk, -3 * dir, 0.97, 1.05), offset: 0.26, easing: "cubic-bezier(.45,0,.55,1)" },
        { transform: T(to.x, pk, 3 * dir, 0.97, 1.05), offset: 0.6, easing: "cubic-bezier(.5,0,.9,.6)" },
        { transform: T(to.x, to.y, 0, 1, 1), offset: 0.82 },
        { transform: T(to.x, to.y + 3 * L.u, 0, 1.07, 0.88), offset: 0.9, easing: "ease-out" },
        { transform: T(to.x, to.y, 0, 1, 1), offset: 1 },
      ], { duration: dur, delay, fill: "backwards" });
      later(() => { const cxm = to.x + L.w / 2, floorY = to.y + (SPR_H - 4) * L.u; if (k === 0) { play("put", p.ids.length / 2); haptic(8); wobble(p.dst, 4); } burst(cxm, floorY - 6 * L.u, "dust", 4); }, delay + dur * 0.84);
    });
    const landed = (p.fast ? 420 : 640) + (p.ids.length - 1) * (p.fast ? 35 : 60);
    const unwrap = (id: number, wait: number) => later(() => {
      hold.current.delete(id); bump(); play("unwrap"); haptic(6); const el = els.current.get(id), b = posOf(L, g, id, null);
      if (el && b && !reduce) { el.animate([{ transform: T(b.x, b.y, 0, 0.9, 0.9) }, { transform: T(b.x, b.y - 10 * L.u, 0, 1.14, 1.14), offset: 0.45 }, { transform: T(b.x, b.y) }], { duration: 420, easing: "cubic-bezier(.3,1.6,.5,1)" }); burst(b.x + L.w / 2, b.y + 30 * L.u, "flake", 8, "#8b7cff"); burst(b.x + L.w / 2, b.y + 30 * L.u, "spark", 5, "#ffe27a"); }
    }, wait);
    if (p.revealed !== null) unwrap(p.revealed, reduce ? 0 : 330);
    p.unwrapped.forEach((id, i) => unwrap(id, (reduce ? 0 : landed + 160) + i * 110));
    p.finished.forEach((fb, fi) => later(() => { setStamped((c) => new Set([...c, fb])); play("stamp", doneCount(g) - 1 + fi); haptic([10, 30, 12]); const items = g.bays[fb]?.items || []; items.forEach((n: any, i: number) => { const el = els.current.get(n.id), b = posOf(L, g, n.id, null); if (el && b && !reduce) el.animate([{ transform: T(b.x, b.y) }, { transform: T(b.x, b.y - 16 * L.u, 0, 1.04, 1.04) }, { transform: T(b.x, b.y) }], { duration: 420, delay: i * 55, easing: "cubic-bezier(.3,1.5,.5,1)" }); }); burst(L.cx[fb], rimY(L, fb, g.cap), "spark", 8, "#ffd23f"); }, reduce ? 0 : landed));
    p.unlocked.forEach((ub) => later(() => { play("unlock"); burst(L.cx[ub], rimY(L, ub, g.cap) + 60 * L.u, "spark", 9, "#ffd23f"); wobble(ub, 5); flash("Padlock open!", "info", 1800); }, reduce ? 0 : landed + 220));
  });
  // lifted items bob gently while you decide where to put them
  useLayoutEffect(() => {
    const g = S.current?.game; if (!g) return; const lifted = new Set<number>();
    if (sel !== null && !reduce && !drag.current?.active) g.bays[sel]?.items.slice(-topRun(g, sel)).forEach((n: any) => lifted.add(n.id));
    bobs.current.forEach((an, id) => { if (!lifted.has(id)) { an.cancel(); bobs.current.delete(id); } });
    lifted.forEach((id) => { if (bobs.current.has(id)) return; const el = els.current.get(id); if (el) bobs.current.set(id, el.animate([{ transform: "translateY(0)" }, { transform: "translateY(-4px)" }], { duration: 650, direction: "alternate", iterations: Infinity, easing: "ease-in-out", composite: "add" })); });
  });
  // when a level opens, the items drop onto their shelves one after another
  useLayoutEffect(() => {
    const g = S.current?.game; if (!g || !lay || reduce || !round) return;
    g.bays.forEach((bay: any, b: number) => bay.items.forEach((n: any, i: number) => { const el = els.current.get(n.id), p = itemXY(lay, b, i); if (el) el.animate([{ transform: T(p.x, p.y - 70 * lay.u, 0, 0.92, 1.08), opacity: 0 }, { transform: T(p.x, p.y + 4 * lay.u, 0, 1.06, 0.92), opacity: 1, offset: 0.7 }, { transform: T(p.x, p.y), opacity: 1 }], { duration: 480, delay: b * 45 + i * 28, easing: "cubic-bezier(.3,.7,.4,1)", fill: "backwards" }); }));
  }, [round]);   // eslint-disable-line react-hooks/exhaustive-deps

  const doMove = (a: number, b: number, fast = false, override?: Map<number, { x: number; y: number }>) => {
    const x = S.current!, g = x.game, L = lay!, from = new Map<number, { x: number; y: number }>(), run = selRun(g, a);
    for (let i = g.bays[a].items.length - run; i < g.bays[a].items.length; i++) { const id = g.bays[a].items[i].id; from.set(id, override?.get(id) || itemXY(L, a, i, liftFor(L))); }
    const r = move(g, a, b); if (!r.ok) return; if (levelPos(g.level) <= 3 && !g.daily) x.profile.coached[g.level] = true; if (r.revealed !== null) hold.current.add(r.revealed); (r.unwrapped || []).forEach((id: number) => hold.current.add(id));
    pend.current = { ids: r.ids, from, src: a, dst: b, fast, won: r.won, finished: r.finished ?? [], revealed: r.revealed, unwrapped: r.unwrapped ?? [], unlocked: r.unlocked ?? [] }; r.ids.forEach((id: number) => noTrans.current.add(id));
    setSelBoth(null); setHintBays([]); setMsg(null); setNudge(false);
    if (r.cracked?.length) later(() => { play("crack"); flash("That jar used its last move! It can't be moved again.", "warn", 3800); }, reduce ? 0 : 700);
    if (g.won) finish(g, (reduce ? 0 : 640) + r.ids.length * 60);
    else if (!hasMoves(g)) later(() => { setNudge(true); flash("No moves left! Undo, or add a cart.", "warn", 5000); }, 800);
    else if (g.moves >= 4 && g.moves % 2 === 0) later(() => { const gg = S.current?.game; if (gg !== g || gg.done || !hasMoves(g)) return; if (looksStuck(g, 9000)) { setNudge(true); play("refuse"); flash("Hmm, this might be a dead end. Try Undo?", "warn", 6500); } }, 1500);
    bump(); save();
  };
  const finish = (g: any, wait: number) => {
    const x = S.current!, r: any = g.daily ? completeDaily(x.profile, g, g.daily) : completeLevel(x.profile, g), L = lay!; later(() => play("win"), wait);
    later(() => { if (!reduce) { g.bays.forEach((bay: any, b: number) => bay.items.forEach((it: any, i: number) => { const el = els.current.get(it.id), p = itemXY(L, b, i); if (el && p) el.animate([{ transform: T(p.x, p.y) }, { transform: T(p.x, p.y - 22 * L.u, 0, 1.04, 1.04) }, { transform: T(p.x, p.y) }], { duration: 480, delay: (b * 3 + i) * 28, easing: "cubic-bezier(.3,1.5,.5,1)" }); })); for (let k = 0; k < 14; k++) later(() => burst(L.cx[k % g.bays.length], rimY(L, k % g.bays.length, g.cap) + 20 * L.u, "spark", 5, ["#ffd23f", "#ff6b9d", "#4cc3ff", "#7cd992"][k % 4]), k * 90); } }, wait + 200);
    later(() => { if (r.reward?.coins) play("coin"); setResult({ ...r, daily: g.daily || null, level: g.level, moves: g.moves, par: g.par, nextDept: !g.daily && g.level % 10 === 0 ? DEPTS[deptOf(g.level + 1)].name : null }); save(); }, wait + (reduce ? 200 : 1700));
  };
  const nope = (b: number, why: string) => {
    play("refuse"); haptic(30); flash(why, "warn", 3200); const el = bayEls.current[b]; if (el && !reduce) el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }], { duration: 340 });
    const cur = selRef.current; if (lay && st && cur !== null && !reduce && !drag.current?.active) st.bays[cur].items.slice(-selRun(st, cur)).forEach((n: any) => { const e = els.current.get(n.id), p = posOf(lay, st, n.id, cur); if (e && p) e.animate([{ transform: T(p.x, p.y) }, { transform: T(p.x, p.y, -4) }, { transform: T(p.x, p.y, 4) }, { transform: T(p.x, p.y) }], { duration: 300 }); });
  };
  const tap = (b: number) => {
    const x = S.current; if (!x || !lay || x.game.done || result || intro !== null) return; const g = x.game, cur = selRef.current;
    if (cur === null) { if (!g.bays[b].items.length) { nope(b, "That shelf is empty."); return; } if (isLocked(g, b)) { nope(b, whyNot(g, b, b === 0 ? 1 : 0) || "Padlocked!"); return; } setSelBoth(b); setHintBays([]); play("pick"); haptic(5); return; }
    if (cur === b) { setSelBoth(null); play("drop"); return; }
    const why = whyNot(g, cur, b); if (!why) { doMove(cur, b); return; }
    nope(b, why); if (g.bays[b].items.length && !isLocked(g, b)) setSelBoth(b);
  };

  // ---- drag to move: press a shelf and drag its top items; they follow your finger and drop onto the shelf you release over
  const bayAt = (cx: number, cy: number) => {
    const el = stage.current, g = S.current?.game; if (!el || !lay || !g) return null; const r = el.getBoundingClientRect(), x = cx - r.left, y = cy - r.top, wd = 216 * lay.u;
    for (let b = 0; b < g.bays.length; b++) { const left = lay.cx[b] - wd / 2, top = rimY(lay, b, g.cap) - 52 * lay.u, h = (g.cap * SLOT + 80) * lay.u; if (x >= left && x <= left + wd && y >= top && y <= top + h) return b; }
    return null;
  };
  const clearDrop = () => bayEls.current.forEach((e) => e?.classList.remove("drop", "bad"));
  const onDown = (e: React.PointerEvent) => {
    const x = S.current; if (!x || !lay || x.game.done || result || intro !== null || picker || (e.pointerType === "mouse" && e.button !== 0)) return; const b = bayAt(e.clientX, e.clientY); if (b === null || !x.game.bays[b].items.length || isLocked(x.game, b)) return;
    const cur = selRef.current; if (cur !== null && cur !== b) return; drag.current = { b, x0: e.clientX, y0: e.clientY, active: false, ids: [], base: new Map(), now: new Map(), hover: null, z: new Map() };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current, g = S.current?.game; if (!d || !g || !lay) return; const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.active) {
      if (Math.hypot(dx, dy) < 10) return; d.active = true; suppress.current = true; try { stage.current?.setPointerCapture(e.pointerId); } catch { /* not supported */ }
      const run = selRun(g, d.b), items = g.bays[d.b].items; for (let i = items.length - run; i < items.length; i++) { const id = items[i].id; d.ids.push(id); d.base.set(id, itemXY(lay, d.b, i, liftFor(lay))); d.z.set(id, lay.row[d.b] * 100 + i + 60); }
      if (selRef.current !== d.b) { setSelBoth(d.b); play("pick"); haptic(5); } d.ids.forEach((id) => { bobs.current.get(id)?.cancel(); bobs.current.delete(id); });
    }
    d.ids.forEach((id) => { const el = els.current.get(id), b0 = d.base.get(id)!, p = { x: b0.x + dx, y: b0.y + dy }; d.now.set(id, p); if (el) { el.style.transition = "none"; el.style.zIndex = "5000"; el.style.transform = T(p.x, p.y, Math.max(-9, Math.min(9, dx * 0.05)), 1.06, 1.06); el.classList.add("dragging"); } });
    const nb = bayAt(e.clientX, e.clientY); if (nb !== d.hover) { clearDrop(); d.hover = nb; if (nb !== null && nb !== d.b) bayEls.current[nb]?.classList.add("drop", ...(whyNot(g, d.b, nb) ? ["bad"] : [])); }
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null; if (!d) return; try { stage.current?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    window.setTimeout(() => { suppress.current = false; }, 60); if (!d.active) return; clearDrop(); const g = S.current!.game, target = d.hover;
    const restore = () => d.ids.forEach((id) => { const el = els.current.get(id), b0 = d.base.get(id)!, cur = d.now.get(id); if (!el) return; el.classList.remove("dragging"); const done = () => { el.style.transform = T(b0.x, b0.y, 0, 1.03, 1.03); el.style.zIndex = String(d.z.get(id)); el.style.transition = ""; }; if (reduce || !cur) { done(); return; } el.animate([{ transform: T(cur.x, cur.y, 0, 1.06, 1.06) }, { transform: T(b0.x, b0.y, 0, 1.03, 1.03) }], { duration: 220, easing: "cubic-bezier(.3,1.5,.5,1)" }).onfinish = done; done(); });
    if (target !== null && target !== d.b) { const why = whyNot(g, d.b, target); if (!why) { d.ids.forEach((id) => els.current.get(id)?.classList.remove("dragging")); doMove(d.b, target, false, d.now); return; } nope(target, why); }
    restore();
  };

  const doUndo = () => { const x = S.current!, g = x.game; if (g.done || !g.history.length) return; const h = g.history[g.history.length - 1], L = lay!, from = new Map<number, { x: number; y: number }>();
    for (let i = g.bays[h.b].items.length - h.n; i < g.bays[h.b].items.length; i++) from.set(g.bays[h.b].items[i].id, itemXY(L, h.b, i));
    const r = undoMove(g); if (!r) return; pend.current = { ids: r.ids, from, src: h.b, dst: h.a, fast: true, won: false, finished: [], revealed: null, unwrapped: [], unlocked: [] }; r.ids.forEach((id: number) => noTrans.current.add(id));
    setSelBoth(null); setHintBays([]); setMsg(null); setNudge(false); setStamped(new Set(g.bays.map((_: any, i: number) => (bayDone(g, i) ? i : -1)).filter((i: number) => i >= 0))); play("undo"); bump(); save(); };
  /** A ghost copy of the top items flies the suggested move (twice) so you can see exactly what to do. */
  const ghostHint = (from: number, to: number) => {
    const L = lay!, g = S.current!.game, layer = fx.current; if (!layer || reduce) return; const A = g.bays[from].items, B = g.bays[to].items, n = Math.max(1, Math.min(selRun(g, from), g.cap - B.length)), pk = Math.min(rimY(L, from, g.cap), rimY(L, to, g.cap)) - (SPR_H + 14) * L.u;
    A.slice(A.length - n).forEach((it: any, j: number) => { const el = els.current.get(it.id); if (!el) return; const ghost = el.cloneNode() as HTMLImageElement; ghost.className = "sh-ghost"; ghost.removeAttribute("data-id"); ghost.style.width = `${L.w}px`; ghost.style.transform = ""; layer.appendChild(ghost);
      const f = itemXY(L, from, A.length - n + j), t = itemXY(L, to, B.length + j);
      ghost.animate([{ transform: T(f.x, f.y), opacity: 0 }, { transform: T(f.x, f.y), opacity: 0.85, offset: 0.08 }, { transform: T(f.x, pk), opacity: 0.85, offset: 0.36 }, { transform: T(t.x, pk), opacity: 0.85, offset: 0.64 }, { transform: T(t.x, t.y), opacity: 0.85, offset: 0.9 }, { transform: T(t.x, t.y), opacity: 0 }], { duration: 1600, delay: j * 90, iterations: 2, easing: "ease-in-out" }).onfinish = () => ghost.remove(); });
  };
  const doHint = () => {
    const x = S.current!, g = x.game; if (g.done) return; if (x.profile.hints < 1) { flash("No hints left. Clear levels to earn more.", "warn"); return; }
    const h = getHint(g); if (!h) { flash("No way forward from here. Try Undo or add a cart.", "warn", 4000); return; }
    x.profile.hints--; setSelBoth(null); setHintBays([h.from, h.to]); play("hint"); ghostHint(h.from, h.to); flash(`Hint: move from shelf ${h.from + 1} to shelf ${h.to + 1}.`, "info", 3600); bump(); save();
  };
  const doAddCart = () => {
    const x = S.current!, g = x.game; if (g.done) return; if (g.extra >= MAX_EXTRA) { flash(`You can add ${MAX_EXTRA} extra carts per level.`, "warn"); return; } if (x.profile.carts < 1) { flash("No carts left. Clear levels to earn more.", "warn"); return; }
    if (addCart(g)) { x.profile.carts--; setSelBoth(null); play("cart"); setMsg(null); bump(); save(); }
  };
  useEffect(() => { const g = S.current?.game; if (!g || view !== "play" || g.moves > 0) return; const id = window.setTimeout(() => { if (g.daily) flash("Daily Delivery! The same board for everyone today.", "info", 3200); else if (g.boss) flash("STOCK TAKE! A bigger delivery and a bigger reward.", "info", 3600); else if (g.breather) flash("A breather: this one is a little easier.", "info", 3000); }, 900); return () => clearTimeout(id); }, [round, view]);   // eslint-disable-line react-hooks/exhaustive-deps
  const resetUi = () => { setSelBoth(null); setResult(null); setMsg(null); setHintBays([]); setStamped(new Set()); setNudge(false); pend.current = null; hold.current.clear(); timers.current.forEach(clearTimeout); timers.current = []; setRound((v) => v + 1); };
  const open = (level: number, fresh = false) => { const x = S.current!; setView("play"); if (!fresh && x.game.level === level && !x.game.daily && !x.game.done) { setPicker(false); setRound((v) => v + 1); return; } x.game = newGame(level); resetUi(); setPicker(false); bump(); save(); };
  const restart = () => { const x = S.current!; x.game = x.game.daily ? newDailyGame(x.game.daily) : newGame(x.game.level); resetUi(); bump(); save(); };
  const next = () => { const x = S.current!; x.game = newGame(x.profile.level); resetUi(); bump(); save(); };
  const goHome = () => { setPanel(false); setPicker(false); setSelBoth(null); setView("home"); save(); bump(); };
  const playNow = () => { const x = S.current!; setPanel(false); setView("play"); if (x.game.daily || x.game.done || (x.game.level !== x.profile.level && x.game.moves === 0)) { if (x.game.daily && !x.game.done && x.game.moves > 0) { setRound((v) => v + 1); } else { x.game = newGame(x.profile.level); resetUi(); } } else setRound((v) => v + 1); bump(); save(); };
  const startDaily = () => {
    const x = S.current!, day = dayKey(new Date()); setPanel(false);
    if (x.game.daily === day && !x.game.done && x.game.moves > 0) { setView("play"); setRound((v) => v + 1); bump(); return; }
    setBusy(true); window.setTimeout(() => { x.game = newDailyGame(day); resetUi(); setView("play"); setBusy(false); bump(); save(); }, 40);
  };
  const closeIntro = () => { const x = S.current!, d = intro ?? dept; x.profile.seen[d] = true; x.fresh = false; setIntro(null); save(); bump(); };
  const setSetting = (k: keyof Settings) => { const x = S.current!; x.settings[k] = !x.settings[k]; if (k === "sfx" || k === "music") setAudioOptions({ sfx: x.settings.sfx, music: x.settings.music }); bump(); save(); };
  const doBuy = (id: string) => { const x = S.current!, r = buyDecor(x.profile, id); if (r.ok) { play("coin"); save(); bump(); } };
  const doEquip = (id: string) => { const x = S.current!; if (equipDecor(x.profile, id).ok) { play("tap"); save(); bump(); } };

  if (!s || !st || !lay) return <div className="sh-root"><div className="sh-loading">OPENING THE SHOP…</div></div>;
  const today = dayKey(new Date()), homeDept = deptOf(s.profile.level), dailyDept = deptOf(dailyLevel(today)), sp = specFor(st.level), u = lay.u, w = lay.w, canCart = st.extra < MAX_EXTRA && s.profile.carts > 0, run = sel !== null ? selRun(st, sel) : 0, [bgA, bgB] = DEPT_BG[dept];
  const eq = s.profile.decor.equipped, mo = new Date().getMonth(), season = !s.settings.seasons ? "" : [11, 0, 1].includes(mo) ? "season-winter" : [8, 9, 10].includes(mo) ? "season-autumn" : [2, 3, 4].includes(mo) ? "season-spring" : "";
  const dn = doneCount(st), bag = st.bays.find((b: any) => b.bag);
  const coachOn = view === "play" && !st.daily && levelPos(st.level) <= 3 && !s.profile.coached[st.level] && st.moves === 0 && !st.done && intro === null && !result && !picker;
  if (coachOn && (!coachRef.current || coachRef.current.key !== `${st.level}:${round}`)) coachRef.current = { key: `${st.level}:${round}`, move: getHint(st) };
  const cm = coachOn ? coachRef.current?.move : null, coachPos = cm ? { a: itemXY(lay, cm.from, st.bays[cm.from].items.length - 1), b: itemXY(lay, cm.to, Math.min(st.cap - 1, st.bays[cm.to].items.length)) } : null;
  const items: any[] = []; st.bays.forEach((bay: any, b: number) => bay.items.forEach((n: any, i: number) => items.push({ n, b, i })));
  const tagOf = (bay: any) => (bay.bag ? { icon: "bag", text: "BAG" } : bay.s ? { icon: "cart", text: "CART" } : typeof bay.a === "number" ? { icon: `s${st.keys[bay.a].v}`, text: SUBJECTS[st.keys[bay.a].v].toUpperCase() } : bay.a === "shirt" ? { icon: "hanger", text: "SHIRTS" } : bay.a === "book" ? { icon: "books", text: "BOOKS" } : bay.a === "jar" ? { icon: "jar", text: "JARS" } : bay.a === "tin" ? { icon: "tin", text: "TINS" } : null);
  const nameOf = (k: any, x = 0) => { const col = SHIRT_NAMES[(k.v + (k.kind === "tin" ? 5 : 0)) % SHIRT_NAMES.length]; return k.kind === "book" ? `${SUBJECTS[k.v % SUBJECTS.length]} book` : k.kind === "toy" ? `${col} toy, size ${x}` : k.kind === "jar" ? `${col} jar, ${x} moves left` : k.kind === "shoe" ? `${col} ${x === 1 ? "left" : "right"} shoe` : `${col} ${KINDNAME[k.kind] || k.kind}`; };
  const topName = (bay: any) => { const t = bay.items[bay.items.length - 1]; if (!t) return "empty"; if (t.q) return "a wrapped item"; return nameOf(st.keys[t.k], t.x); };
  const deptName = (d: number) => DEPTS[d].name, headerTop = st.daily ? `DAILY DELIVERY · ${deptName(dept).toUpperCase()}` : `${deptName(dept).toUpperCase()}${st.boss ? " · STOCK TAKE" : st.breather ? " · BREATHER" : ""}`;
  const demo = (d: number) => d === 0 ? [0, 0, 1].map((v, i) => <img key={i} src={itemUrl("shirt", v === 0 ? 0 : 6)} alt="" />) : d === 1 ? [2, 0, 6].map((v, i) => <img key={i} src={itemUrl("book", v)} alt="" />) : d === 2 ? [<img key="a" src={itemUrl("shirt", 6)} alt="" />, <img key="b" src={itemUrl("book", 3)} alt="" />] : d === 3 ? [3, 2, 1].map((x) => <img key={x} src={itemUrl("toy", 6, false, false, x, 3)} alt="" />)
    : d === 4 ? [<img key="a" src={itemUrl("jar", 0, false, false, 2, 0)} alt="" />, <img key="b" src={itemUrl("tin", 5)} alt="" />, <img key="c" src={itemUrl("jar", 6, false, false, 0, 0)} alt="" />] : d === 5 ? [<img key="a" src={itemUrl("shoe", 6, false, false, 1)} alt="" />, <img key="b" src={itemUrl("shoe", 6, false, false, 2)} alt="" />, <img key="c" src={itemUrl("shoe", 6, false, false, 1)} alt="" />]
    : d === 6 ? [<img key="a" src={itemUrl("gift", 8)} alt="" />, <img key="l" className="lk" src={padlockUrl()} alt="" />, <img key="b" src={itemUrl("gift", 3)} alt="" />] : d === 7 ? [<img key="a" src={itemUrl("shirt", 0)} alt="" />, <img key="b" src={itemUrl("book", 0)} alt="" />, <img key="c" className="lk" src={iconUrl("bag")} alt="" />] : [<img key="a" src={itemUrl("toy", 3, false, false, 3, 3)} alt="" />, <img key="l" className="lk" src={padlockUrl()} alt="" />, <img key="b" src={itemUrl("shoe", 5, false, false, 2)} alt="" />];

  return (
    <div className={`sh-root v-${view} fin-${eq.finish} ${season} ${prefs.calm ? "sh-calm" : ""}`} style={{ ["--bgA" as any]: bgA, ["--bgB" as any]: bgB }}>
      <Scene dept={view === "home" ? homeDept : dept} />
      {view === "home" && <Home profile={s.profile} level={Math.max(1, s.profile.level)} dept={homeDept} resume={!st.done && st.moves > 0 ? { sub: st.daily ? `Daily Delivery · ${st.moves} moves in` : `Level ${st.level} · ${st.moves} moves in` } : null}
        dailyDone={!!s.profile.daily.done[today]} dailySub={deptName(dailyDept)} streak={s.profile.daily.last === today || s.profile.daily.last === prevDayOf(today) ? s.profile.daily.streak : 0} onPlay={playNow} onDaily={startDaily} onLevels={() => setPicker(true)} onDecor={() => setDecorOpen(true)} onHelp={() => setIntro(homeDept)} onSettings={() => setPanel((v) => !v)} />}
      {view === "play" && <header className="sh-top">
        <button className="sh-btn round" onClick={goHome} aria-label="Back to the home screen">←</button>
        <button key={`lv${round}`} className="sh-level sh-sign-level" onClick={() => setPicker(true)} aria-label={`${headerTop}${st.daily ? "" : `, level ${st.level}`}. Pick a level`}><small>{headerTop}</small><b>{st.daily ? "TODAY" : `LEVEL ${st.level}`}</b></button>
        <div className="sh-stat" aria-label={`${s.profile.coins} coins`}><small>COINS</small><b><img className="cn" src={coinUrl()} alt="" draggable={false} />{s.profile.coins}</b></div>
        <div className="sh-stat dim"><small>MOVES</small><b>{st.moves}</b></div>
        <button className="sh-btn round" onClick={restart} aria-label="Restart this level">⟳</button>
        <button className="sh-btn round" onClick={() => setPanel((v) => !v)} aria-label="Settings" aria-expanded={panel}>⚙</button>
      </header>}
      {panel && (
        <div className="sh-panel" role="dialog" aria-label="Settings">
          <label><input type="checkbox" checked={s.settings.sfx} onChange={() => setSetting("sfx")} /> Sound effects</label>
          <label><input type="checkbox" checked={s.settings.music} onChange={() => setSetting("music")} /> Soft background music</label>
          <label><input type="checkbox" checked={s.settings.seasons} onChange={() => setSetting("seasons")} /> Seasonal decorations</label>
          <label><input type="checkbox" checked={s.settings.symbols} onChange={() => setSetting("symbols")} /> Show a symbol on each shirt (for colour blindness)</label>
          <div className="sh-panel-row"><PrefsButtons /><button className="sh-btn" onClick={() => { setPanel(false); setIntro(view === "home" ? homeDept : dept); }}>HOW TO PLAY</button><button className="sh-btn" onClick={() => setPanel(false)}>DONE</button></div>
        </div>
      )}
      {view === "play" && st.order && bag && (
        <div className="sh-ticket" role="note" aria-label="The customer's order"><b>ORDER</b>{st.order.map((o: any) => { const k = st.keys[o.k], have = bag.items.filter((it: any) => it.k === o.k).length; return <span key={o.k} className={`ln ${have >= o.n ? "ok" : ""}`} aria-label={`${nameOf(k, 0)}, ${have} of ${o.n}`}><img src={itemUrl(k.kind, k.v)} alt="" draggable={false} />{have}/{o.n}</span>; })}</div>
      )}

      {view === "play" && <div ref={stageRef} className="sh-stage" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {st.bays.map((bay: any, b: number) => {
          const tag = tagOf(bay), kind = bay.bag ? "bag" : bay.s ? "cart" : typeof bay.a === "number" ? "label" : bay.a === "shirt" || bay.a === "jar" ? "rack" : bay.a === "book" || bay.a === "tin" ? "shelf" : "any", done = bayDone(st, b), locked = isLocked(st, b);
          return (
            <div key={`b${b}`} ref={(el) => { bayEls.current[b] = el; }} className={`sh-bay k-${kind} ${locked ? "locked" : ""} ${sel !== null && sel !== b && !whyNot(st, sel, b) ? "ok" : ""} ${sel === b ? "sel" : ""} ${hintBays.includes(b) ? "hint" : ""} ${done && stamped.has(b) ? "done" : ""}`}
              style={{ left: lay.cx[b] - 108 * u, top: rimY(lay, b, st.cap) - 6 * u, width: 216 * u, height: (st.cap * SLOT + 16 + 6) * u + FLOOR * u * 0.55, borderRadius: `${10 * u}px ${10 * u}px ${16 * u}px ${16 * u}px`, borderWidth: Math.max(2, 7 * u) }}>
              {tag && <div className="sh-tag" style={{ top: -44 * u, height: 34 * u, fontSize: Math.max(9, 14 * u), minWidth: 120 * u }}><img src={iconUrl(tag.icon)} alt="" draggable={false} style={{ height: 24 * u }} /><span>{tag.text}</span></div>}
              {done && stamped.has(b) && <img className="sh-stamp" src={stampUrl()} alt="" draggable={false} style={{ width: 36 * u * 1.15, right: -10 * u, top: -52 * u }} />}
            </div>
          );
        })}
        {items.map(({ n, b, i }) => {
          const lifted = sel === b && i >= st.bays[b].items.length - run, p = itemXY(lay, b, i, lifted ? liftFor(lay) : 0), k = st.keys[n.k], hidden = n.q || hold.current.has(n.id);
          return <img key={n.id} data-id={n.id} ref={(el) => { if (el) els.current.set(n.id, el); else els.current.delete(n.id); }} className={`sh-item ${lifted ? "lifted" : ""}`} src={itemUrl(k.kind, k.v, hidden, s.settings.symbols, n.x || 0, st.cap)} alt="" draggable={false}
            style={{ width: w, transform: lifted ? T(p.x, p.y, 0, 1.03, 1.03) : T(p.x, p.y), zIndex: lay.row[b] * 100 + i + (lifted ? 60 : 0), transition: noTrans.current.has(n.id) ? "none" : undefined }} />;
        })}
        {st.bays.map((bay: any, b: number) => isLocked(st, b) && <div key={`k${b}`} className="sh-lock" style={{ left: lay.cx[b], top: rimY(lay, b, st.cap) + st.cap * SLOT * 0.42 * u, fontSize: Math.max(10, 15 * u), zIndex: 1900 }}><img src={padlockUrl()} alt="" draggable={false} style={{ width: 46 * u * 1.4 }} /><b>{bay.lock - dn} to go</b></div>)}
        {st.bays.map((bay: any, b: number) => {
          const rule = bay.bag ? "the order bag" : bay.s ? "cart, holds anything" : typeof bay.a === "number" ? `shelf for ${SUBJECTS[st.keys[bay.a].v]} books` : bay.a === "shirt" ? "rack for shirts" : bay.a === "book" ? "shelf for books" : bay.a === "jar" ? "shelf for jars" : bay.a === "tin" ? "shelf for tins" : "shelf", h = (st.cap * SLOT + 64) * u, wd = 216 * u;
          return <button key={`t${b}`} className="sh-hit" style={{ left: lay.cx[b] - wd / 2, top: rimY(lay, b, st.cap) - 52 * u, width: wd, height: h + 16 * u }} onClick={() => { if (suppress.current) return; tap(b); }} aria-pressed={sel === b}
            aria-label={`Shelf ${b + 1}, ${rule}${isLocked(st, b) ? ", padlocked" : ""}, ${bay.items.length} of ${st.cap}, top: ${topName(bay)}${bayDone(st, b) ? ", finished" : ""}`} />;
        })}
        {coachPos && <>
          <div className="sh-coachtip" role="note">{COACH[dept]}</div>
          <div className="sh-hand" aria-hidden style={{ ["--x1" as any]: `${coachPos.a.x + w * 0.5 - 6}px`, ["--y1" as any]: `${coachPos.a.y + 26 * u}px`, ["--x2" as any]: `${coachPos.b.x + w * 0.5 - 6}px`, ["--y2" as any]: `${coachPos.b.y + 26 * u}px` }}>
            <svg viewBox="0 0 32 40" width="38" height="46"><path d="M12 3a3 3 0 0 1 6 0v14l3-1.5a3 3 0 0 1 4 1.5l1 1.5a4 4 0 0 1 1.2 3L26 31c-.5 4-3.5 7-8 7h-3c-4 0-6-2-8-5L4 25a3 3 0 0 1 5-3l3 3V3z" fill="#fff" stroke="#2b2342" strokeWidth="2" strokeLinejoin="round" /></svg>
          </div>
        </>}
        <div ref={fx} className="sh-fx" aria-hidden />
        {msg && <div className={`sh-msg ${msg.kind}`} role="status">{msg.text}</div>}
      </div>}

      {view === "play" && <footer className="sh-bar">
        <button className={`sh-act ${nudge ? "pulse" : ""}`} onClick={doUndo} disabled={st.done || !st.history.length} aria-label="Undo the last move"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><path d="M9 7H4v5M4 7l3.5-3.5A8 8 0 1 1 5 14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg><span>UNDO</span></button>
        <button className="sh-act" onClick={doHint} disabled={st.done} aria-label={`Hint, ${s.profile.hints} left`}><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z M9.5 19h5 M10.5 21.5h3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg><span>HINT</span><i>{s.profile.hints}</i></button>
        <button className={`sh-act ${canCart ? "" : "dim"}`} onClick={doAddCart} disabled={st.done} aria-label={`Add a cart, ${s.profile.carts} left`}><img src={iconUrl("cart", "#fff")} alt="" width={28} height={28} draggable={false} /><span>CART</span><i>{s.profile.carts}</i></button>
      </footer>}

      {busy && <div className="sh-modal" role="status"><div className="sh-card"><h2>PACKING TODAY&apos;S DELIVERY…</h2><div className="sh-demo" aria-hidden>{demo(dailyDept)}</div></div></div>}
      {intro !== null && (
        <div className="sh-modal" role="dialog" aria-label="How to play" onClick={closeIntro}>
          <div className="sh-card" onClick={(e) => e.stopPropagation()}>
            <h2>{deptName(intro).toUpperCase()}</h2>
            <div className="sh-demo" aria-hidden>{demo(intro)}</div>
            <p>{DEPTS[intro].rule}</p>
            <div className="sh-how"><p><b>Tap</b> a shelf to lift its top items, then <b>tap</b> another shelf to move them (or <b>drag</b> them there). Items stack on a matching one, or on an empty spot. Undo is free.</p></div>
            <button className="sh-btn go big" onClick={closeIntro}>START STOCKING ▶</button>
          </div>
        </div>
      )}
      {picker && (
        <div className="sh-modal" role="dialog" aria-label="Pick a level" onClick={() => setPicker(false)}>
          <div className="sh-card wide" onClick={(e) => e.stopPropagation()}>
            <h2>LEVELS</h2>
            <div className="sh-levels">{Array.from({ length: Math.ceil(Math.max(90, s.profile.level + 9) / 10) }, (_, sec) => (
              <section key={sec}><h3>{deptName(sec % DEPT_COUNT)}{sec >= DEPT_COUNT ? ` ${["", "II", "III", "IV", "V", "VI", "VII", "VIII"][Math.floor(sec / DEPT_COUNT)] || ""}` : ""}</h3>
                <div className="sh-grid">{Array.from({ length: 10 }, (_, i) => { const l = sec * 10 + i + 1, locked = l > s.profile.level, stars = s.profile.stars[l] || 0; return <button key={l} className={`sh-lv ${locked ? "locked" : ""} ${l === st.level && !st.daily ? "here" : ""}`} disabled={locked} onClick={() => open(l, true)} aria-label={`Level ${l}${locked ? ", locked" : `, ${stars} of 3 stars`}`}><b>{l}</b><small>{locked ? "🔒" : "★".repeat(stars) + "☆".repeat(3 - stars)}</small></button>; })}</div></section>
            ))}</div>
            <button className="sh-btn" onClick={() => setPicker(false)}>CLOSE</button>
          </div>
        </div>
      )}
      {decorOpen && <Decor profile={s.profile} onBuy={doBuy} onEquip={doEquip} onClose={() => setDecorOpen(false)} />}
      {result && (
        <div className="sh-modal" role="dialog" aria-label="Level complete">
          <div className="sh-card">
            <h2>{result.daily ? "DAILY DELIVERY DONE!" : `LEVEL ${result.level} STOCKED!`}</h2>
            <div className="sh-stars" aria-label={`${result.stars} of 3 stars`}>{[1, 2, 3].map((k) => <span key={k} className={k <= result.stars ? "on" : ""} style={{ animationDelay: `${k * 180}ms` }}>★</span>)}</div>
            <ul className="sh-sum"><li><span>Moves</span><b>{result.moves}</b></li><li><span>Par</span><b>{result.par}</b></li><li><span>Items</span><b>{sp.keys.length * sp.cap}</b></li></ul>
            {result.perfect && <p className="sh-perfect">✦ PERFECT: you matched the best solution! ✦</p>}
            {result.daily && result.first && <p className="sh-new"><b>🔥 {result.streak}</b> day streak{result.streak > 1 ? "!" : ". Come back tomorrow!"}</p>}
            {result.daily && !result.first && <p className="mute">You already finished today&apos;s delivery. Replays earn no extra rewards.</p>}
            {result.boss && <p className="sh-new"><b>Stock Take cleared!</b> Bonus supplies delivered.</p>}
            {result.nextDept && <p className="sh-new">Next up: <b>{result.nextDept}</b></p>}
            {(result.reward.hint > 0 || result.reward.cart > 0 || result.reward.coins > 0) && <div className="sh-chips">{result.reward.coins > 0 && <span><img className="cn" src={coinUrl()} alt="" draggable={false} />+{result.reward.coins} coins</span>}{result.reward.hint > 0 && <span>+{result.reward.hint} hint</span>}{result.reward.cart > 0 && <span>+{result.reward.cart} cart</span>}</div>}
            <div className="sh-row"><button className="sh-btn" onClick={() => (result.daily ? restart() : open(result.level, true))}>REPLAY</button>{result.daily ? <button className="sh-btn go big" onClick={goHome}>HOME</button> : <button className="sh-btn go big" onClick={next}>NEXT LEVEL ▶</button>}</div>
          </div>
        </div>
      )}
    </div>
  );
}
const prevDayOf = (day: string) => { const [y, m, d] = day.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d) - 86400000).toISOString().slice(0, 10); };
