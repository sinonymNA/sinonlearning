"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// The four puzzle surfaces of Back Issues. Every action goes through the engine (arcade-server/issues); these components only draw and send input.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cwSet, cwWrong, cwReveal, cwRevealWord, sdSet, sdNote, sdConflicts, sdReveal, sdIsGiven, wsSelect, wsReveal, cpSet, cpReveal, cpClashes } from "../../../arcade-server/issues/index.mjs";

export type PP = { st: any; pi: number; after: (r: any, snd?: string) => void; spend: (fn: () => any) => void; off: boolean; say: (t: string) => void };

function useSize() {
  const [s, setS] = useState({ w: 0, h: 0 }), ro = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: HTMLElement | null) => { ro.current?.disconnect(); if (!el) return; const go = () => setS({ w: el.clientWidth, h: el.clientHeight }); go(); ro.current = new ResizeObserver(go); ro.current.observe(el); }, []);
  return [ref, s] as const;
}
const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
function Keys({ onKey, onBack, off, dim }: { onKey: (c: string) => void; onBack: () => void; off: boolean; dim?: Set<string> }) {
  return (
    <div className="bi-keys" role="group" aria-label="Letters">
      {ROWS.map((row, i) => <div key={i} className="bi-keyrow">{[...row].map((ch) => <button key={ch} disabled={off} className={dim?.has(ch) ? "dim" : ""} onPointerDown={(e) => { e.preventDefault(); onKey(ch); }} aria-label={ch}>{ch}</button>)}{i === 2 && <button className="wide" disabled={off} onPointerDown={(e) => { e.preventDefault(); onBack(); }} aria-label="Erase">⌫</button>}</div>)}
    </div>
  );
}
/** Hardware keyboard: letters, digits, backspace, arrows. Ignored while a modal is up or a text field has focus. */
function useKeys(fn: (e: KeyboardEvent) => boolean, deps: any[]) {
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.ctrlKey || e.metaKey || e.altKey) return; const t = e.target as HTMLElement; if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return; if (fn(e)) e.preventDefault(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ======================================================================= crossword
export function Crossword({ st, pi, after, spend, off, say }: PP) {
  const p = st.puzzles[pi], d = p.data, g = p.st.g;
  const [rootRef, rs] = useSize(), [boardRef, bs] = useSize();
  const [sel, setSel] = useState<[number, number]>(() => [d.words[0].r, d.words[0].c]), [dir, setDir] = useState<"across" | "down">(d.words[0].dir), [wrong, setWrong] = useState<string[]>([]), [list, setList] = useState(false);
  const cover = useMemo(() => { const m: Record<string, number> = {}; d.words.forEach((w: any, i: number) => { for (let k = 0; k < w.len; k++) m[`${w.dir}:${w.r + (w.dir === "down" ? k : 0)},${w.c + (w.dir === "across" ? k : 0)}`] = i; }); return m; }, [d]);
  const order = useMemo(() => d.words.map((_: any, i: number) => i).sort((a: number, b: number) => (d.words[a].num - d.words[b].num) || (d.words[a].dir === "across" ? -1 : 1)), [d]);
  const wi = cover[`${dir}:${sel[0]},${sel[1]}`] ?? cover[`${dir === "across" ? "down" : "across"}:${sel[0]},${sel[1]}`], w = d.words[wi];
  const active = useMemo(() => { const s = new Set<string>(); if (w) for (let k = 0; k < w.len; k++) s.add(`${w.r + (w.dir === "down" ? k : 0)},${w.c + (w.dir === "across" ? k : 0)}`); return s; }, [w]);
  const wide = rs.w > rs.h * 1.25, cell = Math.max(14, Math.min(54, Math.floor(Math.min((bs.w - 6) / d.cols, (bs.h - 6) / d.rows))));
  const pick = (r: number, c: number) => {
    if (!d.cells[r][c]) return; setWrong([]);
    if (sel[0] === r && sel[1] === c) { const o = dir === "across" ? "down" : "across"; if (cover[`${o}:${r},${c}`] !== undefined) setDir(o); }
    else { setSel([r, c]); if (cover[`${dir}:${r},${c}`] === undefined) setDir(dir === "across" ? "down" : "across"); }
  };
  const goWord = (wj: number) => { const x = d.words[wj]; setDir(x.dir); const free = [...Array(x.len).keys()].find((k) => !g[x.r + (x.dir === "down" ? k : 0)][x.c + (x.dir === "across" ? k : 0)]) ?? 0; setSel([x.r + (x.dir === "down" ? free : 0), x.c + (x.dir === "across" ? free : 0)]); setWrong([]); };
  const step = (n: number) => { const at = order.indexOf(wi); goWord(order[(at + n + order.length) % order.length]); };
  const type = (ch: string) => { if (off) return; const r = cwSet(st, pi, sel[0], sel[1], ch); after(r, "key"); if (r.changed && w) { const k = dir === w.dir ? (dir === "across" ? sel[1] - w.c : sel[0] - w.r) : -1; if (k >= 0 && k < w.len - 1) setSel(dir === "across" ? [sel[0], sel[1] + 1] : [sel[0] + 1, sel[1]]); } setWrong([]); };
  const back = () => { if (off) return; if (g[sel[0]][sel[1]]) { after(cwSet(st, pi, sel[0], sel[1], ""), "erase"); return; } if (w && dir === w.dir) { const k = dir === "across" ? sel[1] - w.c : sel[0] - w.r; if (k > 0) { const nr = dir === "across" ? sel[0] : sel[0] - 1, nc = dir === "across" ? sel[1] - 1 : sel[1]; setSel([nr, nc]); after(cwSet(st, pi, nr, nc, ""), "erase"); } } };
  useKeys((e) => {
    if (off || list) return false; if (/^[a-zA-Z]$/.test(e.key)) { type(e.key); return true; } if (e.key === "Backspace") { back(); return true; } if (e.key === " " || e.key === "Tab") { if (e.key === "Tab") step(e.shiftKey ? -1 : 1); else { const o = dir === "across" ? "down" : "across"; if (cover[`${o}:${sel[0]},${sel[1]}`] !== undefined) setDir(o); } return true; }
    const mv: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }; const m = mv[e.key]; if (m) { let r = sel[0] + m[0], c = sel[1] + m[1]; while (r >= 0 && c >= 0 && r < d.rows && c < d.cols && !d.cells[r][c]) { r += m[0]; c += m[1]; } if (r >= 0 && c >= 0 && r < d.rows && c < d.cols) { setDir(m[0] ? "down" : "across"); setSel([r, c]); } return true; } return false;
  }, [sel, dir, off, list, g, wi]);
  const nums = useMemo(() => { const m: Record<string, number> = {}; d.words.forEach((x: any) => { m[`${x.r},${x.c}`] = x.num; }); return m; }, [d]);
  const check = () => { const bad = cwWrong(st, pi); setWrong(bad.map(([r, c]: number[]) => `${r},${c}`)); say(bad.length ? `${bad.length} letter${bad.length === 1 ? " is" : "s are"} wrong` : "All the letters so far are right"); };
  const clueRow = (x: any, i: number) => <li key={i}><button className={i === wi ? "on" : ""} onClick={() => { goWord(i); setList(false); }}><b>{x.num}</b> {x.clue} <small>({x.len})</small></button></li>;
  return (
    <div className={`bi-pz ${wide ? "wide" : ""}`} ref={rootRef}>
      <div className="bi-board" ref={boardRef}>
        <div className="bi-cw" style={{ gridTemplateColumns: `repeat(${d.cols}, ${cell}px)`, gridTemplateRows: `repeat(${d.rows}, ${cell}px)`, fontSize: cell * 0.6 }} role="grid" aria-label="Crossword">
          {d.cells.map((row: string[], r: number) => row.map((ch, c) => ch ? (
            <button key={`${r},${c}`} data-r={r} data-c={c} className={`cw ${sel[0] === r && sel[1] === c ? "sel" : active.has(`${r},${c}`) ? "act" : ""} ${wrong.includes(`${r},${c}`) ? "bad" : ""} ${g[r][c] && g[r][c] === ch && p.st.g[r][c] ? "" : ""}`} onClick={() => pick(r, c)} aria-label={`Row ${r + 1} column ${c + 1}${g[r][c] ? `, ${g[r][c]}` : ", empty"}`}>
              {nums[`${r},${c}`] && <i>{nums[`${r},${c}`]}</i>}<span>{g[r][c]}</span>
            </button>) : <div key={`${r},${c}`} className="cw blank" />))}
        </div>
      </div>
      <div className="bi-side">
        <div className="bi-clue"><button onClick={() => step(-1)} aria-label="Previous clue">‹</button><button className="txt" onClick={() => setList(true)} aria-label="All clues">{w ? <><b>{w.num} {w.dir === "across" ? "ACROSS" : "DOWN"}</b> {w.clue} <small>({w.len})</small></> : "Tap a square"}</button><button onClick={() => step(1)} aria-label="Next clue">›</button></div>
        <Keys onKey={type} onBack={back} off={off} />
        <div className="bi-tools"><button onClick={check}>CHECK</button><button disabled={off || !w} onClick={() => spend(() => cwReveal(st, pi, sel[0], sel[1]))}>💡 LETTER</button><button disabled={off || !w} onClick={() => spend(() => cwRevealWord(st, pi, wi))}>💡 WORD</button><button onClick={() => setList(true)}>CLUES</button></div>
      </div>
      {list && (
        <div className="bi-sheet" role="dialog" aria-label="Clues" onClick={() => setList(false)}>
          <div onClick={(e) => e.stopPropagation()}><h3>ACROSS</h3><ol>{d.words.map((x: any, i: number) => x.dir === "across" ? clueRow(x, i) : null)}</ol><h3>DOWN</h3><ol>{d.words.map((x: any, i: number) => x.dir === "down" ? clueRow(x, i) : null)}</ol><button className="bi-btn" onClick={() => setList(false)}>CLOSE</button></div>
        </div>
      )}
    </div>
  );
}

