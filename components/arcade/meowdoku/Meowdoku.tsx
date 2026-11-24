"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any, react-hooks/refs */
// MEOWDOKU: put one cat in every row, every column and every colour, and never let two cats touch (corners count).
// Rules and puzzles live in arcade-server/meowdoku (pure ESM, tested). This file draws the board and the feel. Saves live in this browser (localStorage).
//   Tap = one kind of mark, double-tap = the other (which is which depends on the TAP switch). Gestures are explicit, so a double-tap always gives the same result.
import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { newGame, toggleX, toggleCat, setMark, undo as undoMove, retract, clearBoard, cats, conflictCells, blocked, smartHint, wink, newProfile, completeLevel, MAX_FISH, regionName } from "../../../arcade-server/meowdoku/index.mjs";
import { PrefsProvider, PrefsButtons, usePrefs, sfx, tone } from "../prefs";
import { catUrl, fishUrl, makeLogo } from "./sprites";
import "./meowdoku.css";

export const GAME_NAME = "Meowdoku";
const KEY = "meowdoku:v1", OLD_KEY = "catgrid:v1", LOGO = "/arcade/meowdoku-logo.png";
const COLORS = ["#9ed36a", "#e8706f", "#f6b3d2", "#ffab5e", "#9b7fdc", "#ecc84a", "#8fb4e0", "#5fcab8", "#c9a27a"];
const SHAPES = ["●", "▲", "■", "◆", "★", "♥", "✚", "⬟", "▼"];
const DOUBLE_MS = 380;
type Settings = { auto: boolean; shapes: boolean; mode: "x" | "cat" };
type Saved = { profile: any; game: any; secs: number; settings: Settings };

export default function Meowdoku() { return <PrefsProvider><Inner /></PrefsProvider>; }

