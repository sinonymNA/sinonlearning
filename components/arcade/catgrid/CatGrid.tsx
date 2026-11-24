"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any, react-hooks/refs */
// CAT GRID: put one cat in every row, every column and every colour, and never let two cats touch (corners count).
// Rules and puzzles live in arcade-server/catgrid (pure ESM, tested). This file draws the board and adds the feel. Saves live in this browser (localStorage).
import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { newGame, tap as tapCell, setMark, undo as undoMove, clearBoard, cats, conflictCells, blocked, smartHint, wink, newProfile, completeLevel, MAX_FISH, regionName } from "../../../arcade-server/catgrid/index.mjs";
import { PrefsProvider, PrefsButtons, sfx, tone } from "../prefs";
import { catUrl, fishUrl } from "./sprites";
import "./catgrid.css";

const KEY = "catgrid:v1";
const COLORS = ["#9ed36a", "#e8706f", "#f6b3d2", "#ffab5e", "#9b7fdc", "#ecc84a", "#8fb4e0", "#5fcab8", "#c9a27a"];
const SHAPES = ["●", "▲", "■", "◆", "★", "♥", "✚", "⬟", "▼"];
type Settings = { auto: boolean; shapes: boolean };

export default function CatGrid() { return <PrefsProvider><Inner /></PrefsProvider>; }

