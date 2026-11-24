"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any, react-hooks/refs */
// SHELF STOCKER: you are the stock clerk. Tap a shelf to lift its top items, tap another shelf to move them. Three departments teach three rules:
// Clothing Corner (sort shirts by colour), Book Nook (every shelf has a sign), Boutique (racks for shirts, shelves for books, both mixed up).
// Built for feel and smoothness: flat cached sprites moved with GPU transforms, one Web Animations arc per item (lift, tilt, glide, drop, squash), dust and sparkle
// particles made imperatively (no React re-renders), sound and a touch of haptics. React re-renders only when the game state changes. Rules live in arcade-server/shelf.
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { newGame, whyNot, move, undo as undoMove, addCart, hint as getHint, hasMoves, bayDone, topRun, newProfile, normalizeProfile, completeLevel, totalStars, specFor, deptOf, DEPTS, SUBJECTS, MAX_EXTRA } from "../../../arcade-server/shelf/index.mjs";
import { PrefsProvider, PrefsButtons, usePrefs, sfx, tone } from "../prefs";
import { itemUrl, iconUrl, stampUrl, SPR_W, SPR_H, SHIRT_NAMES } from "./sprites";
import "./shelf.css";

export const GAME_NAME = "Shelf Stocker";
const KEY = "shelfstocker:v1";
type Settings = { symbols: boolean };
type Saved = { profile: any; game: any; settings: Settings; fresh?: boolean };
const SLOT = 68, FLOOR = 18;                                  // design units: one item's step, and the gap under the floor of a bay
const DEPT_BG = [["#dff4ea", "#b7e2cf"], ["#fbefd2", "#efd3a0"], ["#e9e0fb", "#cdbff0"]];

export default function ShelfStocker() { return <PrefsProvider><Inner /></PrefsProvider>; }

function load(): Saved {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "null");
    if (j?.profile?.v === 1) {
      const profile = normalizeProfile(j.profile), g = j.game, ok = g?.v === 2 && !g.done && Array.isArray(g.bays) && g.bays.every((b: any) => Array.isArray(b?.items)) && g.level <= profile.level;
      return { profile, game: ok ? g : newGame(profile.level), settings: { symbols: !!j.settings?.symbols }, fresh: false };
    }
  } catch { /* blocked or corrupt */ }
  const profile = newProfile(); return { profile, game: newGame(1), settings: { symbols: false }, fresh: true };
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