function load(): Saved {
  for (const key of [KEY, OLD_KEY]) {
    try {
      const j = JSON.parse(localStorage.getItem(key) || "null");
      if (j?.profile?.v === 1) {
        const g = j.game?.v === 1 && j.game.level === j.profile.level && !j.game.done ? j.game : null;
        return { profile: j.profile, game: g ?? newGame(j.profile.level), secs: g ? j.secs || 0 : 0, settings: { auto: !!j.settings?.auto, shapes: !!j.settings?.shapes, mode: j.settings?.mode === "cat" ? "cat" : "x" } };
      }
    } catch { /* blocked or corrupt: try the next key */ }
  }
  const profile = newProfile(); return { profile, game: newGame(profile.level), secs: 0, settings: { auto: false, shapes: false, mode: "x" } };
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
  const S = useRef<Saved | null>(null), last = useRef<{ key: string; t: number } | null>(null), nid = useRef(0);
  const { prefs } = usePrefs();
  const [, bump] = useReducer((x: number) => x + 1, 0);
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
    const x = S.current; if (!x || x.game.level > 3 || x.game.moves || x.game.done) return;
    const h: any = smartHint(x.game); if (h.kind !== "cat" && h.kind !== "cross") return; const st = x.game;
    const apply = () => { if (h.kind === "cat") setMark(st, h.cell[0], h.cell[1], 2); else for (const [r, c] of h.cells) if (st.marks[r][c] === 0) st.marks[r][c] = 1; setSay(null); bump(); save(); };
    setSay({ text: `Start here! ${h.text}`, kind: h.kind, cells: h.cell ? [h.cell] : h.cells, apply });
  }, [save]);

  useEffect(() => {
    S.current = load(); setHelp(!S.current.profile.seenHelp); setTools(new URLSearchParams(location.search).has("logo") ? makeLogo(8) : null); bump(); coach();
  }, [coach]);
  useEffect(() => { const sv = window.setInterval(save, 4000); window.addEventListener("pagehide", save); return () => { clearInterval(sv); window.removeEventListener("pagehide", save); save(); }; }, [save]);

  const s = S.current;
  const burst = (r: number, c: number) => { const id = ++nid.current, k = `${r},${c}`; setPuffs((p) => [...p, { id, k }]); window.setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== id)), 520); };
  const finishWin = (st: any) => {
    const x = S.current!, r = completeLevel(x.profile, st, x.secs); flashMood("happy", 5000); sfx("win"); setConfetti(true);
    window.setTimeout(() => { setConfetti(false); setResult({ won: true, points: r.points, reward: r.reward, secs: x.secs, fish: st.fish, helps: st.helps, n: st.n }); }, 1300);
  };
  const afterMove = (st: any, r: number, c: number, res: any) => {
    setSay(null);
    if (res.conflict) { sfx("bad"); navigator.vibrate?.(40); flashMood("oops"); setShake(`${r},${c}`); window.setTimeout(() => setShake(null), 380); setFishHit(st.fish); window.setTimeout(() => setFishHit(null), 700); }
    if (res.mark === 2) { burst(r, c); if (!res.conflict) tone(520 + cats(st).length * 40, 0.09, "triangle", 0.12); }
    else if (res.mark === 1) tone(300, 0.04, "square", 0.07); else if (res.changed) tone(220, 0.05, "triangle", 0.07);
    if (st.won) finishWin(st); else if (st.lost) { sfx("bad"); window.setTimeout(() => setResult({ lost: true }), 600); }
    bump(); save();
  };
  /** One tap on a cell. Two quick taps on the same cell = the OTHER mark: the first tap is cancelled (fish refunded), then the other mark is applied. */
  const onCell = (r: number, c: number, at: number) => {
    const x = S.current; if (!x || x.game.done) return; const st = x.game, key = `${r},${c}`, catMode = x.settings.mode === "cat"; setFocus([r, c]);
    const p = last.current, dbl = !!p && p.key === key && at - p.t < DOUBLE_MS;
    if (dbl) { retract(st); last.current = null; const res = catMode ? toggleX(st, r, c) : toggleCat(st, r, c); afterMove(st, r, c, { ...res, changed: true }); return; }
    const res = catMode ? toggleCat(st, r, c) : toggleX(st, r, c); last.current = res.changed ? { key, t: at } : null; if (res.changed) afterMove(st, r, c, res);
  };
  const useHint = () => {
    const x = S.current!, st = x.game; if (st.done) return; if (x.profile.hints < 1) { setSay({ text: "No hints left. Finish levels to earn more.", kind: "none", cells: [] }); return; }
    const h: any = smartHint(st); if (h.kind === "done") { setSay({ text: h.text, kind: "none", cells: [] }); return; }
    x.profile.hints--; st.helps++; sfx("reveal");
    const apply = () => {
      if (h.kind === "cat" || h.kind === "nudge") setMark(st, h.cell[0], h.cell[1], 2); else if (h.kind === "cross") { for (const [r, c] of h.cells) if (st.marks[r][c] === 0) st.marks[r][c] = 1; } else if (h.kind === "badx") for (const [r, c] of h.cells) st.marks[r][c] = 0;
      setSay(null); if (h.cell) burst(h.cell[0], h.cell[1]); if (st.won) finishWin(st); bump(); save();
    };
    setSay({ text: h.text, kind: h.kind, cells: h.cell ? [h.cell] : h.cells, apply: h.kind === "conflict" ? undefined : apply }); bump(); save();
  };
  const useHelper = () => {
    const x = S.current!, st = x.game; if (st.done) return; if (x.profile.winks < 1) { setSay({ text: "No Cat Helpers left. Finish levels to earn more.", kind: "none", cells: [] }); return; }
    x.profile.winks--; const w = wink(st); if (!w) return; sfx("good"); if (w.placed) burst(w.cell[0], w.cell[1]);
    setSay({ text: w.placed ? "The Cat Helper put a cat in the right spot." : "The Cat Helper took away a cat that did not belong.", kind: "none", cells: [w.cell] }); if (st.won) finishWin(st); bump(); save();
  };
  const doUndo = () => { const st = S.current!.game; if (undoMove(st)) { setSay(null); last.current = null; tone(260, 0.05, "triangle", 0.07); bump(); save(); } };
  const doClear = () => { const st = S.current!.game; clearBoard(st); setSay(null); last.current = null; bump(); save(); };
  const fresh = (level: number) => { const x = S.current!; x.game = newGame(level); x.secs = 0; last.current = null; setResult(null); setSay(null); setMood("normal"); setFocus([0, 0]); setRound((v) => v + 1); bump(); save(); window.setTimeout(coach, 0); };
  const next = () => fresh(S.current!.profile.level), retry = () => fresh(S.current!.game.level);
  const setting = (k: "auto" | "shapes") => { const x = S.current!; x.settings[k] = !x.settings[k]; bump(); save(); };
  const setMode = (m: "x" | "cat") => { S.current!.settings.mode = m; last.current = null; bump(); save(); };
  const closeHelp = () => { S.current!.profile.seenHelp = true; setHelp(false); save(); };

  // keyboard: arrows move, Space/Enter taps, X and C set a mark, Backspace clears the cell
  const onKey = (e: React.KeyboardEvent) => {
    const x = S.current; if (!x || x.game.done) return; const st = x.game, n = st.n; let [r, c] = focus;
    if (e.key === "ArrowUp") r = (r + n - 1) % n; else if (e.key === "ArrowDown") r = (r + 1) % n; else if (e.key === "ArrowLeft") c = (c + n - 1) % n; else if (e.key === "ArrowRight") c = (c + 1) % n;
    else if (e.key === " " || e.key === "Enter") { e.preventDefault(); onCell(r, c, -1e9); return; }
    else if (e.key.toLowerCase() === "x") { e.preventDefault(); const res = toggleX(st, r, c); if (res.changed) afterMove(st, r, c, res); return; }
    else if (e.key.toLowerCase() === "c") { e.preventDefault(); const res = toggleCat(st, r, c); if (res.changed) afterMove(st, r, c, res); return; }
    else if (e.key === "Backspace") { e.preventDefault(); if (st.marks[r][c]) { const res = toggleX(st, r, c); if (res.mark === 1) toggleX(st, r, c); afterMove(st, r, c, { ...res, mark: 0, changed: true }); } return; } else return;
    e.preventDefault(); setFocus([r, c]); requestAnimationFrame(() => document.getElementById(`cg-${r}-${c}`)?.focus());
  };

  if (!s) return <div className="cg-root"><div className="cg-loading">LOADING…</div></div>;
  const st = s.game, n = st.n, bad = conflictCells(st), placed = cats(st).length, block = s.settings.auto ? blocked(st) : null, catMode = s.settings.mode === "cat";
  const hl = new Set((say?.cells ?? []).map(([r, c]) => `${r},${c}`)), puffAt = new Set(puffs.map((p) => p.k));
  const edge = (r: number, c: number, dr: number, dc: number) => { const rr = r + dr, cc = c + dc; return rr < 0 || cc < 0 || rr >= n || cc >= n || st.regions[rr][cc] !== st.regions[r][c] ? "var(--thick)" : "var(--thin)"; };
  let ci = 0;

  return (
    <div className={`cg-root ${prefs.calm ? "cg-calm" : ""}`}>
      <header className="cg-top">
        <Link href="/arcade" className="cg-btn round" aria-label="Back to arcade">←</Link>
        <button className="cg-logo" onClick={() => setHelp(true)} aria-label="How to play Meowdoku"><img src={LOGO} alt="" draggable={false} /></button>
        <div className="cg-stat"><small>LEVEL</small><b>{st.level}</b></div>
        <div className="cg-stat"><small>SCORE</small><b>{s.profile.score.toLocaleString("en-US")}</b></div>
        <div className="cg-stat dim"><small>TIME</small><Clock s={S} /></div>
        <button className="cg-btn round" onClick={() => setHelp(true)} aria-label="How to play">?</button>
        <button className="cg-btn round" onClick={() => setPanel((v) => !v)} aria-label="Settings" aria-expanded={panel}>⚙</button>
      </header>
      {panel && (
        <div className="cg-panel" role="dialog" aria-label="Settings">
          <label><input type="checkbox" checked={s.settings.auto} onChange={() => setting("auto")} /> Show spots that are already ruled out (dots)</label>
          <label><input type="checkbox" checked={s.settings.shapes} onChange={() => setting("shapes")} /> Show a shape on each colour (for colour blindness)</label>
          <div className="cg-panel-row"><PrefsButtons /><button className="cg-btn" onClick={() => setPanel(false)}>DONE</button></div>
        </div>
      )}

      <main className="cg-main">
        <section className="cg-side">
          <div className="cg-fish" aria-label={`${st.fish} of ${MAX_FISH} fish left`}>{Array.from({ length: MAX_FISH }, (_, i) => <img key={`${i}:${i >= st.fish}`} src={fishUrl(i >= st.fish)} alt="" className={`${i >= st.fish ? "lost" : ""} ${fishHit === i ? "hit" : ""}`} draggable={false} />)}</div>
          <ul className="cg-rules" aria-label="Rules">
            <li><span><b>1 cat</b> in every row and column</span></li>
            <li><span><b>1 cat</b> in every colour</span></li>
            <li><span>Cats <b>can&apos;t touch</b>, even corners</span></li>
          </ul>
          <div className="cg-slots" aria-label={`${placed} of ${n} cats placed`}>{Array.from({ length: n }, (_, i) => <span key={i} className={i < placed ? "on" : ""}>{i < placed && <img src={catUrl("normal")} alt="" draggable={false} />}</span>)}</div>
          <div className="cg-mode" role="group" aria-label="What a single tap does">
            <span>TAP =</span>
            <button className={!catMode ? "on" : ""} aria-pressed={!catMode} onClick={() => setMode("x")}>✖ X</button>
            <button className={catMode ? "on" : ""} aria-pressed={catMode} onClick={() => setMode("cat")}><img src={catUrl("normal")} alt="" draggable={false} /> CAT</button>
            <small>Double-tap = {catMode ? "✖ X" : "CAT"}</small>
          </div>
          <div className="cg-say" role="status" aria-live="polite">
            {say ? (<><p>{say.text}</p>{say.apply && <button className="cg-btn go" onClick={say.apply}>{say.kind === "cat" || say.kind === "nudge" ? "PUT THE CAT" : say.kind === "badx" ? "REMOVE X" : "CROSS THEM OUT"}</button>}</>) : <p className="mute">{catMode ? "Tap puts a cat. Double-tap marks an X." : "Tap marks an X. Double-tap puts a cat."}</p>}
          </div>
          <div className="cg-powers">
            <button className="cg-pw" onClick={useHelper} disabled={st.done} aria-label={`Cat Helper, ${s.profile.winks} left`}><img src={catUrl(mood === "oops" ? "oops" : "happy")} alt="" draggable={false} /><span>HELPER</span><i>{s.profile.winks}</i></button>
            <button className="cg-pw" onClick={useHint} disabled={st.done} aria-label={`Hint, ${s.profile.hints} left`}><span className="ic">💡</span><span>HINT</span><i>{s.profile.hints}</i></button>
            <button className="cg-pw" onClick={doUndo} disabled={st.done || !st.history.length} aria-label="Undo"><span className="ic">↩</span><span>UNDO</span></button>
            <button className="cg-pw" onClick={doClear} disabled={st.done || !st.history.length} aria-label="Clear the board"><span className="ic">🧹</span><span>CLEAR</span></button>
          </div>
        </section>

        <section className="cg-stage">
          <div className={`cg-board ${st.won ? "won" : ""}`} key={`${st.level}:${round}`} role="grid" aria-label={`${n} by ${n} cat grid`} style={{ ["--n" as any]: n }} onKeyDown={onKey}>
            {st.regions.map((row: number[], r: number) => row.map((g: number, c: number) => {
              const m = st.marks[r][c], isBad = bad.has(`${r},${c}`), key = `${r},${c}`, firstOfRegion = s.settings.shapes && st.regions.flat().indexOf(g) === r * n + c, catIndex = m === 2 ? ci++ : 0;
              return (
                <button key={key} id={`cg-${r}-${c}`} role="gridcell" tabIndex={focus[0] === r && focus[1] === c ? 0 : -1} className={`cg-cell ${m === 2 ? "cat" : ""} ${isBad ? "bad" : ""} ${shake === key ? "shake" : ""} ${hl.has(key) ? "hint" : ""}`}
                  style={{ background: COLORS[g], borderTopWidth: edge(r, c, -1, 0), borderBottomWidth: edge(r, c, 1, 0), borderLeftWidth: edge(r, c, 0, -1), borderRightWidth: edge(r, c, 0, 1), ["--d" as any]: `${(r + c) * 32}ms`, ["--i" as any]: catIndex }}
                  onPointerDown={(e) => { e.preventDefault(); onCell(r, c, e.timeStamp); }} onFocus={() => setFocus([r, c])}
                  aria-label={`Row ${r + 1}, column ${c + 1}, ${regionName(g)} area, ${m === 2 ? "cat" : m === 1 ? "marked X" : "empty"}`}>
                  {firstOfRegion && <i className="shape" aria-hidden>{SHAPES[g]}</i>}
                  {m === 1 && <span className="x" aria-hidden />}
                  {m === 0 && block?.[r][c] && <span className="dot" aria-hidden />}
                  {m === 2 && <img src={catUrl(isBad ? "oops" : st.won ? "happy" : "normal")} alt="" draggable={false} />}
                  {puffAt.has(key) && <span className="puff" aria-hidden>{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ ["--a" as any]: `${i * 51}deg` }} />)}</span>}
                </button>
              );
            }))}
          </div>
        </section>
      </main>

      {confetti && <div className="cg-confetti" aria-hidden>{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ ["--x" as any]: `${(i * 37) % 100}%`, ["--d" as any]: `${(i % 7) * 90}ms`, ["--c" as any]: COLORS[i % COLORS.length], ["--r" as any]: `${(i * 53) % 360}deg` }} />)}</div>}

      {help && (
        <div className="cg-modal" role="dialog" aria-label="How to play" onClick={closeHelp}>
          <div className="cg-card wide" onClick={(e) => e.stopPropagation()}>
            <img className="cg-logo-big" src={LOGO} alt="" draggable={false} />
            <h2>{GAME_NAME.toUpperCase()}</h2>
            <p>Put <b>one cat</b> in every row, every column and every colour. Cats can&apos;t touch, not even at the corners.</p>
            <div className="cg-minis"><Mini cells={MINI_ROWS} label="A cat takes its whole row and column" /><Mini cells={MINI_COLOURS} label="One cat in every colour" /><Mini cells={MINI_TOUCH} label="Cats can't touch, even corners" /></div>
            <p className="mute">Tap marks an X (a note), double-tap puts a cat. Prefer cats on a single tap? Flip the TAP switch under the board. Stuck? The hint explains why.</p>
            <button className="cg-btn go big" onClick={closeHelp}>LET&apos;S PLAY ▶</button>
          </div>
        </div>
      )}
      {result && (
        <div className="cg-modal" role="dialog" aria-label={result.won ? "Level complete" : "Out of fish"}>
          <div className="cg-card">
            <img className="cg-hero" src={catUrl(result.won ? "happy" : "oops")} alt="" draggable={false} />
            {result.won ? (<>
              <h2>LEVEL {st.level} DONE!</h2>
              <ul className="cg-sum"><li><span>Board</span><b>{result.n}×{result.n}</b></li><li><span>Time</span><b>{mmss(result.secs)}</b></li><li><span>Fish left</span><b>{result.fish}</b></li>{result.helps > 0 && <li><span>Helps used</span><b>{result.helps}</b></li>}<li className="tot"><span>Points</span><b>+{result.points}</b></li></ul>
              <p className="mute">Reward: +{result.reward.hint} hint{result.reward.wink ? `, +${result.reward.wink} Cat Helper` : ""}</p>
              <button className="cg-btn go big" onClick={next}>NEXT LEVEL ▶</button>
            </>) : (<>
              <h2>OUT OF FISH</h2><p>Cats that break a rule cost a fish. Try this level again, or use a hint.</p>
              <button className="cg-btn go big" onClick={retry}>TRY AGAIN</button>
            </>)}
          </div>
        </div>
      )}
      {tools && <div className="cg-tools"><a className="cg-btn" href={tools} download="meowdoku-logo.png">download logo</a></div>}
    </div>
  );
}