// ======================================================================= sudoku
export function Sudoku({ st, pi, after, spend, off }: PP) {
  const p = st.puzzles[pi], d = p.data, g = p.st.g, n = d.n, [bh, bw] = d.box;
  const [rootRef, rs] = useSize(), [boardRef, bs] = useSize();
  const [sel, setSel] = useState<[number, number] | null>(null), [notes, setNotes] = useState(false);
  const wide = rs.w > rs.h * 1.25, cell = Math.max(18, Math.min(64, Math.floor(Math.min((bs.w - 6) / n, (bs.h - 6) / n)))), bad = sdConflicts(st, pi);
  const put = (v: number) => { if (off || !sel) return; const [r, c] = sel; if (sdIsGiven(p, r, c)) return; if (notes && v > 0) { after(sdNote(st, pi, r, c, v), "key"); return; } after(sdSet(st, pi, r, c, g[r][c] === v ? 0 : v), v ? "key" : "erase"); };
  useKeys((e) => {
    if (off) return false; if (/^[1-9]$/.test(e.key) && +e.key <= n) { put(+e.key); return true; } if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") { if (sel && g[sel[0]][sel[1]]) put(g[sel[0]][sel[1]]); return true; } if (e.key.toLowerCase() === "n") { setNotes((x) => !x); return true; }
    const mv: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }; const m = mv[e.key]; if (m) { const [r, c] = sel || [0, 0]; setSel([Math.max(0, Math.min(n - 1, r + (sel ? m[0] : 0))), Math.max(0, Math.min(n - 1, c + (sel ? m[1] : 0)))]); return true; } return false;
  }, [sel, notes, off, g]);
  const sv = sel ? g[sel[0]][sel[1]] : 0;
  return (
    <div className={`bi-pz ${wide ? "wide" : ""}`} ref={rootRef}>
      <div className="bi-board" ref={boardRef}>
        <div className="bi-sd" style={{ gridTemplateColumns: `repeat(${n}, ${cell}px)`, gridTemplateRows: `repeat(${n}, ${cell}px)`, fontSize: cell * 0.6 }} role="grid" aria-label="Sudoku">
          {g.map((row: number[], r: number) => row.map((v, c) => {
            const k = `${r},${c}`, nt = p.st.notes[k] || 0, peer = sel && (sel[0] === r || sel[1] === c || (Math.floor(sel[0] / bh) === Math.floor(r / bh) && Math.floor(sel[1] / bw) === Math.floor(c / bw)));
            return (
              <button key={k} data-r={r} data-c={c} className={`sd ${sdIsGiven(p, r, c) ? "given" : ""} ${sel && sel[0] === r && sel[1] === c ? "sel" : peer ? "peer" : ""} ${bad.has(k) ? "bad" : ""} ${sv && v === sv ? "same" : ""} ${c % bw === bw - 1 && c < n - 1 ? "rb" : ""} ${r % bh === bh - 1 && r < n - 1 ? "bb" : ""}`} onClick={() => setSel([r, c])} aria-label={`Row ${r + 1} column ${c + 1}${v ? `, ${v}` : ", empty"}`}>
                {v ? v : nt ? <em style={{ gridTemplateColumns: `repeat(${bw}, 1fr)`, fontSize: cell * 0.24 }}>{Array.from({ length: n }, (_, i) => <b key={i}>{nt & (1 << (i + 1)) ? i + 1 : ""}</b>)}</em> : ""}
              </button>
            );
          }))}
        </div>
      </div>
      <div className="bi-side">
        <div className="bi-pad" role="group" aria-label="Numbers">{Array.from({ length: n }, (_, i) => <button key={i} disabled={off} onPointerDown={(e) => { e.preventDefault(); put(i + 1); }} aria-label={`${i + 1}`}>{i + 1}</button>)}</div>
        <div className="bi-tools"><button aria-pressed={notes} className={notes ? "on" : ""} onClick={() => setNotes(!notes)}>✎ NOTES</button><button disabled={off || !sel || !sv || sdIsGiven(p, sel![0], sel![1])} onClick={() => sel && put(g[sel[0]][sel[1]])}>⌫ ERASE</button><button disabled={off || !sel} onClick={() => sel && spend(() => sdReveal(st, pi, sel[0], sel[1]))}>💡 HINT</button></div>
      </div>
    </div>
  );
}