function Inner() {
  const S = useRef<Saved | null>(null), stage = useRef<HTMLDivElement>(null), fx = useRef<HTMLDivElement>(null), els = useRef(new Map<number, HTMLImageElement>()), bayEls = useRef<(HTMLElement | null)[]>([]);
  const pend = useRef<{ ids: number[]; from: Map<number, { x: number; y: number }>; src: number; dst: number; fast: boolean; won: boolean; finished: number[]; revealed: number | null } | null>(null);
  const noTrans = useRef(new Set<number>()), hold = useRef(new Set<number>()), timers = useRef<number[]>([]), msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null), roRef = useRef<ResizeObserver | null>(null);
  const { prefs } = usePrefs();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [size, setSize] = useState({ w: 320, h: 400 });
  const [sel, setSel] = useState<number | null>(null);
  const [panel, setPanel] = useState(false), [introOpen, setIntro] = useState<number | null>(null), [picker, setPicker] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [msg, setMsg] = useState<{ text: string; kind: string } | null>(null);
  const [hintBays, setHintBays] = useState<number[]>([]);
  const [stamped, setStamped] = useState<Set<number>>(new Set());
  const [round, setRound] = useState(0);

  const save = useCallback(() => { try { const s = S.current; if (s) localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ } }, []);
  useEffect(() => { S.current = load(); bump(); save(); }, [save]);
  useEffect(() => { const sv = () => save(); window.addEventListener("pagehide", sv); return () => { window.removeEventListener("pagehide", sv); save(); timers.current.forEach(clearTimeout); }; }, [save]);
  const stageRef = useCallback((el: HTMLDivElement | null) => { stage.current = el; roRef.current?.disconnect(); if (!el) return; const go = () => setSize({ w: Math.max(240, el.clientWidth), h: Math.max(200, el.clientHeight) }); go(); roRef.current = new ResizeObserver(go); roRef.current.observe(el); }, []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const flash = (text: string, kind = "info", ms = 2600) => { setMsg({ text, kind }); if (msgTimer.current) clearTimeout(msgTimer.current); msgTimer.current = setTimeout(() => setMsg(null), ms); };

  const s = S.current, st = s?.game, dept = st ? deptOf(st.level) : 0;
  const intro = introOpen !== null ? introOpen : (s && !s.profile.seen[dept] ? dept : null);
  const lay: Lay | null = useMemo(() => (st ? computeLay(size.w, size.h, st.bays.length, st.cap) : null), [size.w, size.h, st?.bays.length, st?.cap]);   // eslint-disable-line react-hooks/exhaustive-deps
  const reduce = prefs.calm || (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  // ---- geometry
  const itemXY = (L: Lay, b: number, i: number, lift = 0) => ({ x: L.cx[b] - L.w / 2, y: L.Yb[b] - (SPR_H - 4) * L.u - i * SLOT * L.u - lift });
  const rimY = (L: Lay, b: number, cap: number) => L.Yb[b] - (cap * SLOT + 16) * L.u;
  const liftFor = (L: Lay) => 22 * L.u;
  const selRun = (g: any, b: number | null) => (b === null ? 0 : topRun(g, b));
  const posOf = (L: Lay, g: any, id: number, selB: number | null) => { for (let b = 0; b < g.bays.length; b++) { const i = g.bays[b].items.findIndex((n: any) => n.id === id); if (i >= 0) { const n = selRun(g, selB), lifted = selB === b && i >= g.bays[b].items.length - n; return itemXY(L, b, i, lifted ? liftFor(L) : 0); } } return null; };

  // ---- feel: particles, wobble, sound (all imperative, no React renders)
  const burst = (x: number, y: number, kind: "dust" | "spark", n = 5, colour = "#fff") => {
    const layer = fx.current; if (!layer || reduce) return;
    for (let i = 0; i < n; i++) {
      const d = document.createElement("i"), a = kind === "dust" ? Math.PI + (i / Math.max(1, n - 1)) * Math.PI * 0 + (i % 2 ? 0.2 : -0.2) + (i - n / 2) * 0.35 : (i / n) * Math.PI * 2, dist = (kind === "dust" ? 18 : 30) + (i % 3) * 8;
      d.className = `sh-p ${kind}`; d.style.left = `${x}px`; d.style.top = `${y}px`; if (kind === "spark") d.style.color = colour; if (kind === "spark") d.textContent = "✦";
      layer.appendChild(d);
      const dx = kind === "dust" ? (i % 2 ? 1 : -1) * dist * (0.5 + (i % 3) * 0.3) : Math.cos(a) * dist, dy = kind === "dust" ? -4 - (i % 3) * 5 : Math.sin(a) * dist - 8;
      d.animate([{ transform: "translate(-50%,-50%) scale(.5)", opacity: kind === "dust" ? 0.8 : 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${kind === "dust" ? 1.5 : 1})`, opacity: 0 }], { duration: kind === "dust" ? 420 : 640, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }).onfinish = () => d.remove();
    }
  };
  const wobble = (b: number, amp = 3) => { const el = bayEls.current[b]; if (!el || reduce) return; el.animate([{ transform: "translateY(0) scale(1,1)" }, { transform: `translateY(${amp}px) scale(1.012,.985)` }, { transform: "translateY(0) scale(1,1)" }], { duration: 240, easing: "ease-out" }); };
  const haptic = (ms: number | number[]) => { try { navigator.vibrate?.(ms); } catch { /* not supported */ } };
  const thud = (strength = 1) => { tone(150 - strength * 20, 0.09, "sine", 0.22 * strength); tone(300, 0.04, "triangle", 0.05 * strength); };

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
      later(() => { const cxm = to.x + L.w / 2, floorY = to.y + (SPR_H - 4) * L.u; if (k === 0) { thud(Math.min(1, p.ids.length / 2 + 0.4)); haptic(8); wobble(p.dst, 4); } burst(cxm, floorY - 6 * L.u, "dust", 4); }, delay + dur * 0.84);
    });
    const landed = (p.fast ? 420 : 640) + (p.ids.length - 1) * (p.fast ? 35 : 60);
    if (p.revealed !== null) later(() => { hold.current.delete(p.revealed!); bump(); sfx("reveal"); const el = els.current.get(p.revealed!); if (el && !reduce) { const b = posOf(L, g, p.revealed!, null); if (b) { el.animate([{ transform: T(b.x, b.y, 0, 1, 1) }, { transform: T(b.x, b.y - 8 * L.u, 0, 1.12, 1.12) }, { transform: T(b.x, b.y, 0, 1, 1) }], { duration: 380, easing: "cubic-bezier(.3,1.6,.5,1)" }); burst(b.x + L.w / 2, b.y + 36 * L.u, "spark", 6, "#ffe27a"); } } }, reduce ? 0 : 330);
    for (const fb of p.finished) later(() => { setStamped((c) => new Set([...c, fb])); sfx("good"); haptic([10, 30, 12]); const items = g.bays[fb]?.items || []; items.forEach((n: any, i: number) => { const el = els.current.get(n.id), b = posOf(L, g, n.id, null); if (el && b && !reduce) el.animate([{ transform: T(b.x, b.y) }, { transform: T(b.x, b.y - 16 * L.u, 0, 1.04, 1.04) }, { transform: T(b.x, b.y) }], { duration: 420, delay: i * 55, easing: "cubic-bezier(.3,1.5,.5,1)" }); }); burst(L.cx[fb], rimY(L, fb, g.cap), "spark", 8, "#ffd23f"); }, reduce ? 0 : landed);
  });
  // when a level opens, the items drop onto their shelves one after another
  useLayoutEffect(() => {
    const g = S.current?.game; if (!g || !lay || reduce || !round) return;
    g.bays.forEach((bay: any, b: number) => bay.items.forEach((n: any, i: number) => { const el = els.current.get(n.id), p = itemXY(lay, b, i); if (el) el.animate([{ transform: T(p.x, p.y - 70 * lay.u, 0, 0.92, 1.08), opacity: 0 }, { transform: T(p.x, p.y + 4 * lay.u, 0, 1.06, 0.92), opacity: 1, offset: 0.7 }, { transform: T(p.x, p.y), opacity: 1 }], { duration: 480, delay: b * 45 + i * 28, easing: "cubic-bezier(.3,.7,.4,1)", fill: "backwards" }); }));
  }, [round]);   // eslint-disable-line react-hooks/exhaustive-deps

  const doMove = (a: number, b: number, fast = false) => {
    const x = S.current!, g = x.game, L = lay!, from = new Map<number, { x: number; y: number }>(), run = selRun(g, a);
    for (let i = g.bays[a].items.length - run; i < g.bays[a].items.length; i++) from.set(g.bays[a].items[i].id, itemXY(L, a, i, liftFor(L)));
    const r = move(g, a, b); if (!r.ok) return; if (r.revealed !== null) hold.current.add(r.revealed);
    pend.current = { ids: r.ids, from, src: a, dst: b, fast, won: r.won, finished: r.finished ?? [], revealed: r.revealed }; r.ids.forEach((id: number) => noTrans.current.add(id));
    setSel(null); setHintBays([]); setMsg(null); tone(420 + (g.moves % 5) * 35, 0.05, "triangle", 0.08);
    if (g.won) finish(g, (reduce ? 0 : 640) + r.ids.length * 60); else if (!hasMoves(g)) later(() => flash("No moves left! Undo, or add a cart.", "warn", 5000), 800);
    bump(); save();
  };
  const finish = (g: any, wait: number) => {
    const x = S.current!, r = completeLevel(x.profile, g), L = lay!; later(() => sfx("win"), wait);
    later(() => { if (!reduce) { g.bays.forEach((bay: any, b: number) => bay.items.forEach((it: any, i: number) => { const el = els.current.get(it.id), p = itemXY(L, b, i); if (el && p) el.animate([{ transform: T(p.x, p.y) }, { transform: T(p.x, p.y - 22 * L.u, 0, 1.04, 1.04) }, { transform: T(p.x, p.y) }], { duration: 480, delay: (b * 3 + i) * 28, easing: "cubic-bezier(.3,1.5,.5,1)" });})); for (let k = 0; k < 14; k++) later(() => burst(L.cx[k % g.bays.length], rimY(L, k % g.bays.length, g.cap) + 20 * L.u, "spark", 5, ["#ffd23f", "#ff6b9d", "#4cc3ff", "#7cd992"][k % 4]), k * 90); } }, wait + 200);
    later(() => { setResult({ ...r, level: g.level, moves: g.moves, par: g.par, nextDept: g.level % 10 === 0 ? DEPTS[deptOf(g.level + 1)].name : null }); save(); }, wait + (reduce ? 200 : 1700));
  };
  const nope = (b: number, why: string) => {
    sfx("bad"); haptic(30); flash(why, "warn", 3200); const el = bayEls.current[b]; if (el && !reduce) el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }], { duration: 340 });
    if (lay && st && sel !== null && !reduce) st.bays[sel].items.slice(-selRun(st, sel)).forEach((n: any) => { const e = els.current.get(n.id), p = posOf(lay, st, n.id, sel); if (e && p) e.animate([{ transform: T(p.x, p.y) }, { transform: T(p.x, p.y, -4) }, { transform: T(p.x, p.y, 4) }, { transform: T(p.x, p.y) }], { duration: 300 }); });
  };
  const tap = (b: number) => {
    const x = S.current; if (!x || !lay || x.game.done || result || intro !== null) return; const g = x.game;
    if (sel === null) { if (!g.bays[b].items.length) { nope(b, "That shelf is empty."); return; } setSel(b); setHintBays([]); tone(540, 0.05, "triangle", 0.08); haptic(5); return; }
    if (sel === b) { setSel(null); tone(330, 0.04, "triangle", 0.06); return; }
    const why = whyNot(g, sel, b); if (!why) { doMove(sel, b); return; }
    nope(b, why); if (g.bays[b].items.length) setSel(b);
  };
  const doUndo = () => { const x = S.current!, g = x.game; if (g.done || !g.history.length) return; const h = g.history[g.history.length - 1], L = lay!, from = new Map<number, { x: number; y: number }>();
    for (let i = g.bays[h.b].items.length - h.n; i < g.bays[h.b].items.length; i++) from.set(g.bays[h.b].items[i].id, itemXY(L, h.b, i));
    const r = undoMove(g); if (!r) return; pend.current = { ids: r.ids, from, src: h.b, dst: h.a, fast: true, won: false, finished: [], revealed: null }; r.ids.forEach((id: number) => noTrans.current.add(id));
    setSel(null); setHintBays([]); setMsg(null); setStamped(new Set(g.bays.map((_: any, i: number) => (bayDone(g, i) ? i : -1)).filter((i: number) => i >= 0))); tone(260, 0.05, "triangle", 0.07); bump(); save(); };
  const doHint = () => {
    const x = S.current!, g = x.game; if (g.done) return; if (x.profile.hints < 1) { flash("No hints left. Clear levels to earn more.", "warn"); return; }
    const h = getHint(g); if (!h) { flash("No way forward from here. Try Undo or add a cart.", "warn", 4000); return; }
    x.profile.hints--; setSel(null); setHintBays([h.from, h.to]); sfx("reveal"); flash(`Hint: move from shelf ${h.from + 1} to shelf ${h.to + 1}.`); bump(); save();
  };
  const doAddCart = () => {
    const x = S.current!, g = x.game; if (g.done) return; if (g.extra >= MAX_EXTRA) { flash(`You can add ${MAX_EXTRA} extra carts per level.`, "warn"); return; } if (x.profile.carts < 1) { flash("No carts left. Clear levels to earn more.", "warn"); return; }
    if (addCart(g)) { x.profile.carts--; setSel(null); sfx("good"); setMsg(null); bump(); save(); }
  };
  const resetUi = () => { setSel(null); setResult(null); setMsg(null); setHintBays([]); setStamped(new Set()); pend.current = null; hold.current.clear(); timers.current.forEach(clearTimeout); timers.current = []; setRound((v) => v + 1); };
  const open = (level: number, fresh = false) => { const x = S.current!; if (!fresh && x.game.level === level && !x.game.done) { setPicker(false); return; } x.game = newGame(level); resetUi(); setPicker(false); bump(); save(); };
  const restart = () => { const x = S.current!; x.game = newGame(x.game.level); resetUi(); bump(); save(); };
  const next = () => { const x = S.current!; x.game = newGame(x.profile.level); resetUi(); bump(); save(); };
  const closeIntro = () => { const x = S.current!, d = intro ?? dept; x.profile.seen[d] = true; x.fresh = false; setIntro(null); save(); bump(); };

  if (!s || !st || !lay) return <div className="sh-root"><div className="sh-loading">OPENING THE SHOP…</div></div>;
  const sp = specFor(st.level), u = lay.u, w = lay.w, canCart = st.extra < MAX_EXTRA && s.profile.carts > 0, run = sel !== null ? selRun(st, sel) : 0, [bgA, bgB] = DEPT_BG[dept];
  const items: any[] = []; st.bays.forEach((bay: any, b: number) => bay.items.forEach((n: any, i: number) => items.push({ n, b, i })));
  const tagOf = (bay: any) => (bay.s ? { icon: "cart", text: "CART" } : typeof bay.a === "number" ? { icon: `s${st.keys[bay.a].v}`, text: SUBJECTS[st.keys[bay.a].v].toUpperCase() } : bay.a === "shirt" ? { icon: "hanger", text: "SHIRTS" } : bay.a === "book" ? { icon: "books", text: "BOOKS" } : null);
  const topName = (bay: any) => { const t = bay.items[bay.items.length - 1]; if (!t) return "empty"; if (t.q) return "a wrapped item"; const k = st.keys[t.k]; return k.kind === "shirt" ? `${SHIRT_NAMES[k.v % SHIRT_NAMES.length]} shirt` : `${SUBJECTS[k.v % SUBJECTS.length]} book`; };
  const deptName = (d: number) => DEPTS[d].name;

  return (
    <div className={`sh-root ${prefs.calm ? "sh-calm" : ""}`} style={{ ["--bgA" as any]: bgA, ["--bgB" as any]: bgB }}>
      <header className="sh-top">
        <Link href="/arcade" className="sh-btn round" aria-label="Back to the arcade">←</Link>
        <button className="sh-level" onClick={() => setPicker(true)} aria-label={`${deptName(dept)}, level ${st.level}. Pick a level`}><small>{deptName(dept).toUpperCase()}</small><b>LEVEL {st.level}</b></button>
        <div className="sh-stat" aria-label={`${totalStars(s.profile)} stars`}><small>STARS</small><b>★ {totalStars(s.profile)}</b></div>
        <div className="sh-stat dim"><small>MOVES</small><b>{st.moves}</b></div>
        <button className="sh-btn round" onClick={restart} aria-label="Restart this level">⟳</button>
        <button className="sh-btn round" onClick={() => setPanel((v) => !v)} aria-label="Settings" aria-expanded={panel}>⚙</button>
      </header>
      {panel && (
        <div className="sh-panel" role="dialog" aria-label="Settings">
          <label><input type="checkbox" checked={s.settings.symbols} onChange={() => { s.settings.symbols = !s.settings.symbols; bump(); save(); }} /> Show a symbol on each shirt (for colour blindness)</label>
          <div className="sh-panel-row"><PrefsButtons /><button className="sh-btn" onClick={() => { setPanel(false); setIntro(dept); }}>HOW TO PLAY</button><button className="sh-btn" onClick={() => setPanel(false)}>DONE</button></div>
        </div>
      )}

      <div ref={stageRef} className="sh-stage">
        {st.bays.map((bay: any, b: number) => {
          const tag = tagOf(bay), kind = bay.s ? "cart" : typeof bay.a === "number" ? "label" : bay.a === "shirt" ? "rack" : bay.a === "book" ? "shelf" : "any", done = bayDone(st, b);
          return (
            <div key={`b${b}`} ref={(el) => { bayEls.current[b] = el; }} className={`sh-bay k-${kind} ${sel === b ? "sel" : ""} ${hintBays.includes(b) ? "hint" : ""} ${done && stamped.has(b) ? "done" : ""}`}
              style={{ left: lay.cx[b] - 108 * u, top: rimY(lay, b, st.cap) - 6 * u, width: 216 * u, height: (st.cap * SLOT + 16 + 6) * u + FLOOR * u * 0.55, borderRadius: `${10 * u}px ${10 * u}px ${16 * u}px ${16 * u}px`, borderWidth: Math.max(2, 7 * u) }}>
              {tag && <div className="sh-tag" style={{ top: -44 * u, height: 34 * u, fontSize: Math.max(9, 14 * u), minWidth: 120 * u }}><img src={iconUrl(tag.icon)} alt="" draggable={false} style={{ height: 24 * u }} /><span>{tag.text}</span></div>}
              {done && stamped.has(b) && <img className="sh-stamp" src={stampUrl()} alt="" draggable={false} style={{ width: 36 * u * 1.15, right: -10 * u, top: -52 * u }} />}
            </div>
          );
        })}
        {items.map(({ n, b, i }) => {
          const lifted = sel === b && i >= st.bays[b].items.length - run, p = itemXY(lay, b, i, lifted ? liftFor(lay) : 0), k = st.keys[n.k], hidden = n.q || hold.current.has(n.id);
          return <img key={n.id} data-id={n.id} ref={(el) => { if (el) els.current.set(n.id, el); else els.current.delete(n.id); }} className={`sh-item ${lifted ? "lifted" : ""}`} src={itemUrl(k.kind, k.v, hidden, s.settings.symbols)} alt="" draggable={false}
            style={{ width: w, transform: lifted ? T(p.x, p.y, 0, 1.03, 1.03) : T(p.x, p.y), zIndex: lay.row[b] * 100 + i + (lifted ? 60 : 0), transition: noTrans.current.has(n.id) ? "none" : undefined }} />;
        })}
        {st.bays.map((bay: any, b: number) => {
          const rule = bay.s ? "cart, holds anything" : typeof bay.a === "number" ? `shelf for ${SUBJECTS[st.keys[bay.a].v]} books` : bay.a === "shirt" ? "rack for shirts" : bay.a === "book" ? "shelf for books" : "shelf", h = (st.cap * SLOT + 64) * u, wd = 216 * u;
          return <button key={`t${b}`} className="sh-hit" style={{ left: lay.cx[b] - wd / 2, top: rimY(lay, b, st.cap) - 52 * u, width: wd, height: h + 16 * u }} onClick={() => tap(b)} aria-pressed={sel === b}
            aria-label={`Shelf ${b + 1}, ${rule}, ${bay.items.length} of ${st.cap}, top: ${topName(bay)}${bayDone(st, b) ? ", finished" : ""}`} />;
        })}
        <div ref={fx} className="sh-fx" aria-hidden />
        {msg && <div className={`sh-msg ${msg.kind}`} role="status">{msg.text}</div>}
      </div>

      <footer className="sh-bar">
        <button className="sh-act" onClick={doUndo} disabled={st.done || !st.history.length} aria-label="Undo the last move"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><path d="M9 7H4v5M4 7l3.5-3.5A8 8 0 1 1 5 14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg><span>UNDO</span></button>
        <button className="sh-act" onClick={doHint} disabled={st.done} aria-label={`Hint, ${s.profile.hints} left`}><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z M9.5 19h5 M10.5 21.5h3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg><span>HINT</span><i>{s.profile.hints}</i></button>
        <button className={`sh-act ${canCart ? "" : "dim"}`} onClick={doAddCart} disabled={st.done} aria-label={`Add a cart, ${s.profile.carts} left`}><img src={iconUrl("cart", "#fff")} alt="" width={28} height={28} draggable={false} /><span>CART</span><i>{s.profile.carts}</i></button>
      </footer>

      {intro !== null && (
        <div className="sh-modal" role="dialog" aria-label="How to play" onClick={closeIntro}>
          <div className="sh-card" onClick={(e) => e.stopPropagation()}>
            <h2>{deptName(intro).toUpperCase()}</h2>
            <div className="sh-demo" aria-hidden>{intro === 0 ? [0, 0, 1].map((v, i) => <img key={i} src={itemUrl("shirt", v === 0 ? 0 : 6)} alt="" />) : intro === 1 ? [2, 0, 6].map((v, i) => <img key={i} src={itemUrl("book", v)} alt="" />) : [<img key="a" src={itemUrl("shirt", 6)} alt="" />, <img key="b" src={itemUrl("book", 3)} alt="" />]}</div>
            <p>{DEPTS[intro].rule}</p>
            <div className="sh-how"><p><b>Tap</b> a shelf to lift its top items, then <b>tap</b> another shelf to move them. Items stack on a matching one, or on an empty spot. Undo is free.</p></div>
            <button className="sh-btn go big" onClick={closeIntro}>START STOCKING ▶</button>
          </div>
        </div>
      )}
      {picker && (
        <div className="sh-modal" role="dialog" aria-label="Pick a level" onClick={() => setPicker(false)}>
          <div className="sh-card wide" onClick={(e) => e.stopPropagation()}>
            <h2>LEVELS</h2>
            <div className="sh-levels">{Array.from({ length: Math.ceil(Math.max(30, s.profile.level + 9) / 10) }, (_, sec) => (
              <section key={sec}><h3>{deptName(sec % 3)}{sec >= 3 ? ` ${["", "", "", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][Math.floor(sec / 3) + 1] || ""}` : ""}</h3>
                <div className="sh-grid">{Array.from({ length: 10 }, (_, i) => { const l = sec * 10 + i + 1, locked = l > s.profile.level, stars = s.profile.stars[l] || 0; return <button key={l} className={`sh-lv ${locked ? "locked" : ""} ${l === st.level ? "here" : ""}`} disabled={locked} onClick={() => open(l, true)} aria-label={`Level ${l}${locked ? ", locked" : `, ${stars} of 3 stars`}`}><b>{l}</b><small>{locked ? "🔒" : "★".repeat(stars) + "☆".repeat(3 - stars)}</small></button>; })}</div></section>
            ))}</div>
            <button className="sh-btn" onClick={() => setPicker(false)}>CLOSE</button>
          </div>
        </div>
      )}
      {result && (
        <div className="sh-modal" role="dialog" aria-label="Level complete">
          <div className="sh-card">
            <h2>LEVEL {result.level} STOCKED!</h2>
            <div className="sh-stars" aria-label={`${result.stars} of 3 stars`}>{[1, 2, 3].map((k) => <span key={k} className={k <= result.stars ? "on" : ""} style={{ animationDelay: `${k * 180}ms` }}>★</span>)}</div>
            <ul className="sh-sum"><li><span>Moves</span><b>{result.moves}</b></li><li><span>Par</span><b>{result.par}</b></li><li><span>Items</span><b>{sp.keys.length * sp.cap}</b></li></ul>
            {result.nextDept && <p className="sh-new">Next up: <b>{result.nextDept}</b></p>}
            {(result.reward.hint > 0 || result.reward.cart > 0) && <div className="sh-chips">{result.reward.hint > 0 && <span>+1 hint</span>}{result.reward.cart > 0 && <span>+1 cart</span>}</div>}
            <div className="sh-row"><button className="sh-btn" onClick={() => open(result.level, true)}>REPLAY</button><button className="sh-btn go big" onClick={next}>NEXT LEVEL ▶</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