function load(): { profile: any; game: any; secs: number; settings: Settings } {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "null");
    if (j?.profile?.v === 1) { const g = j.game?.v === 1 && j.game.level === j.profile.level && !j.game.done ? j.game : null; return { profile: j.profile, game: g ?? newGame(j.profile.level), secs: g ? j.secs || 0 : 0, settings: { auto: !!j.settings?.auto, shapes: !!j.settings?.shapes } }; }
  } catch { /* blocked or corrupt: start fresh */ }
  const profile = newProfile(); return { profile, game: newGame(profile.level), secs: 0, settings: { auto: false, shapes: false } };
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function Inner() {
  const S = useRef<{ profile: any; game: any; secs: number; settings: Settings } | null>(null);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [say, setSay] = useState<{ text: string; kind: string; cells: number[][]; apply?: () => void } | null>(null);
  const [mood, setMood] = useState<"normal" | "oops" | "happy">("normal");
  const [shake, setShake] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [panel, setPanel] = useState(false);
  const [focus, setFocus] = useState<[number, number]>([0, 0]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(() => { try { const s = S.current; if (s) localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ } }, []);
  useEffect(() => { S.current = load(); bump(); }, []);
  useEffect(() => {   // time on the level counts only while a game is on screen and unfinished
    const id = window.setInterval(() => { const s = S.current; if (!s || s.game.done || document.hidden || !s.game.moves) return; s.secs += 1; bump(); }, 1000);
    const sv = window.setInterval(save, 4000); window.addEventListener("pagehide", save);
    return () => { clearInterval(id); clearInterval(sv); window.removeEventListener("pagehide", save); save(); };
  }, [save]);

  const s = S.current;
  const flashMood = (m: "oops" | "happy", ms = 1100) => { setMood(m); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setMood("normal"), ms); };

  const afterMove = (st: any, r: number, c: number, res: any) => {
    setSay(null);
    if (res.conflict) { sfx("bad"); flashMood("oops"); setShake(`${r},${c}`); window.setTimeout(() => setShake(null), 350); }
    else if (res.mark === 2) tone(560, 0.07, "square", 0.1); else if (res.mark === 1) tone(300, 0.04, "square", 0.07); else tone(220, 0.05, "triangle", 0.07);
    if (st.won) finishWin(st); else if (st.lost) { sfx("bad"); setResult({ lost: true }); }
    bump(); save();
  };
  const finishWin = (st: any) => {
    const p = S.current!.profile, secs = S.current!.secs, r = completeLevel(p, st, secs); flashMood("happy", 4000); sfx("win");
    setResult({ won: true, points: r.points, reward: r.reward, secs, fish: st.fish, helps: st.helps, n: st.n });
  };
  const onCell = (r: number, c: number) => {
    const st = S.current?.game; if (!st || st.done) return; setFocus([r, c]);
    const res = tapCell(st, r, c); if (res.changed) afterMove(st, r, c, res);
  };
  const useHint = () => {
    const x = S.current!, st = x.game; if (st.done) return; if (x.profile.hints < 1) { setSay({ text: "No hints left. Finish levels to earn more.", kind: "none", cells: [] }); return; }
    const h: any = smartHint(st); if (h.kind === "done") { setSay({ text: h.text, kind: "none", cells: [] }); return; }
    x.profile.hints--; st.helps++; sfx("reveal");
    const cells: number[][] = h.cell ? [h.cell] : h.cells;
    const apply = () => {
      if (h.kind === "cat" || h.kind === "nudge") setMark(st, h.cell[0], h.cell[1], 2);
      else if (h.kind === "cross") for (const [r, c] of h.cells) { if (st.marks[r][c] === 0) st.marks[r][c] = 1; }
      else if (h.kind === "badx") for (const [r, c] of h.cells) st.marks[r][c] = 0;
      setSay(null); if (st.won) finishWin(st); bump(); save();
    };
    setSay({ text: h.text, kind: h.kind, cells, apply: h.kind === "conflict" ? undefined : apply }); bump(); save();
  };
  const useHelper = () => {
    const x = S.current!, st = x.game; if (st.done) return; if (x.profile.winks < 1) { setSay({ text: "No Cat Helpers left. Finish levels to earn more.", kind: "none", cells: [] }); return; }
    x.profile.winks--; const w = wink(st); if (!w) return; sfx("good"); setSay({ text: w.placed ? "The Cat Helper put a cat in the right spot." : "The Cat Helper removed a cat that did not belong.", kind: "none", cells: [w.cell] });
    if (st.won) finishWin(st); bump(); save();
  };
  const doUndo = () => { const st = S.current!.game; if (undoMove(st)) { setSay(null); tone(260, 0.05, "triangle", 0.07); bump(); save(); } };
  const doClear = () => { const st = S.current!.game; clearBoard(st); setSay(null); bump(); save(); };
  const next = () => { const x = S.current!; x.game = newGame(x.profile.level); x.secs = 0; setResult(null); setSay(null); setMood("normal"); setFocus([0, 0]); bump(); save(); };
  const retry = () => { const x = S.current!; x.game = newGame(x.game.level); x.secs = 0; setResult(null); setSay(null); setMood("normal"); bump(); save(); };
  const setting = (k: keyof Settings) => { const x = S.current!; x.settings[k] = !x.settings[k]; bump(); save(); };

  // keyboard: arrows move, Space/Enter taps, X marks, C puts a cat, Backspace clears the cell
  const onKey = (e: React.KeyboardEvent) => {
    const st = S.current?.game; if (!st) return; let [r, c] = focus; const n = st.n;
    if (e.key === "ArrowUp") r = (r + n - 1) % n; else if (e.key === "ArrowDown") r = (r + 1) % n; else if (e.key === "ArrowLeft") c = (c + n - 1) % n; else if (e.key === "ArrowRight") c = (c + 1) % n;
    else if (e.key === " " || e.key === "Enter") { e.preventDefault(); onCell(r, c); return; }
    else if (e.key.toLowerCase() === "x" || e.key.toLowerCase() === "c" || e.key === "Backspace") {
      e.preventDefault(); const want = e.key === "Backspace" ? 0 : e.key.toLowerCase() === "x" ? 1 : 2;
      for (let i = 0; i < 3 && st.marks[r][c] !== want; i++) { const res = tapCell(st, r, c); if (res.changed && st.marks[r][c] === want) { afterMove(st, r, c, res); break; } if (res.lost) break; }
      return;
    } else return;
    e.preventDefault(); setFocus([r, c]); requestAnimationFrame(() => document.getElementById(`cg-${r}-${c}`)?.focus());
  };

  if (!s) return <div className="cg-root"><div className="cg-loading">LOADING…</div></div>;
  const st = s.game, n = st.n, bad = conflictCells(st), placed = cats(st).length, block = s.settings.auto ? blocked(st) : null;
  const hl = new Set((say?.cells ?? []).map(([r, c]) => `${r},${c}`));
  const edge = (r: number, c: number, dr: number, dc: number) => { const rr = r + dr, cc = c + dc; return rr < 0 || cc < 0 || rr >= n || cc >= n || st.regions[rr][cc] !== st.regions[r][c] ? "var(--thick)" : "var(--thin)"; };

  return (
    <div className="cg-root">
      <header className="cg-top">
        <Link href="/arcade" className="cg-btn round" aria-label="Back to arcade">←</Link>
        <div className="cg-stat"><small>LEVEL</small><b>{st.level}</b></div>
        <div className="cg-stat"><small>SCORE</small><b>{s.profile.score.toLocaleString("en-US")}</b></div>
        <div className="cg-stat dim"><small>TIME</small><b>{mmss(s.secs)}</b></div>
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
          <div className="cg-fish" aria-label={`${st.fish} of ${MAX_FISH} fish left`}>{Array.from({ length: MAX_FISH }, (_, i) => <img key={i} src={fishUrl(i >= st.fish)} alt="" className={i >= st.fish ? "lost" : ""} draggable={false} />)}</div>
          <ul className="cg-rules" aria-label="Rules">
            <li><span><b>1 cat</b> in every row and column</span></li>
            <li><span><b>1 cat</b> in every colour</span></li>
            <li><span>Cats <b>can&apos;t touch</b>, even corners</span></li>
          </ul>
          <div className="cg-slots" aria-label={`${placed} of ${n} cats placed`}>{Array.from({ length: n }, (_, i) => <span key={i} className={i < placed ? "on" : ""}>{i < placed && <img src={catUrl("normal")} alt="" draggable={false} />}</span>)}</div>
          <div className="cg-say" role="status" aria-live="polite">
            {say ? (<><p>{say.text}</p>{say.apply && <button className="cg-btn go" onClick={say.apply}>{say.kind === "cat" || say.kind === "nudge" ? "PUT THE CAT" : say.kind === "badx" ? "REMOVE X" : "CROSS THEM OUT"}</button>}</>) : <p className="mute">Tap once for an X, twice for a cat, three times to clear.</p>}
          </div>
          <div className="cg-powers">
            <button className="cg-pw" onClick={useHelper} disabled={st.done} aria-label={`Cat Helper, ${s.profile.winks} left`}><img src={catUrl(mood === "oops" ? "oops" : "happy")} alt="" draggable={false} /><span>HELPER</span><i>{s.profile.winks}</i></button>
            <button className="cg-pw" onClick={useHint} disabled={st.done} aria-label={`Hint, ${s.profile.hints} left`}><span className="ic">💡</span><span>HINT</span><i>{s.profile.hints}</i></button>
            <button className="cg-pw" onClick={doUndo} disabled={st.done || !st.history.length} aria-label="Undo"><span className="ic">↩</span><span>UNDO</span></button>
            <button className="cg-pw" onClick={doClear} disabled={st.done || !st.history.length} aria-label="Clear the board"><span className="ic">🧹</span><span>CLEAR</span></button>
          </div>
        </section>

        <section className="cg-stage">
          <div className="cg-board" role="grid" aria-label={`${n} by ${n} cat grid`} style={{ ["--n" as any]: n }} onKeyDown={onKey}>
            {st.regions.map((row: number[], r: number) => row.map((g: number, c: number) => {
              const m = st.marks[r][c], isBad = bad.has(`${r},${c}`), key = `${r},${c}`, firstOfRegion = s.settings.shapes && st.regions.flat().indexOf(g) === r * n + c;
              return (
                <button key={key} id={`cg-${r}-${c}`} role="gridcell" tabIndex={focus[0] === r && focus[1] === c ? 0 : -1} className={`cg-cell ${m === 2 ? "cat" : ""} ${isBad ? "bad" : ""} ${shake === key ? "shake" : ""} ${hl.has(key) ? "hint" : ""}`}
                  style={{ background: COLORS[g], borderTopWidth: edge(r, c, -1, 0), borderBottomWidth: edge(r, c, 1, 0), borderLeftWidth: edge(r, c, 0, -1), borderRightWidth: edge(r, c, 0, 1) }}
                  onPointerDown={(e) => { e.preventDefault(); onCell(r, c); }} onFocus={() => setFocus([r, c])}
                  aria-label={`Row ${r + 1}, column ${c + 1}, ${regionName(g)} area, ${m === 2 ? "cat" : m === 1 ? "marked X" : "empty"}`}>
                  {firstOfRegion && <i className="shape" aria-hidden>{SHAPES[g]}</i>}
                  {m === 1 && <span className="x" aria-hidden />}
                  {m === 0 && block?.[r][c] && <span className="dot" aria-hidden />}
                  {m === 2 && <img src={catUrl(isBad ? "oops" : "normal")} alt="" draggable={false} />}
                </button>
              );
            }))}
          </div>
        </section>
      </main>

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
    </div>
  );
}
