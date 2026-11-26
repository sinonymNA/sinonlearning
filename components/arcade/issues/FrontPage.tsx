"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// The front page of a paper: flag, dateline, banner headline, a halftone photo, a few news columns, an advert, and the PUZZLE PAGE where each puzzle is a clipped box with a live miniature.
// Tapping a box leans in to that puzzle. Progress shows on the miniature, and finished boxes carry a SOLVED stamp.
import { puzzleDone } from "../../../arcade-server/issues/index.mjs";
import { ADS, BLURBS, BRIEFS, WEATHER, PUZZLE_NAMES, type Era } from "./pageData";
import { Icon } from "./Icons";
import Scene from "./Scene";

const ICON: Record<string, () => React.ReactElement> = { crossword: Icon.grid, sudoku: Icon.sudoku, wordsearch: Icon.search, cipher: Icon.cipher };

/** [done, total, label] for a puzzle's progress line. */
export function progress(p: any): [number, number, string] {
  if (p.type === "crossword") { let t = 0, f = 0; p.data.cells.forEach((row: string[], r: number) => row.forEach((ch, c) => { if (ch) { t++; if (p.st.g[r][c]) f++; } })); return [f, t, `${f} of ${t} letters`]; }
  if (p.type === "sudoku") { let t = 0, f = 0; p.data.puzzle.forEach((row: number[], r: number) => row.forEach((v, c) => { if (!v) { t++; if (p.st.g[r][c]) f++; } })); return [f, t, `${f} of ${t} squares`]; }
  if (p.type === "wordsearch") return [p.st.found.length, p.data.words.length, `${p.st.found.length} of ${p.data.words.length} words`];
  const keys = Object.keys(p.data.key).filter((k) => !(k in p.data.given)), f = keys.filter((k) => p.st.g[k]).length; return [f, keys.length, `${f} of ${keys.length} letters`];
}
function Mini({ p }: { p: any }) {
  const d = p.data;
  if (p.type === "crossword") return <div className="mini cwm" style={{ gridTemplateColumns: `repeat(${d.cols}, 1fr)`, aspectRatio: `${d.cols} / ${d.rows}` }}>{d.cells.map((row: string[], r: number) => row.map((ch, c) => <i key={`${r},${c}`} className={!ch ? "k" : p.st.g[r][c] ? "f" : ""} />))}</div>;
  if (p.type === "sudoku") return <div className="mini sdm" style={{ gridTemplateColumns: `repeat(${d.n}, 1fr)`, aspectRatio: "1" }}>{p.st.g.map((row: number[], r: number) => row.map((v, c) => <i key={`${r},${c}`} className={d.puzzle[r][c] ? "g" : v ? "f" : ""} />))}</div>;
  if (p.type === "wordsearch") {
    const hit = new Set<string>(); p.st.found.forEach((f: any) => { const len = Math.max(Math.abs(f.r2 - f.r1), Math.abs(f.c2 - f.c1)), sr = Math.sign(f.r2 - f.r1), sc = Math.sign(f.c2 - f.c1); for (let i = 0; i <= len; i++) hit.add(`${f.r1 + sr * i},${f.c1 + sc * i}`); });
    return <div className="mini wsm" style={{ gridTemplateColumns: `repeat(${d.size}, 1fr)`, aspectRatio: "1" }}>{d.grid.map((row: string[], r: number) => row.map((_, c) => <i key={`${r},${c}`} className={hit.has(`${r},${c}`) ? "f" : ""} />))}</div>;
  }
  const words: string[] = d.cipherText.split(" ");
  return <div className="mini cpm">{words.map((w, i) => <span key={i} style={{ width: `${Math.max(14, w.length * 7)}%` }} className={[...w].every((cl) => cl in d.given || p.st.g[cl] === d.key[cl]) ? "f" : ""} />)}</div>;
}

export default function FrontPage({ st, era, crate, fresh, pulse, onOpen }: { st: any; era: Era; crate: number; fresh: number | null; pulse: number | null; onOpen: (i: number, rect: DOMRect) => void }) {
  const themes = Object.keys(BLURBS), at = Math.max(0, themes.indexOf(st.theme)), blurbs = [...BLURBS[themes[at]], ...BLURBS[themes[(at + 3 + (st.level % 5)) % themes.length]], ...BLURBS[themes[(at + 7) % themes.length]].slice(0, 1)], briefs = [0, 1, 2, 3, 4, 5].map((k) => BRIEFS[(st.level * 7 + k * 5) % BRIEFS.length]), ad = ADS[(st.level * 5 + crate) % ADS.length], weather = WEATHER[(st.level * 3 + crate) % WEATHER.length];
  const done = st.puzzles.filter(puzzleDone).length;
  return (
    <div className="fp">
      <div className="fp-ears"><span>VOL. {st.vol} · NO. {st.no}</span><span>{era.price} · {weather}</span></div>
      <h2 className="fp-flag" style={{ fontSize: `min(${(165 / Math.max(10, st.masthead.length)).toFixed(2)}vw, 8vh, 78px)` }}>{st.masthead}</h2>
      <div className="fp-date"><span>{st.date.toUpperCase()}</span><span>{era.tag}</span></div>
      <h3 className="fp-head">{st.headline}</h3>
      <div className="fp-body">
        <section className="fp-puz" aria-label="Puzzle page">
          <div className="fp-puzhead"><span>THE PUZZLE PAGE</span><b>{done} / {st.puzzles.length} SOLVED</b></div>
          <div className="fp-boxes" data-n={st.puzzles.length} style={{ ["--n" as any]: st.puzzles.length }}>
            {st.puzzles.map((p: any, i: number) => { const [f, t, label] = progress(p), isDone = puzzleDone(p), nm = PUZZLE_NAMES[p.type]; return (
              <button key={i} data-tab={i} className={`fp-box ${isDone ? "done" : ""} ${pulse === i && !isDone ? "next" : ""}`} onClick={(e) => onOpen(i, e.currentTarget.getBoundingClientRect())} aria-label={`${nm.title}, ${isDone ? "solved" : label}`}>
                <span className="fp-kick">{ICON[p.type]()}{nm.title}</span>
                <span className="fp-mini"><Mini p={p} /></span>
                <span className="fp-sub">{isDone ? "Solved" : f ? label : nm.sub}</span>
                <i className="fp-bar" style={{ transform: `scaleX(${t ? f / t : 0})` }} />
                {isDone && <u className={`fp-stamp ${fresh === i ? "fresh" : ""}`}>SOLVED</u>}
              </button>); })}
          </div>
          <p className="fp-tip">Tap a puzzle to lean in. Solve them all before the presses roll.</p>
        </section>
        <section className="fp-lead" aria-hidden>
          <figure className="fp-photo"><div className="ht"><Scene theme={st.theme} seed={st.level} /></div><figcaption>From our engraver: a scene from the {st.theme} beat. {st.date.slice(-4)}.</figcaption></figure>
          <div className="fp-cols">{blurbs.map((b, i) => <p key={i}>{i === 0 ? <span className="fp-drop">{b[0]}</span> : null}{i === 0 ? b.slice(1) : b}</p>)}</div>
          <div className="fp-briefs"><b>IN BRIEF</b><ul>{briefs.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          <aside className="fp-ad"><b>{ad.head}</b><span>{ad.body}</span></aside>
        </section>
      </div>
    </div>
  );
}
