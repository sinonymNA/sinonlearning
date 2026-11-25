"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/refs */
// Back Issues: crates of old newspapers; solve every puzzle on each paper before the presses roll. The engine (arcade-server/issues) owns every rule; this file is the shell:
// home, crates, the paper with its puzzle tabs and clock, intro cards, the timeout and result cards. State is plain JSON in localStorage (backissues:v1).
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { PrefsProvider, PrefsButtons, usePrefs } from "../prefs";
import { CRATES, PER_CRATE, TYPE_NAMES, newIssue, newProfile, normalizeProfile, completeIssue, advance, relax, puzzleDone, totalStars, introFor, crateInfo, crateOf, posOf, UNLOCK } from "../../../arcade-server/issues/index.mjs";
import { Crossword, Sudoku, WordSearch, Cipher } from "./Puzzles";
import { play } from "./audio";
import "./issues.css";

const KEY = "backissues:v1";
const ICON: Record<string, string> = { crossword: "▦", sudoku: "⊞", wordsearch: "🔍", cipher: "🔐" };
const HOW: Record<string, string[]> = {
  crossword: ["Tap a square, then type the answer to its clue.", "Tap the same square again to switch between across and down.", "CHECK is free. A 💡 hint reveals a letter or a whole word."],
  sudoku: ["Fill the grid so every row, column and box has each number once.", "Tap a square, then a number. NOTES lets you pencil in maybes.", "Red squares break a rule. 💡 reveals one square."],
  wordsearch: ["Find every word on the list. Drag across it, or tap its first and last letters.", "Words can run backwards, and later papers hide diagonals too.", "💡 FIND ONE circles a word for you."],
  cipher: ["Every letter in this saying has been swapped for a different one.", "Tap a letter and type what you think it really is. A few are already revealed.", "Short words like A and I are good places to start. 💡 reveals one."],
};
type Saved = { profile: any; issue: any | null };
const mmss = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`;

function load(): Saved {
  try { const j = JSON.parse(localStorage.getItem(KEY) || "null"); if (j?.profile?.v === 1) { const issue = j.issue?.v === 1 && Array.isArray(j.issue.puzzles) && !j.issue.done ? j.issue : null; return { profile: normalizeProfile(j.profile), issue }; } } catch { /* corrupt or blocked */ }
  return { profile: newProfile(), issue: null };
}

export default function BackIssues() { return <PrefsProvider><Inner /></PrefsProvider>; }

function Inner() {
  const S = useRef<Saved | null>(null), { prefs } = usePrefs(), [, bump] = useReducer((x: number) => x + 1, 0);
  const [view, setView] = useState<"home" | "pick" | "play">("home"), [crate, setCrate] = useState(0), [tab, setTab] = useState(0);
  const [intro, setIntro] = useState<string | null>(null), [menu, setMenu] = useState(false), [result, setResult] = useState<any>(null), [fail, setFail] = useState(false), [msg, setMsg] = useState<string | null>(null), [stampTab, setStampTab] = useState<number | null>(null);
  const msgT = useRef<any>(null), warned = useRef(0), rewarded = useRef(false), last = useRef(0), saveAt = useRef(0), paused = useRef(true);
  const save = useCallback(() => { try { if (S.current) localStorage.setItem(KEY, JSON.stringify(S.current)); } catch { /* storage blocked */ } }, []);
  useEffect(() => { S.current = load(); setCrate(Math.min(crateOf(S.current.profile.level), 99)); bump(); }, []);
  useEffect(() => { const h = () => save(); window.addEventListener("pagehide", h); return () => { window.removeEventListener("pagehide", h); save(); }; }, [save]);
  const say = useCallback((t: string) => { setMsg(t); clearTimeout(msgT.current); msgT.current = setTimeout(() => setMsg(null), 2600); }, []);
  const s = S.current, st = s?.issue, open = !!(intro || menu || result || fail);
  paused.current = view !== "play" || open || !st;

  // the clock: real elapsed time, frozen while a card is open, the tab is hidden or we are not on a paper
  useEffect(() => {
    last.current = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now(), dt = Math.min(2, (now - last.current) / 1000); last.current = now; const cur = S.current?.issue;
      if (paused.current || document.hidden || !cur || cur.done || cur.failed) return;
      const out = advance(cur, dt); if (!cur.relaxed) { for (const mark of [30, 10]) if (cur.timeLeft <= mark && warned.current > mark) play("warn"); warned.current = cur.timeLeft; }
      if (out) { play("lose"); setFail(true); save(); } else if (now - saveAt.current > 2000) { saveAt.current = now; save(); }
      bump();
    }, 250);
    return () => clearInterval(id);
  }, [save]);

  const begin = (level: number, fresh = false) => {
    if (!S.current) return; const keep = S.current.issue; let iss = keep && keep.level === level && !keep.done && !fresh ? keep : null;
    if (!iss) iss = newIssue(level); S.current.issue = iss; rewarded.current = false; warned.current = iss.timeLeft; setResult(null); setFail(!!iss.failed); setTab(Math.max(0, iss.puzzles.findIndex((p: any) => !puzzleDone(p)))); setMenu(false); setStampTab(null);
    const t = introFor(level); if (t && !S.current.profile.seen[t]) setIntro(t); else if (level === 1 && !S.current.profile.seen.crossword) setIntro("crossword");
    setView("play"); play("bell"); save(); bump();
  };
  const closeIntro = () => { if (intro && S.current) { S.current.profile.seen[intro] = true; save(); } setIntro(null); last.current = performance.now(); };
  const finishIfWon = (iss: any) => {
    if (!iss.won || rewarded.current || !S.current) return; rewarded.current = true; const r = completeIssue(S.current.profile, iss); S.current.issue = null; save();
    window.setTimeout(() => { play("win"); setResult({ ...r, level: iss.level, timeLeft: iss.timeLeft, timeLimit: iss.timeLimit, hintsUsed: iss.hintsUsed, relaxed: iss.relaxed, masthead: iss.masthead, headline: iss.headline, date: iss.date }); }, 900);
  };
  const after = (r: any, snd?: string) => {
    const iss = S.current?.issue; if (!iss || !r) return;
    if (r.changed || r.found) { if (snd) play(snd as any); if (r.puzzleDone) { play("stamp"); setStampTab(tab); window.setTimeout(() => setStampTab(null), 1400); const nxt = iss.puzzles.findIndex((p: any) => !puzzleDone(p)); if (nxt >= 0) window.setTimeout(() => setTab(nxt), 900); } finishIfWon(iss); save(); bump(); } else if (snd === "bad") play("bad");
  };
  const spend = (fn: () => any) => { const p = S.current!.profile; if (p.hints < 1) { say("No hints left. Finish papers to earn more."); play("bad"); return; } const r = fn(); if (r?.changed) { p.hints--; after(r, "hint"); } };
  const retry = () => { if (st) begin(st.level, true); };
  const keepGoing = () => { if (!st) return; relax(st); setFail(false); last.current = performance.now(); save(); bump(); };
  const nextLevel = () => { if (S.current) begin(S.current.profile.level); };

  if (!s) return <div className="bi-root"><div className="bi-loading">DUSTING OFF THE CRATES…</div></div>;
  const prof = s.profile, cur = crateInfo(prof.level);
  const stage = (
    view === "home" ? <Home s={s} onPlay={() => begin(Math.min(prof.level, 9999))} onCrates={() => setView("pick")} />
    : view === "pick" ? <Crates s={s} crate={crate} setCrate={setCrate} onOpen={(l: number) => begin(l)} onBack={() => setView("home")} />
    : st ? (
      <div className="bi-paper">
        <header className="bi-top">
          <button className="bi-btn round" onClick={() => { save(); setView("pick"); }} aria-label="Back to crates">←</button>
          <div className="bi-mast"><b>{st.masthead}</b><small>{st.date} · No. {st.no}{st.boss ? " · SPECIAL EDITION" : ""}</small></div>
          <div className={`bi-clock ${st.relaxed ? "relaxed" : st.timeLeft <= 30 ? "hot" : ""}`} aria-label={st.relaxed ? "Timer off" : `${mmss(st.timeLeft)} left`}><b>{st.relaxed ? "∞" : mmss(st.timeLeft)}</b><i style={{ transform: `scaleX(${st.relaxed ? 1 : Math.max(0, st.timeLeft / st.timeLimit)})` }} /></div>
          <div className="bi-hints" title="Hints" aria-label={`${prof.hints} hints`}>💡<b>{prof.hints}</b></div>
          <button className="bi-btn round" onClick={() => setMenu(true)} aria-label="Menu">☰</button>
        </header>
        <div className="bi-tabs" role="tablist">{st.puzzles.map((p: any, i: number) => { const done = puzzleDone(p); return <button key={i} role="tab" aria-selected={i === tab} data-tab={i} className={`${i === tab ? "on" : ""} ${done ? "done" : ""}`} onClick={() => { setTab(i); play("tab"); }}><span>{ICON[p.type]}</span><b>{TYPE_NAMES[p.type as keyof typeof TYPE_NAMES]}</b>{done && <em>SOLVED</em>}{stampTab === i && <u className="bi-stamp">SOLVED</u>}</button>; })}</div>
        <div className="bi-area">
          {(() => { const p = st.puzzles[tab], P = { st, pi: tab, after, spend, off: open || st.done || st.failed, say }; return p.type === "crossword" ? <Crossword key={`${st.level}-${tab}`} {...P} /> : p.type === "sudoku" ? <Sudoku key={`${st.level}-${tab}`} {...P} /> : p.type === "wordsearch" ? <WordSearch key={`${st.level}-${tab}`} {...P} /> : <Cipher key={`${st.level}-${tab}`} {...P} />; })()}
        </div>
        {msg && <div className="bi-msg" role="status">{msg}</div>}
      </div>
    ) : <div className="bi-loading">…</div>
  );
  return (
    <div className={`bi-root v-${view} ${prefs.calm ? "bi-calm" : ""}`}>
      {stage}
      {intro && <Card className="intro" label="New puzzle"><small>NEW PUZZLE TYPE</small><h2>{TYPE_NAMES[intro as keyof typeof TYPE_NAMES]}</h2><ul>{HOW[intro].map((t, i) => <li key={i}>{t}</li>)}</ul><button className="bi-btn go big" onClick={closeIntro}>GOT IT</button></Card>}
      {menu && st && (
        <Card className="menu" label="Menu" onClose={() => setMenu(false)}>
          <h2>PAUSED</h2><p className="mute">The clock is stopped while this is open.</p>
          <div className="bi-row"><PrefsButtons /></div>
          <div className="bi-col">
            <button className="bi-btn" onClick={() => { setMenu(false); setIntro(st.puzzles[tab].type); }}>HOW TO PLAY THIS</button>
            {!st.relaxed && <button className="bi-btn" onClick={() => { relax(st); setMenu(false); save(); bump(); say("Timer off. This paper now earns one star."); }}>TURN THE TIMER OFF (1 STAR)</button>}
            <button className="bi-btn" onClick={() => { setMenu(false); retry(); }}>START THIS PAPER OVER</button>
            <button className="bi-btn" onClick={() => { setMenu(false); setView("pick"); save(); }}>BACK TO THE CRATES</button>
            <button className="bi-btn go" onClick={() => { setMenu(false); last.current = performance.now(); }}>KEEP PLAYING</button>
          </div>
        </Card>
      )}
      {fail && st && (
        <Card className="fail" label="Time is up">
          <div className="bi-extra">EXTRA! EXTRA!</div><h2>The presses have rolled</h2><p>Time ran out on {st.masthead}. You solved {st.puzzles.filter(puzzleDone).length} of {st.puzzles.length} puzzles.</p>
          <div className="bi-col"><button className="bi-btn go big" onClick={retry}>TRY AGAIN</button><button className="bi-btn" onClick={keepGoing}>KEEP GOING, NO TIMER (1 STAR)</button><button className="bi-btn" onClick={() => { setFail(false); setView("pick"); }}>BACK TO THE CRATES</button></div>
        </Card>
      )}
      {result && (
        <Card className="result" label="Paper finished">
          <div className="bi-extra">{result.boss ? "SPECIAL EDITION COMPLETE" : "ISSUE COMPLETE"}</div><h2>{result.masthead}</h2><p className="mute">{result.date}</p><p className="bi-big">“{result.headline}”</p>
          <div className="bi-stars" aria-label={`${result.stars} stars`}>{[1, 2, 3].map((i) => <span key={i} className={i <= result.stars ? "on" : ""} style={{ animationDelay: `${i * 0.18}s` }}>★</span>)}</div>
          <p>{result.relaxed ? "Finished with no timer." : `${mmss(result.timeLeft)} left on the clock.`} {result.hintsUsed ? `${result.hintsUsed} hint${result.hintsUsed === 1 ? "" : "s"} used.` : "No hints used."}</p>
          {result.reward.hints > 0 && <p className="bi-reward">+{result.reward.hints} 💡 hints for the first clear</p>}
          <div className="bi-col"><button className="bi-btn go big" onClick={nextLevel}>NEXT PAPER ▶</button><button className="bi-btn" onClick={() => { setResult(null); begin(result.level, true); }}>PLAY IT AGAIN</button><button className="bi-btn" onClick={() => { setResult(null); setCrate(crateOf(prof.level)); setView("pick"); }}>THE CRATES</button></div>
        </Card>
      )}
      <span className="bi-hide" aria-hidden>{cur.name}{crate}{totalStars(prof)}</span>
    </div>
  );
}

function Card({ className, label, children, onClose }: { className: string; label: string; children: React.ReactNode; onClose?: () => void }) {
  return <div className="bi-modal" role="dialog" aria-label={label} onClick={onClose}><div className={`bi-card ${className}`} onClick={(e) => e.stopPropagation()}>{children}</div></div>;
}

function Home({ s, onPlay, onCrates }: { s: Saved; onPlay: () => void; onCrates: () => void }) {
  const p = s.profile, c = crateInfo(p.level), resume = s.issue;
  return (
    <main className="bi-home" aria-label="Back Issues home">
      <Link className="bi-btn round bi-back" href="/arcade" aria-label="Back to arcade">←</Link>
      <div className="bi-attic" aria-hidden>{[0, 1, 2].map((i) => <div key={i} className={`crate c${i}`}><span>{["1921", "1947", "1969"][i]}</span></div>)}<div className="bi-lamp" /></div>
      <header className="bi-title"><small>THE ATTIC ARCHIVE PRESENTS</small><h1>BACK ISSUES</h1><p>Old newspapers. Every puzzle. Beat the presses.</p></header>
      <nav className="bi-menu" aria-label="Ways to play">
        <button className="bi-btn go big bi-play" onClick={onPlay}><span>{resume ? "CONTINUE" : p.level > 1 ? "NEXT PAPER" : "OPEN THE FIRST CRATE"}</span><small>{resume ? `${resume.masthead} · No. ${resume.no}` : `${c.name} · paper ${p.level}`}</small></button>
        <button className="bi-btn big" onClick={onCrates}>THE CRATES</button>
        <div className="bi-stats"><span><b>{totalStars(p)}</b><small>STARS</small></span><span><b>{p.solved}</b><small>SOLVED</small></span><span><b>{p.hints}</b><small>HINTS</small></span></div>
      </nav>
    </main>
  );
}

function Crates({ s, crate, setCrate, onOpen, onBack }: { s: Saved; crate: number; setCrate: (n: number) => void; onOpen: (l: number) => void; onBack: () => void }) {
  const p = s.profile, max = crateOf(p.level), info = CRATES[crate % CRATES.length], base = crate * PER_CRATE, stars = Array.from({ length: PER_CRATE }, (_, i) => p.stars[base + i + 1] || 0).reduce((a, b) => a + b, 0);
  return (
    <main className="bi-crates" aria-label="The crates">
      <header className="bi-top"><button className="bi-btn round" onClick={onBack} aria-label="Back">←</button><div className="bi-mast"><b>THE CRATES</b><small>{totalStars(p)} stars · {p.solved} papers solved</small></div></header>
      <div className="bi-crate">
        <button className="bi-btn round" disabled={crate <= 0} onClick={() => setCrate(crate - 1)} aria-label="Previous crate">‹</button>
        <div className="bi-label"><small>CRATE {crate + 1}</small><h2>{info.name}</h2><p>{info.theme.toUpperCase()} · {info.year + (crate >= CRATES.length ? 10 * Math.floor(crate / CRATES.length) : 0)} · {stars}/{PER_CRATE * 3} ★</p></div>
        <button className="bi-btn round" disabled={crate >= max} onClick={() => setCrate(crate + 1)} aria-label="Next crate">›</button>
      </div>
      <ol className="bi-grid">
        {Array.from({ length: PER_CRATE }, (_, i) => { const L = base + i + 1, locked = L > p.level, got = p.stars[L] || 0, types = Object.entries(UNLOCK).filter(([, u]) => u <= L).length; return (
          <li key={L}><button disabled={locked} className={`${got ? "done" : ""} ${L === p.level ? "now" : ""} ${i === PER_CRATE - 1 ? "boss" : ""}`} data-level={L} onClick={() => onOpen(L)} aria-label={locked ? `Paper ${posOf(L)}, locked` : `Paper ${posOf(L)}, ${got} stars`}>
            <b>{locked ? "🔒" : posOf(L)}</b><span className="bi-st">{[1, 2, 3].map((k) => <i key={k} className={k <= got ? "on" : ""}>★</i>)}</span><small>{i === PER_CRATE - 1 ? "SPECIAL" : `${types} type${types === 1 ? "" : "s"}`}</small>
          </button></li>); })}
      </ol>
      <p className="bi-foot">Each paper is a new set of puzzles. Finish one to unlock the next.</p>
    </main>
  );
}
