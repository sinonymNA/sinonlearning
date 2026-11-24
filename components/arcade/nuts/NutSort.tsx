"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any, react-hooks/refs */
// BOLT SORT: sort the coloured nuts so every bolt holds one colour. Tap a bolt to lift its top nuts, tap another bolt to move them.
// Why it does not lag: no WebGL and no per-frame code. Every nut is a pre-rendered 3D-looking sprite (sprites.ts) placed with a GPU transform, and a move is one
// Web Animations arc (lift, slide, drop) per nut. React only re-renders when a move happens. Rules and levels live in arcade-server/nuts (pure ESM, tested).
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { newGame, canMove, move, undo as undoMove, addBolt, hint as getHint, hasMoves, boltDone, newProfile, normalizeProfile, completeLevel, totalStars, specFor, MAX_EXTRA, LEVEL_COUNT_HINT } from "../../../arcade-server/nuts/index.mjs";
import { PrefsProvider, PrefsButtons, usePrefs, sfx, tone } from "../prefs";
import { nutUrl, plateUrl, rodUrl, capUrl, SPR_W, NUT_BASE, NUT_SIDE, PLATE_W, NAMES } from "./sprites";
import "./nuts.css";

export const GAME_NAME = "Bolt Sort";
const KEY = "boltsort:v1";
type Settings = { symbols: boolean };
type Saved = { profile: any; game: any; settings: Settings; fresh?: boolean };

export default function NutSort() { return <PrefsProvider><Inner /></PrefsProvider>; }

function load(): Saved {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "null");
    if (j?.profile?.v === 1) {
      const profile = normalizeProfile(j.profile), g = j.game, ok = g?.v === 1 && !g.done && Array.isArray(g.bolts) && g.bolts.every((b: any) => Array.isArray(b) && b.every((n: any) => typeof n?.c === "number")) && g.level <= profile.level;
      return { profile, game: ok ? g : newGame(profile.level), settings: { symbols: !!j.settings?.symbols }, fresh: false };
    }
  } catch { /* blocked or corrupt */ }
  const profile = newProfile(); return { profile, game: newGame(1), settings: { symbols: false }, fresh: true };
}

/** Size everything for the space available: pick the number of rows that lets the nuts be as big as possible. */
function computeLay(W: number, H: number, B: number, cap: number) {
  const rowUnits = (cap * NUT_SIDE + 180) / SPR_W;   // a row's height in nut widths (bolt, plate and room to lift a nut)
  let best = { w: 20, rows: 1, cols: B };
  for (let rows = 1; rows <= B; rows++) { const cols = Math.ceil(B / rows), w = Math.min(W / cols / (PLATE_W + 0.14), H / (rows * rowUnits), 150); if (w > best.w || rows === 1) best = { w, rows, cols }; }
  const { w, rows, cols } = best, u = w / SPR_W, rowH = rowUnits * w, cellW = W / cols, cx: number[] = [], Yb: number[] = [], row: number[] = [];
  for (let i = 0; i < B; i++) { const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, B - r * cols); cx.push((W - inRow * cellW) / 2 + (c + 0.5) * cellW); const top = (H - rows * rowH) / 2 + r * rowH; Yb.push(top + rowH - 32 * u - 0.06 * w); row.push(r); }
  return { w, u, rows, cols, rowH, cx, Yb, row };
}
type Lay = ReturnType<typeof computeLay>;