// ======================================================================= word search
export function WordSearch({ st, pi, after, spend, off }: PP) {
  const p = st.puzzles[pi], d = p.data, n = d.size, [rootRef, rs] = useSize(), [boardRef, bs] = useSize(), grid = useRef<HTMLDivElement>(null);
  const [a, setA] = useState<[number, number] | null>(null), [b, setB] = useState<[number, number] | null>(null), [anchor, setAnchor] = useState<[number, number] | null>(null), [flash, setFlash] = useState(0);
  const wide = rs.w > rs.h * 1.25, cell = Math.max(16, Math.min(56, Math.floor(Math.min((bs.w - 6) / n, (bs.h - 6) / n))));
  const at = (e: React.PointerEvent): [number, number] | null => { const rc = grid.current!.getBoundingClientRect(), c = Math.floor((e.clientX - rc.left) / cell), r = Math.floor((e.clientY - rc.top) / cell); return r >= 0 && c >= 0 && r < n && c < n ? [r, c] : null; };
  const straight = (x: [number, number], y: [number, number]) => { const dr = y[0] - x[0], dc = y[1] - x[1]; return dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc); };
  const line = (x: [number, number] | null, y: [number, number] | null) => { const s = new Set<string>(); if (!x || !y || !straight(x, y)) return s; const len = Math.max(Math.abs(y[0] - x[0]), Math.abs(y[1] - x[1])), sr = Math.sign(y[0] - x[0]), sc = Math.sign(y[1] - x[1]); for (let i = 0; i <= len; i++) s.add(`${x[0] + sr * i},${x[1] + sc * i}`); return s; };
  const foundCells = useMemo(() => { const s = new Set<string>(); p.st.found.forEach((f: any) => line([f.r1, f.c1], [f.r2, f.c2]).forEach((k) => s.add(k))); return s; }, [p.st.found.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const preview = line(a, b || a), anc = anchor ? `${anchor[0]},${anchor[1]}` : "";
  const down = (e: React.PointerEvent) => { if (off) return; const x = at(e); if (!x) return; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); setA(x); setB(x); };
  const move = (e: React.PointerEvent) => { if (!a) return; const x = at(e); if (x) setB(x); };
  const finish = (x: [number, number], y: [number, number]) => { const r = wsSelect(st, pi, x[0], x[1], y[0], y[1]); after(r.found ? { ...r, changed: true } : { changed: false }, r.found ? "found" : "bad"); if (r.found) setFlash((f) => f + 1); return !!r.found; };
  const up = () => { if (!a) return; const y = b || a; if (a[0] === y[0] && a[1] === y[1]) { if (anchor && !(anchor[0] === a[0] && anchor[1] === a[1])) { finish(anchor, a); setAnchor(null); } else setAnchor(a); } else { setAnchor(null); if (straight(a, y)) finish(a, y); } setA(null); setB(null); };
  const left = d.words.filter((w: any) => !p.st.found.some((f: any) => f.word === w.word));
  return (
    <div className={`bi-pz ${wide ? "wide" : ""}`} ref={rootRef}>
      <div className="bi-board" ref={boardRef}>
        <div ref={grid} className="bi-ws" style={{ gridTemplateColumns: `repeat(${n}, ${cell}px)`, gridTemplateRows: `repeat(${n}, ${cell}px)`, fontSize: cell * 0.58 }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { setA(null); setB(null); }} role="grid" aria-label="Word search">
          {d.grid.map((row: string[], r: number) => row.map((ch, c) => { const k = `${r},${c}`; return <div key={k} data-r={r} data-c={c} className={`ws ${foundCells.has(k) ? "found" : ""} ${preview.has(k) ? "pre" : ""} ${k === anc ? "anchor" : ""}`}>{ch}</div>; }))}
        </div>
      </div>
      <div className="bi-side">
        <ul className="bi-words" aria-label="Words to find" key={flash}>{d.words.map((w: any) => { const f = p.st.found.some((x: any) => x.word === w.word); return <li key={w.word} className={f ? "done" : ""}>{w.word}</li>; })}</ul>
        <div className="bi-tools"><button disabled={off || !left.length} onClick={() => spend(() => wsReveal(st, pi))}>💡 FIND ONE</button></div>
        <p className="bi-tip">Drag across a word, or tap its first and last letters. Words can run backwards{d.words.some((w: any) => w.dr !== 0 && w.dc !== 0) ? " and sideways" : ""}.</p>
      </div>
    </div>
  );
}

