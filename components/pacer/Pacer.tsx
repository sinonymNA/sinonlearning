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
import { mergeLibraries, mergeSessions } from "../../lib/pacer/validate.mjs";
import { fetchLibrary, uploadBook, downloadBook, deleteCloud, pushProgress, pushState, signOut, type Account, type CloudLib } from "../../lib/pacer/cloud";
import Reader from "./Reader";
import WalkHome from "./walk/WalkHome";
import WalkRunner from "./walk/WalkRunner";
import WalkFinish from "./walk/WalkFinish";
import "./walk/walk.css";
import { loadWalk, saveWalk, type WalkData } from "./walk/store";
import { walk, useWalk, type WalkResult } from "../../lib/pacer/walkSession";

const ago = (t: number) => { const d = Math.round((Date.now() - t) / 86400000); return d < 1 ? "today" : d === 1 ? "yesterday" : `${d} days ago`; };

export default function Pacer({ initialScreen }: { initialScreen?: "walk" }) {
  const [account, setAccount] = useState<Account | null | undefined>(undefined), [syncOn, setSyncOn] = useState(false), [usage, setUsage] = useState<CloudLib["usage"]>(undefined), [note, setNote] = useState<string | null>(null), [ask, setAsk] = useState<null | { kind: "remove"; id: string; title: string; cloud: boolean } | { kind: "signout" }>(null), [s, setS] = useState<Saved | null>(null), [book, setBook] = useState<Book | null>(null), [startPos, setStartPos] = useState(0), [busy, setBusy] = useState<string | null>(null), [error, setError] = useState<string | null>(null), [paste, setPaste] = useState(false), [text, setText] = useState(""), [over, setOver] = useState(false);
  const ref = useRef<Saved | null>(null); ref.current = s; const fileIn = useRef<HTMLInputElement>(null);
  const acc = useRef<Account | null | undefined>(undefined); acc.current = account; const lastPush = useRef<Record<string, number>>({}), stateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ws = useWalk(), [screen, setScreen] = useState<"library" | "walk">(initialScreen === "walk" ? "walk" : "library"), [wd, setWdState] = useState<WalkData | null>(null), [result, setResult] = useState<WalkResult | null>(null);
  useEffect(() => { setWdState(loadWalk()); }, []);
  const setWd = useCallback((fn: (d: WalkData) => WalkData) => setWdState((prev) => { const n = fn(prev as WalkData); saveWalk(n); return n; }), []);
  useEffect(() => { if (ws.status === "finished") { const r = walk.end(); if (r) setResult(r); } }, [ws.status]);
  const onWalkEnd = useCallback((r: WalkResult | null) => { if (r) setResult(r); }, []);
  const commit = useCallback((fn: (x: Saved) => Saved) => { const n = fn(ref.current || loadSaved()); ref.current = n; setS(n); save(n); }, []);
  const refreshCloud = useCallback(async () => {
    const c = await fetchLibrary(); if (!c) { setAccount(null); return; } setSyncOn(c.sync); setAccount(c.user); setUsage(c.usage);
    if (!c.user) { commit((x) => ({ ...x, library: x.library.filter((l) => l.local !== false).map((l) => ({ ...l, cloud: false })) })); return; }
    let pushUp: { id: string; pos: number; wpm: number; at: number }[] = [], pushSettings = false;
    commit((x) => {
      const loc = x.library.map((l) => ({ ...l, local: l.local !== false })), cloudItems = c.books.map((b) => ({ id: b.id, title: b.title, author: b.author || undefined, words: b.words, pos: b.pos, wpm: b.wpm, at: b.at, updated: Math.max(b.at, b.added) }));
      const merged = mergeLibraries(loc, cloudItems).map((m: any) => ({ ...m, local: loc.some((l) => l.id === m.id) })); pushUp = merged.filter((m: any) => m.cloud && m.local && (m.at || 0) > (c.books.find((b) => b.id === m.id)?.at || 0)).map((m: any) => ({ id: m.id, pos: m.pos, wpm: m.wpm, at: m.at }));
      let settings = x.settings, settingsAt = x.settingsAt; if (c.settings && c.settingsAt > x.settingsAt) { settings = { ...x.settings, ...c.settings }; settingsAt = c.settingsAt; } else if (!c.settings || x.settingsAt > c.settingsAt) pushSettings = true;
      const sessions = mergeSessions(x.sessions, c.sessions); if (sessions.length !== c.sessions.length) pushSettings = true;
      return { ...x, library: merged, settings, settingsAt, sessions };
    });
    for (const u of pushUp) pushProgress(u.id, u.pos, u.wpm, u.at); if (pushSettings && ref.current) pushState(ref.current.settings, ref.current.sessions, ref.current.settingsAt || Date.now());
  }, [commit]);
  useEffect(() => { const sv = loadSaved(); ref.current = sv; setS(sv); refreshCloud(); const onVis = () => { if (!document.hidden) refreshCloud(); }; document.addEventListener("visibilitychange", onVis); return () => document.removeEventListener("visibilitychange", onVis); }, [refreshCloud]);
  const syncUp = useCallback(async (b: Book) => {
    const it = ref.current?.library.find((l) => l.id === b.id); setNote(`Saving “${b.title}” to your account…`);
    const r = await uploadBook(b, it?.pos ?? 0, it?.wpm ?? ref.current?.settings.wpm ?? 250, it?.at ?? 0);
    if (r.ok) { commit((x) => ({ ...x, library: x.library.map((l) => (l.id === b.id ? { ...l, cloud: true } : l)) })); setNote(null); fetchLibrary().then((c) => c && setUsage(c.usage)); } else setNote(r.error);
  }, [commit]);

  const openBook = useCallback(async (b: Book, pos = 0) => {
    await putBook(b);
    commit((x) => { const lib = x.library.filter((l) => l.id !== b.id); const prev = x.library.find((l) => l.id === b.id); lib.unshift({ id: b.id, title: b.title, author: b.author, words: b.words, pos: prev?.pos ?? pos, wpm: prev?.wpm ?? x.settings.wpm, updated: Date.now(), at: prev?.at, cloud: prev?.cloud, local: true }); return { ...x, library: lib.slice(0, 80) }; });
    if (acc.current && ref.current?.autoSync && !ref.current.library.find((l) => l.id === b.id)?.cloud) syncUp(b);
    setStartPos(ref.current?.library.find((l) => l.id === b.id)?.pos ?? pos); setBook(b);
  }, [commit, syncUp]);
  const pickFile = async (f: File | undefined) => {
    if (!f) return; setError(null); setBusy("Opening your file…");
    try { const b = await readFile(f, (m) => setBusy(m)); setBusy(null); await openBook(b); } catch (e: any) { setBusy(null); setError(e?.message || "That file could not be read."); }
  };
  const openSaved = async (id: string) => {
    setBusy("Opening…"); let b = await getBook(id); const it = ref.current?.library.find((l) => l.id === id);
    if (!b && it?.cloud) { setBusy("Getting it from your account…"); b = (await downloadBook(id)) ?? undefined; if (b) { await putBook(b); commit((x) => ({ ...x, library: x.library.map((l) => (l.id === id ? { ...l, local: true } : l)) })); } }
    setBusy(null); if (!b) { setError(it?.cloud ? "Could not get that book from your account. Check your connection." : "That book is no longer stored on this device. Open the file again."); if (!it?.cloud) commit((x) => ({ ...x, library: x.library.filter((l) => l.id !== id) })); return; } setStartPos(ref.current?.library.find((l) => l.id === id)?.pos ?? 0); setBook(b); };
  const removeLocal = async (id: string, everywhere: boolean) => {
    await delBook(id); if (everywhere) await deleteCloud(id);
    commit((x) => ({ ...x, library: everywhere || !x.library.find((l) => l.id === id)?.cloud ? x.library.filter((l) => l.id !== id) : x.library.map((l) => (l.id === id ? { ...l, local: false } : l)) })); setAsk(null); if (everywhere) fetchLibrary().then((c) => c && setUsage(c.usage));
  };
  const doSignOut = async (wipe: boolean) => { if (wipe) for (const l of ref.current?.library || []) await delBook(l.id); await signOut(); commit((x) => ({ ...x, library: wipe ? [] : x.library.filter((l) => l.local !== false).map((l) => ({ ...l, cloud: false })) })); setAccount(null); setAsk(null); setUsage(undefined); };
  const saveToAccount = async (id: string) => { const b = await getBook(id); if (b) syncUp(b); };
  const onProgress = useCallback((pos: number, wpm: number, force?: boolean) => {
    if (!book) return; const now = Date.now(); commit((x) => ({ ...x, library: x.library.map((l) => (l.id === book.id ? { ...l, pos, wpm, updated: now, at: now } : l)) }));
    const it = ref.current?.library.find((l) => l.id === book.id); if (acc.current && it?.cloud && (force || now - (lastPush.current[book.id] || 0) > 6000)) { lastPush.current[book.id] = now; pushProgress(book.id, pos, wpm, now); }
  }, [book, commit]);
  const onSession = useCallback((se: Session) => { commit((x) => ({ ...x, sessions: [...x.sessions, se] })); if (acc.current && ref.current) pushState(ref.current.settings, ref.current.sessions, ref.current.settingsAt || Date.now()); }, [commit]);
  const setSettings = useCallback((n: Settings) => { commit((x) => ({ ...x, settings: n, settingsAt: Date.now() })); if (acc.current) { if (stateTimer.current) clearTimeout(stateTimer.current); stateTimer.current = setTimeout(() => { if (ref.current) pushState(ref.current.settings, ref.current.sessions, ref.current.settingsAt); }, 1500); } }, [commit]);

  if (!s || !wd) return <div className="pc-root" style={{ minHeight: "100vh" }} />;
  const overlay = result ? <WalkFinish result={result} data={wd} setData={setWd} bookTitle={wd.meta?.book || ""} theme={s.settings.theme === "night" ? "night" : "paper"} onClose={() => setResult(null)} /> : null;
  if (ws.status !== "idle" && !book) return <><WalkRunner theme={s.settings.theme === "night" ? "night" : "paper"} onEnd={onWalkEnd} />{overlay}</>;
  if (book) return <><Reader key={book.id} book={book} startPos={startPos} settings={s.settings} onSettings={setSettings} onExit={() => setBook(null)} onProgress={onProgress} onSession={onSession} onWalkEnd={onWalkEnd} />{overlay}</>;
  if (screen === "walk") return <><WalkHome library={s.library} data={wd} setData={setWd} onStart={(id) => { if (id) openSaved(id); }} onBack={() => setScreen("library")} />{overlay}</>;
  const sess = s.sessions.slice(-12), maxW = Math.max(300, ...sess.map((x) => x.wpm)), last = s.sessions[s.sessions.length - 1];
  return (
    <div className="pc-root pc-sans pc-lib" data-theme={s.settings.theme === "night" ? "night" : "paper"}>
      <header className="pc-libtop"><Link href="/" className="pc-back">← Sinon Learning</Link><span className="pc-badge">Free · private</span></header>
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
          <p className="pc-priv">🔒 {account ? "Books you open are saved privately to your account, so you can pick up on any device. Only you can open them. Save only files you have the right to read." : "Your file stays on this device unless you sign in to sync. Pacer reads it in your browser and remembers your place here."} Copy-protected (DRM) books and scanned PDFs without real text cannot be opened.</p>
        </section>

        <section className="pc-walkcard" aria-label="Interval walk"><div><h2>Walk while you read</h2><p>Interval walking, the Japanese way: 3 minutes brisk, 3 minutes easy, 30 minutes. Tones tell you when to switch, your book is read aloud, and your steps from Apple Health turn into calories.</p></div><button className="pc-btn pri" onClick={() => setScreen("walk")}>Open Pacer Walk</button></section>

        {syncOn && account === null && (
          <section className="pc-sync" aria-label="Sync across devices"><div><h2>Read on your phone and iPad too</h2><p>Make a free account and Pacer keeps your books and your place on every device. Start on your laptop, pick up on your phone.</p></div>
            <div className="pc-row"><Link className="pc-btn pri" href="/margins/login?next=/pacer">Sign in</Link><Link className="pc-btn" href="/margins/signup?next=/pacer">Create a free account</Link></div></section>)}
        {syncOn && account && (
          <section className="pc-sync on" aria-label="Your account"><div><b>☁ {account.name}</b><p>Your books and your place sync across your devices.{usage ? ` ${usage.books} of ${usage.maxBooks} books · ${(usage.bytes / 1048576).toFixed(1)} of ${Math.round(usage.maxBytes / 1048576)} MB used.` : ""}</p></div>
            <label className="pc-toggle"><input type="checkbox" checked={s.autoSync} onChange={(e) => commit((x) => ({ ...x, autoSync: e.target.checked }))} /><span>Save new books to my account</span></label><button className="pc-btn" onClick={() => setAsk({ kind: "signout" })}>Sign out</button></section>)}
        {note && <p className="pc-busy" role="status" style={{ margin: 0 }}>{note}</p>}
        {account && s.library.some((l) => l.local !== false && !l.cloud) && <p className="pc-note" style={{ margin: 0 }}>{s.library.filter((l) => l.local !== false && !l.cloud).length} book(s) are only on this device. Use “Save to account” on a book below to read it anywhere.</p>}

        {s.library.length > 0 && (
          <section aria-label="Your books"><h2>Continue reading</h2>
            <ul className="pc-books">{s.library.map((l) => (
              <li key={l.id}><button className="pc-book" onClick={() => openSaved(l.id)}><b>{l.title}</b><small>{l.author ? `${l.author} · ` : ""}{l.words.toLocaleString()} words · {l.wpm} wpm · {ago(l.updated)}</small><small className="pc-st">{l.cloud ? (l.local === false ? "☁ In your account (tap to download)" : "☁ Synced") : "On this device only"}</small><i><u style={{ width: `${Math.round((100 * l.pos) / Math.max(1, l.words))}%` }} /></i></button>{account && !l.cloud && l.local !== false && <button className="pc-save" onClick={() => saveToAccount(l.id)}>Save to account</button>}<button className="pc-x" onClick={() => setAsk({ kind: "remove", id: l.id, title: l.title, cloud: !!l.cloud })} aria-label={`Remove ${l.title}`}>✕</button></li>))}</ul>
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
      {overlay}
      {ask && (
        <div className="pc-modal pc-modal-lib" role="dialog" aria-label={ask.kind === "remove" ? "Remove book" : "Sign out"} onClick={() => setAsk(null)}>
          <div className="pc-card" onClick={(e) => e.stopPropagation()}>
            {ask.kind === "remove" ? (<><h2>Remove “{ask.title.slice(0, 40)}”?</h2><p className="mut">{ask.cloud ? "It is saved in your account, so you can get it back on this device any time." : "This book is only on this device. Removing it deletes it."}</p>
              <div className="pc-col"><button className="pc-btn pri" onClick={() => removeLocal(ask.id, false)}>{ask.cloud ? "Remove from this device" : "Remove it"}</button>{ask.cloud && <button className="pc-btn" onClick={() => removeLocal(ask.id, true)}>Delete from my account too</button>}<button className="pc-btn" onClick={() => setAsk(null)}>Cancel</button></div></>)
              : (<><h2>Sign out?</h2><p className="mut">Your books and progress stay safe in your account. On a shared device you can also clear the books from this device.</p><div className="pc-col"><button className="pc-btn pri" onClick={() => doSignOut(false)}>Sign out</button><button className="pc-btn" onClick={() => doSignOut(true)}>Sign out and clear this device</button><button className="pc-btn" onClick={() => setAsk(null)}>Cancel</button></div></>)}
          </div>
        </div>)}
    </div>
  );
}