function Inner() {
  const S = useRef<Saved | null>(null), stage = useRef<HTMLDivElement>(null), els = useRef(new Map<number, HTMLImageElement>()), pend = useRef<{ ids: number[]; from: Map<number, { x: number; y: number }>; src: number; dst: number } | null>(null), noTrans = useRef(new Set<number>());
  const { prefs } = usePrefs();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [size, setSize] = useState({ w: 320, h: 400 });
  const [sel, setSel] = useState<number | null>(null);
  const [panel, setPanel] = useState(false), [helpOpen, setHelp] = useState(false), [helpDone, setHelpDone] = useState(false), [picker, setPicker] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [msg, setMsg] = useState<{ text: string; kind: string } | null>(null);
  const [hintBolts, setHintBolts] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const [capped, setCapped] = useState<Set<number>>(new Set());
  const [confetti, setConfetti] = useState(false);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(() => { try { const s = S.current; if (s) localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ } }, []);
  useEffect(() => { S.current = load(); bump(); save(); }, [save]);
  useEffect(() => { const sv = () => save(); window.addEventListener("pagehide", sv); return () => { window.removeEventListener("pagehide", sv); save(); }; }, [save]);
  const roRef = useRef<ResizeObserver | null>(null);
  const stageRef = useCallback((el: HTMLDivElement | null) => { stage.current = el; roRef.current?.disconnect(); if (!el) return; const go = () => setSize({ w: Math.max(240, el.clientWidth), h: Math.max(200, el.clientHeight) }); go(); roRef.current = new ResizeObserver(go); roRef.current.observe(el); }, []);
  const flash = (text: string, kind = "info", ms = 2600) => { setMsg({ text, kind }); if (msgTimer.current) clearTimeout(msgTimer.current); msgTimer.current = setTimeout(() => setMsg(null), ms); };

  const s = S.current, st = s?.game, help = helpOpen || (!!s?.fresh && !helpDone);
  const lay: Lay | null = useMemo(() => (st ? computeLay(size.w, size.h, st.bolts.length, st.cap) : null), [size.w, size.h, st?.bolts.length, st?.cap]);   // eslint-disable-line react-hooks/exhaustive-deps
  const reduce = prefs.calm || (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  /** Where a nut's sprite goes (top-left, px) for bolt b, position i; `lift` raises it clear of the rod. */
  const nutXY = (L: Lay, b: number, i: number, lift = 0) => ({ x: L.cx[b] - L.w / 2, y: L.Yb[b] - NUT_BASE * L.u - i * NUT_SIDE * L.u - lift });
  const liftFor = (L: Lay, cap: number, len: number, n: number) => ((cap - (len - n)) * NUT_SIDE + 54) * L.u;
  const selRun = (g: any, b: number | null) => { if (b === null || !g.bolts[b]?.length) return 0; const A = g.bolts[b], c = A[A.length - 1].c; let n = 0; while (n < A.length && A[A.length - 1 - n].c === c) n++; return n; };
  const posOf = (L: Lay, g: any, id: number, selB: number | null) => { for (let b = 0; b < g.bolts.length; b++) { const i = g.bolts[b].findIndex((n: any) => n.id === id); if (i >= 0) { const n = selRun(g, selB), lifted = selB === b && i >= g.bolts[b].length - n; return nutXY(L, b, i, lifted ? liftFor(L, g.cap, g.bolts[b].length, n) : 0); } } return null; };

  // after a move renders, arc the moved nuts from where they were to where they now are
  useLayoutEffect(() => {
    const p = pend.current, g = S.current?.game; if (!p || !g || !lay) return; pend.current = null; noTrans.current.clear();
    if (reduce) return;
    const peak = (b: number) => lay.Yb[b] - NUT_BASE * lay.u - (g.cap * NUT_SIDE + 46) * lay.u - 20 * lay.u;
    p.ids.forEach((id, k) => {
      const el = els.current.get(id), from = p.from.get(id), to = posOf(lay, g, id, null); if (!el || !from || !to) return;
      const pk = Math.min(peak(p.src), peak(p.dst)) - k * NUT_SIDE * lay.u * 0.9, T = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0)`;
      el.animate([{ transform: T(from.x, from.y), offset: 0 }, { transform: T(from.x, pk), offset: 0.28 }, { transform: T(to.x, pk), offset: 0.64 }, { transform: T(to.x, to.y), offset: 1 }], { duration: 560, delay: k * 70, easing: "cubic-bezier(.35,.1,.3,1)", fill: "backwards" });
    });
  });

  const doMove = (a: number, b: number) => {
    const x = S.current!, g = x.game, L = lay!; const from = new Map<number, { x: number; y: number }>(), run = selRun(g, a);
    for (let i = g.bolts[a].length - run; i < g.bolts[a].length; i++) { const n = g.bolts[a][i], pp = nutXY(L, a, i, liftFor(L, g.cap, g.bolts[a].length, run)); from.set(n.id, pp); }
    const wasDone = new Set(g.bolts.map((_: any, i: number) => boltDone(g, i) ? i : -1).filter((i: number) => i >= 0));
    const r = move(g, a, b); if (!r.ok) return; pend.current = { ids: r.ids, from, src: a, dst: b }; r.ids.forEach((id: number) => noTrans.current.add(id));
    setSel(null); setHintBolts([]); setMsg(null); tone(380 + g.moves % 6 * 30, 0.06, "triangle", 0.1);
    const nowDone = g.bolts.map((_: any, i: number) => (boltDone(g, i) && !wasDone.has(i) ? i : -1)).filter((i: number) => i >= 0);
    if (nowDone.length) window.setTimeout(() => { sfx("good"); setCapped((c) => new Set([...c, ...nowDone])); }, reduce ? 0 : 620);
    if (g.won) finish(g); else if (!hasMoves(g)) window.setTimeout(() => flash("No moves left! Undo, or add a bolt.", "warn", 5000), 700);
    bump(); save();
  };
  const finish = (g: any) => {
    const x = S.current!, r = completeLevel(x.profile, g); sfx("win");
    window.setTimeout(() => { setConfetti(true); if (lay && !reduce) els.current.forEach((el) => { const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(el.style.transform); if (!m) return; const base = el.style.transform, id = Number(el.dataset.id); el.animate([{ transform: base }, { transform: `${base} translateY(-16px)` }, { transform: base }], { duration: 520, delay: (id % 12) * 45, easing: "ease-in-out" }); }); }, reduce ? 0 : 640);
    window.setTimeout(() => { setConfetti(false); setResult({ ...r, level: g.level, moves: g.moves, par: g.par }); save(); }, reduce ? 200 : 1900);
  };
  const tap = (b: number) => {
    const x = S.current; if (!x || !lay || x.game.done || result) return; const g = x.game;
    if (sel === null) { if (!g.bolts[b].length) return; setSel(b); setHintBolts([]); tone(520, 0.05, "square", 0.08); return; }
    if (sel === b) { setSel(null); tone(300, 0.04, "triangle", 0.07); return; }
    if (canMove(g, sel, b)) { doMove(sel, b); return; }
    sfx("bad"); setShake(b); window.setTimeout(() => setShake(null), 350);
    if (g.bolts[b].length) setSel(b); else setSel(null);   // a wrong target: pick that bolt up instead
  };
  const doUndo = () => { const x = S.current!, g = x.game; if (g.done || !g.history.length) return; const from = new Map<number, { x: number; y: number }>(), h = g.history[g.history.length - 1], L = lay!;
    for (let i = g.bolts[h.b].length - h.n; i < g.bolts[h.b].length; i++) from.set(g.bolts[h.b][i].id, nutXY(L, h.b, i)); const r = undoMove(g); if (!r) return; pend.current = { ids: r.ids, from, src: h.b, dst: h.a }; r.ids.forEach((id: number) => noTrans.current.add(id));
    setSel(null); setHintBolts([]); setMsg(null); setCapped(new Set(g.bolts.map((_: any, i: number) => (boltDone(g, i) ? i : -1)).filter((i: number) => i >= 0))); tone(260, 0.05, "triangle", 0.07); bump(); save(); };
  const doHint = () => {
    const x = S.current!, g = x.game; if (g.done) return; if (x.profile.hints < 1) { flash("No hints left. Clear levels to earn more.", "warn"); return; }
    const h = getHint(g); if (!h) { flash("No way forward from here. Try Undo or add a bolt.", "warn", 4000); return; }
    x.profile.hints--; setSel(null); setHintBolts([h.from, h.to]); sfx("reveal"); flash(`Hint: move from bolt ${h.from + 1} to bolt ${h.to + 1}.`); bump(); save();
  };
  const doAddBolt = () => {
    const x = S.current!, g = x.game; if (g.done) return; if (g.extra >= MAX_EXTRA) { flash(`You can add ${MAX_EXTRA} extra bolts per level.`, "warn"); return; } if (x.profile.bolts < 1) { flash("No extra bolts left. Clear levels to earn more.", "warn"); return; }
    if (addBolt(g)) { x.profile.bolts--; setSel(null); sfx("good"); setMsg(null); bump(); save(); }
  };
  const open = (level: number, fresh = false) => { const x = S.current!; if (!fresh && x.game.level === level && !x.game.done) { setPicker(false); return; } x.game = newGame(level); resetUi(); setPicker(false); bump(); save(); };
  const resetUi = () => { setSel(null); setResult(null); setMsg(null); setHintBolts([]); setCapped(new Set()); setConfetti(false); pend.current = null; };
  const restart = () => { const x = S.current!; x.game = newGame(x.game.level); resetUi(); bump(); save(); };
  const next = () => { const x = S.current!; x.game = newGame(x.profile.level); resetUi(); bump(); save(); };
  const closeHelp = () => { setHelp(false); setHelpDone(true); save(); };

  if (!s || !st || !lay) return <div className="nt-root"><div className="nt-loading">LOADING…</div></div>;
  const sp = specFor(st.level), canBolt = st.extra < MAX_EXTRA && s.profile.bolts > 0, run = selRun(st, sel), lift = sel !== null ? liftFor(lay, st.cap, st.bolts[sel].length, run) : 0;
  const nuts: any[] = []; st.bolts.forEach((bolt: any[], b: number) => bolt.forEach((n, i) => nuts.push({ n, b, i })));
  const u = lay.u, w = lay.w;

  return (
    <div className={`nt-root ${prefs.calm ? "nt-calm" : ""}`}>
      <header className="nt-top">
        <Link href="/arcade" className="nt-btn round" aria-label="Back to the arcade">←</Link>
        <button className="nt-level" onClick={() => setPicker(true)} aria-label={`Level ${st.level}. Pick a level`}><small>LEVEL</small><b>{st.level}</b></button>
        <div className="nt-stat" aria-label={`${totalStars(s.profile)} stars`}><small>STARS</small><b>★ {totalStars(s.profile)}</b></div>
        <div className="nt-stat dim"><small>MOVES</small><b>{st.moves}</b></div>
        <button className="nt-btn round" onClick={restart} aria-label="Restart this level">⟳</button>
        <button className="nt-btn round" onClick={() => setPanel((v) => !v)} aria-label="Settings" aria-expanded={panel}>⚙</button>
      </header>
      {panel && (
        <div className="nt-panel" role="dialog" aria-label="Settings">
          <label><input type="checkbox" checked={s.settings.symbols} onChange={() => { s.settings.symbols = !s.settings.symbols; bump(); save(); }} /> Show a symbol on each colour (for colour blindness)</label>
          <div className="nt-panel-row"><PrefsButtons /><button className="nt-btn" onClick={() => setHelp(true)}>HOW TO PLAY</button><button className="nt-btn" onClick={() => setPanel(false)}>DONE</button></div>
        </div>
      )}

      <div ref={stageRef} className={`nt-stage ${st.won ? "won" : ""}`}>
        {/* bolts: plate, rod, finished cap */}
        {st.bolts.map((_: any, b: number) => (
          <div key={`r${b}`} className={`nt-bolt ${sel === b ? "sel" : ""} ${hintBolts.includes(b) ? "hint" : ""} ${shake === b ? "shake" : ""}`} style={{ left: lay.cx[b], top: lay.Yb[b] }}>
            <img className="nt-plate" src={plateUrl()} alt="" draggable={false} style={{ width: PLATE_W * w, left: -PLATE_W * w / 2, top: -22 * u }} />
            <div className="nt-rod" style={{ width: 40 * u, left: -20 * u, height: (st.cap * NUT_SIDE + 46) * u, bottom: 0, backgroundImage: `url(${rodUrl()})`, backgroundSize: `100% ${24 * u}px` }} />
            {capped.has(b) && boltDone(st, b) && <img className="nt-cap" src={capUrl()} alt="" draggable={false} style={{ width: 64 * u, left: -32 * u, top: -(st.cap * NUT_SIDE + 46) * u - 30 * u }} />}
          </div>
        ))}
        {/* nuts: one flat list so a nut keeps its element while it travels from bolt to bolt */}
        {nuts.map(({ n, b, i }) => {
          const lifted = sel === b && i >= st.bolts[b].length - run, p = nutXY(lay, b, i, lifted ? lift : 0), hidden = n.q;
          return <img key={n.id} data-id={n.id} ref={(el) => { if (el) els.current.set(n.id, el); else els.current.delete(n.id); }} className={`nt-nut ${lifted ? "lifted" : ""}`} src={nutUrl(n.c, hidden, s.settings.symbols)} alt="" draggable={false}
            style={{ width: w, transform: `translate3d(${p.x}px, ${p.y}px, 0)`, zIndex: lay.row[b] * 100 + i + (lifted ? 50 : 0), transition: noTrans.current.has(n.id) ? "none" : undefined }} />;
        })}
        {/* big invisible tap targets, one per bolt (also the keyboard / screen reader way in) */}
        {st.bolts.map((bolt: any[], b: number) => {
          const top = bolt[bolt.length - 1], h = (st.cap * NUT_SIDE + 160) * u;
          return <button key={`t${b}`} className="nt-hit" style={{ left: lay.cx[b] - (w * (PLATE_W + 0.1)) / 2, top: lay.Yb[b] - h + 36 * u, width: w * (PLATE_W + 0.1), height: h }} onClick={() => tap(b)}
            aria-pressed={sel === b} aria-label={`Bolt ${b + 1}, ${bolt.length} of ${st.cap} nuts${top ? `, top nut ${top.q ? "hidden" : NAMES[top.c % NAMES.length]}` : ", empty"}${boltDone(st, b) ? ", finished" : ""}`} />;
        })}
        {msg && <div className={`nt-msg ${msg.kind}`} role="status">{msg.text}</div>}
        {confetti && <div className="nt-confetti" aria-hidden>{Array.from({ length: 30 }, (_, i) => <i key={i} style={{ ["--x" as any]: `${(i * 37) % 100}%`, ["--d" as any]: `${(i % 8) * 80}ms`, ["--r" as any]: `${(i * 53) % 360}deg`, background: ["#e5322d", "#f6c21a", "#2f6df0", "#1f9d55", "#f48fb8", "#8b3fd0"][i % 6] }} />)}</div>}
      </div>

      <footer className="nt-bar">
        <button className="nt-hex" onClick={doUndo} disabled={st.done || !st.history.length} aria-label="Undo the last move"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><path d="M9 7H4v5M4 7l3.5-3.5A8 8 0 1 1 5 14" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg><span>UNDO</span></button>
        <button className="nt-hex" onClick={doHint} disabled={st.done} aria-label={`Hint, ${s.profile.hints} left`}><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z M9.5 19h5 M10.5 21.5h3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg><span>HINT</span><i>{s.profile.hints}</i></button>
        <button className={`nt-hex ${canBolt ? "" : "dim"}`} onClick={doAddBolt} disabled={st.done} aria-label={`Add a bolt, ${s.profile.bolts} left`}><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><path d="M12 5v14M5 12h14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg><span>BOLT</span><i>{s.profile.bolts}</i></button>
      </footer>

      {help && (
        <div className="nt-modal" role="dialog" aria-label="How to play" onClick={closeHelp}>
          <div className="nt-card" onClick={(e) => e.stopPropagation()}>
            <h2>{GAME_NAME.toUpperCase()}</h2>
            <div className="nt-how">
              <p><b>1.</b> Tap a bolt to lift its top nuts.</p>
              <p><b>2.</b> Tap another bolt to drop them there. They fit on an <b>empty bolt</b> or on a nut of the <b>same colour</b>.</p>
              <p><b>3.</b> Fill each bolt with one colour. Dark <b>?</b> nuts show their colour once they reach the top.</p>
              <p className="mute">Stuck? Undo is free. A hint shows the next move, and an extra bolt gives you more room.</p>
            </div>
            <button className="nt-btn go big" onClick={closeHelp}>LET&apos;S SORT ▶</button>
          </div>
        </div>
      )}
      {picker && (
        <div className="nt-modal" role="dialog" aria-label="Pick a level" onClick={() => setPicker(false)}>
          <div className="nt-card wide" onClick={(e) => e.stopPropagation()}>
            <h2>LEVELS</h2>
            <div className="nt-grid">{Array.from({ length: Math.min(LEVEL_COUNT_HINT, Math.max(30, s.profile.level + 9)) }, (_, i) => { const l = i + 1, locked = l > s.profile.level, stars = s.profile.stars[l] || 0; return <button key={l} className={`nt-lv ${locked ? "locked" : ""} ${l === st.level ? "here" : ""}`} disabled={locked} onClick={() => open(l, true)} aria-label={`Level ${l}${locked ? ", locked" : `, ${stars} of 3 stars`}`}><b>{l}</b><small>{locked ? "🔒" : "★".repeat(stars) + "☆".repeat(3 - stars)}</small></button>; })}</div>
            <button className="nt-btn" onClick={() => setPicker(false)}>CLOSE</button>
          </div>
        </div>
      )}
      {result && (
        <div className="nt-modal" role="dialog" aria-label="Level complete">
          <div className="nt-card">
            <h2>LEVEL {result.level} CLEAR!</h2>
            <div className="nt-stars" aria-label={`${result.stars} of 3 stars`}>{[1, 2, 3].map((k) => <span key={k} className={k <= result.stars ? "on" : ""} style={{ animationDelay: `${k * 180}ms` }}>★</span>)}</div>
            <ul className="nt-sum"><li><span>Moves</span><b>{result.moves}</b></li><li><span>Par</span><b>{result.par}</b></li><li><span>Colours</span><b>{sp.colors}</b></li></ul>
            {(result.reward.hint > 0 || result.reward.bolt > 0) && <div className="nt-chips">{result.reward.hint > 0 && <span>+1 hint</span>}{result.reward.bolt > 0 && <span>+1 bolt</span>}</div>}
            <div className="nt-row"><button className="nt-btn" onClick={() => open(result.level, true)}>REPLAY</button><button className="nt-btn go big" onClick={next}>NEXT LEVEL ▶</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