// ======================================================================= cryptogram
export function Cipher({ st, pi, after, spend, off }: PP) {
  const p = st.puzzles[pi], d = p.data, g = p.st.g, [rootRef, rs] = useSize(), [boardRef, bs] = useSize(), [sel, setSel] = useState<string | null>(null);
  const wide = rs.w > rs.h * 1.25, text: string = d.cipherText, words = text.split(" ");
  const w = useMemo(() => { for (let s = 44; s >= 14; s -= 2) { let rows = 1, x = 0; const W = bs.w - 12; for (const wd of words) { const len = wd.length * (s + 3); if (x && x + len > W) { rows++; x = 0; } x += len + s * 0.9; } if (rows * (s * 2.3 + 12) <= bs.h - 8) return s; } return 14; }, [text, bs.w, bs.h]); // eslint-disable-line react-hooks/exhaustive-deps
  const clash = cpClashes(st, pi), used = new Set<string>(Object.values(g) as string[]);
  const type = (ch: string) => { if (off || !sel) return; after(cpSet(st, pi, sel, ch), "key"); };
  const back = () => { if (off || !sel) return; after(cpSet(st, pi, sel, ""), "erase"); };
  useKeys((e) => { if (off) return false; if (/^[a-zA-Z]$/.test(e.key)) { type(e.key); return true; } if (e.key === "Backspace") { back(); return true; } return false; }, [sel, off, g]);
  return (
    <div className={`bi-pz ${wide ? "wide" : ""}`} ref={rootRef}>
      <div className="bi-board" ref={boardRef}>
        <div className="bi-cp" style={{ fontSize: w * 0.62, gap: `${w * 0.5}px ${w * 0.9}px` }} role="group" aria-label="Cryptogram">
          {words.map((wd: string, i: number) => <span key={i} className="cpw">{[...wd].map((cl, j) => { const given = cl in d.given, guess = g[cl] || "", right = given; return (
            <button key={j} data-cl={cl} className={`cp ${sel === cl ? "sel" : ""} ${given ? "given" : ""} ${clash.has(cl) ? "bad" : ""} ${right ? "" : ""}`} style={{ width: w, height: w * 2.1 }} onClick={() => setSel(cl)} aria-label={`Cipher letter ${cl}${guess ? `, guessed ${guess}` : ""}`}><i>{cl}</i><span>{guess}</span></button>); })}</span>)}
        </div>
      </div>
      <div className="bi-side">
        <div className="bi-clue"><span className="txt">{sel ? `Cipher letter ${sel}: ${g[sel] ? `you think ${g[sel]}` : "no guess yet"}` : "Tap a letter, then type what you think it stands for."}</span></div>
        <Keys onKey={type} onBack={back} off={off || !sel} dim={used} />
        <div className="bi-tools"><button disabled={off || !sel || sel in d.given} onClick={() => sel && spend(() => cpReveal(st, pi, sel))}>💡 REVEAL</button></div>
      </div>
    </div>
  );
}
