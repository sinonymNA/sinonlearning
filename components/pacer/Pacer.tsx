"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/refs, react-hooks/set-state-in-effect */
// Pacer: the library (open a PDF, EPUB or text file, or paste text) and the reading room. Everything happens in this browser; nothing is uploaded.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./pacer.css";
import { readFile, textBook, type Book } from "../../lib/pacer/extract";
import { loadSaved, save, putBook, getBook, delBook, type Saved, type Settings, type Session } from "../../lib/pacer/store";
import { SAMPLE_TEXT, SAMPLE_TITLE } from "../../lib/pacer/sample";
import { paceLabel } from "../../lib/pacer/engine.mjs";
import Reader from "./Reader";

const ago = (t: number) => { const d = Math.round((Date.now() - t) / 86400000); return d < 1 ? "today" : d === 1 ? "yesterday" : `${d} days ago`; };

export default function Pacer() {
  const [s, setS] = useState<Saved | null>(null), [book, setBook] = useState<Book | null>(null), [startPos, setStartPos] = useState(0), [busy, setBusy] = useState<string | null>(null), [error, setError] = useState<string | null>(null), [paste, setPaste] = useState(false), [text, setText] = useState(""), [over, setOver] = useState(false);
  const ref = useRef<Saved | null>(null); ref.current = s; const fileIn = useRef<HTMLInputElement>(null);
  useEffect(() => { setS(loadSaved()); }, []);
  const commit = useCallback((fn: (x: Saved) => Saved) => { const n = fn(ref.current || loadSaved()); ref.current = n; setS(n); save(n); }, []);

  const openBook = useCallback(async (b: Book, pos = 0) => {
    await putBook(b);
    commit((x) => { const lib = x.library.filter((l) => l.id !== b.id); const prev = x.library.find((l) => l.id === b.id); lib.unshift({ id: b.id, title: b.title, author: b.author, words: b.words, pos: prev?.pos ?? pos, wpm: prev?.wpm ?? x.settings.wpm, updated: Date.now() }); return { ...x, library: lib.slice(0, 30) }; });
    setStartPos(ref.current?.library.find((l) => l.id === b.id)?.pos ?? pos); setBook(b);
  }, [commit]);
  const pickFile = async (f: File | undefined) => {
    if (!f) return; setError(null); setBusy("Opening your file…");
    try { const b = await readFile(f, (m) => setBusy(m)); setBusy(null); await openBook(b); } catch (e: any) { setBusy(null); setError(e?.message || "That file could not be read."); }
  };
  const openSaved = async (id: string) => { setBusy("Opening…"); const b = await getBook(id); setBusy(null); if (!b) { setError("That book is no longer stored on this device. Open the file again."); commit((x) => ({ ...x, library: x.library.filter((l) => l.id !== id) })); return; } setStartPos(ref.current?.library.find((l) => l.id === id)?.pos ?? 0); setBook(b); };
  const remove = async (id: string) => { await delBook(id); commit((x) => ({ ...x, library: x.library.filter((l) => l.id !== id) })); };
  const onProgress = useCallback((pos: number, wpm: number) => { if (!book) return; commit((x) => ({ ...x, library: x.library.map((l) => (l.id === book.id ? { ...l, pos, wpm, updated: Date.now() } : l)) })); }, [book, commit]);
  const onSession = useCallback((se: Session) => commit((x) => ({ ...x, sessions: [...x.sessions, se] })), [commit]);
  const setSettings = useCallback((n: Settings) => commit((x) => ({ ...x, settings: n })), [commit]);

  if (!s) return <div className="pc-root" style={{ minHeight: "100vh" }} />;
  if (book) return <Reader key={book.id} book={book} startPos={startPos} settings={s.settings} onSettings={setSettings} onExit={() => setBook(null)} onProgress={onProgress} onSession={onSession} />;
  const sess = s.sessions.slice(-12), maxW = Math.max(300, ...sess.map((x) => x.wpm)), last = s.sessions[s.sessions.length - 1];
  return (
    <div className="pc-root pc-sans pc-lib" data-theme={s.settings.theme === "night" ? "night" : "paper"}>
      <header className="pc-libtop"><Link href="/" className="pc-back">← Sinon Learning</Link><span className="pc-badge">Free · private · no sign-in</span></header>
      <main className="pc-libmain">
        <section className="pc-hero">
          <h1>Pacer</h1>
          <p className="pc-sub">Read any PDF or book at a pace you choose, and train it up. A guide keeps your eyes moving, so you stop rereading and drifting.</p>
          <div className={`pc-drop ${over ? "over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); pickFile(e.dataTransfer.files?.[0]); }}>
            <input ref={fileIn} type="file" accept=".pdf,.epub,.txt,.md,.html,.htm,application/pdf,application/epub+zip,text/plain" hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} aria-label="Choose a PDF, EPUB or text file" />
            <b>Drop a PDF, EPUB or text file here</b><span>or</span>
            <div className="pc-row"><button className="pc-btn pri" onClick={() => fileIn.current?.click()} disabled={!!busy}>Choose a file</button><button className="pc-btn" onClick={() => setPaste((p) => !p)}>Paste text</button><button className="pc-btn" onClick={() => openBook(textBook(SAMPLE_TITLE, SAMPLE_TEXT))}>Try a sample</button></div>
            {busy && <p className="pc-busy" role="status">{busy}</p>}
            {error && <p className="pc-err" role="alert">{error}</p>}
            {paste && <div className="pc-paste"><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste an article, an essay, or a chapter here…" aria-label="Text to read" rows={6} /><button className="pc-btn pri" disabled={text.trim().split(/\s+/).length < 5} onClick={() => { try { openBook(textBook("Pasted text", text)); } catch (e: any) { setError(e.message); } }}>Start reading</button></div>}
          </div>
          <p className="pc-priv">🔒 Your file never leaves this device. Pacer reads it in your browser and remembers your place here, nothing more. Copy-protected (DRM) books and scanned PDFs without real text cannot be opened.</p>
        </section>

        {s.library.length > 0 && (
          <section aria-label="Your books"><h2>Continue reading</h2>
            <ul className="pc-books">{s.library.map((l) => (
              <li key={l.id}><button className="pc-book" onClick={() => openSaved(l.id)}><b>{l.title}</b><small>{l.author ? `${l.author} · ` : ""}{l.words.toLocaleString()} words · {l.wpm} wpm · {ago(l.updated)}</small><i><u style={{ width: `${Math.round((100 * l.pos) / Math.max(1, l.words))}%` }} /></i></button><button className="pc-x" onClick={() => remove(l.id)} aria-label={`Remove ${l.title} from this device`}>✕</button></li>))}</ul>
          </section>)}

        {sess.length > 0 && (
          <section aria-label="Your progress"><h2>Your progress</h2>
            <div className="pc-chart" role="img" aria-label={`Reading speed over your last ${sess.length} sessions`}>{sess.map((x, i) => <div key={i} title={`${x.wpm} wpm${x.recall !== null ? `, recall ${x.recall}%` : ""}`} style={{ height: `${Math.max(6, (100 * x.wpm) / maxW)}%` }}><span>{x.wpm}</span></div>)}</div>
            <p className="pc-note">Last session: <b>{last.wpm} wpm</b> ({paceLabel(last.wpm).toLowerCase()}){last.recall !== null ? ` with ${last.recall}% recall` : ""}. The best pace is the fastest one where you can still retell what you read.</p>
          </section>)}

        <section className="pc-how"><h2>Three ways to be paced</h2>
          <div className="pc-three">
            <article><h3>Focus</h3><p>One word, or a few, at a time with a fixed red pivot letter. Your eyes stop jumping around, so it feels fast.</p></article>
            <article><h3>Pacer</h3><p>Your real page with a moving highlight. It keeps you from rereading and drifting. This is the one with the best evidence.</p></article>
            <article><h3>Scroll</h3><p>The text glides past a reading line, like a teleprompter. Good for long articles.</p></article>
          </div>
          <p className="pc-note"><b>An honest note:</b> nobody reads a hard chapter at 1,000 words a minute and remembers it. Pacer is built to find the fastest speed that still keeps the story, then nudge it up a little each day. Turn on recall check-ins and it will tune the speed for you.</p>
        </section>
      </main>
    </div>
  );
}
