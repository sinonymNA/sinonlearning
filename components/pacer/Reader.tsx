"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/refs */
// The reading room. Three ways to be paced at a speed you choose:
//   Focus  one word at a time with a fixed pivot letter (RSVP), optionally 2-3 words at once;
//   Pacer  your real page with a moving highlight that keeps you from drifting and rereading;
//   Scroll the page glides under a fixed reading line.
// The clock is real time (requestAnimationFrame), words get a little longer for long words and punctuation, and optional recall check-ins slow you down when you stop following.
import MusicDock, { type MusicApi } from "./MusicDock";
import Sound, { type VoiceOpt } from "./Sound";
import { createNarrator, pickVoices, rateFor } from "../../lib/pacer/voice.mjs";
import { loadAudio, saveAudio, type AudioPrefs } from "../../lib/pacer/audioStore";
import { memo, useDeferredValue, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tokenize, splitOrp, delayMs, chunkEnd, chunkText, buildFactorPrefix, timeLeftMs, sentenceStart, nextSentence, prevSentence, paragraphRange, rampWpm, adaptWpm, findMatches, sessionStats, paceLabel, MIN_WPM, MAX_WPM, HEAD, SENT } from "../../lib/pacer/engine.mjs";
import type { Book } from "../../lib/pacer/extract";
import type { Settings, Session } from "../../lib/pacer/store";
import Settings_ from "./ReaderSettings";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const fmtTime = (ms: number) => { const m = Math.round(ms / 60000); return m < 1 ? "under a minute" : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };

/** A paragraph of word spans. Memoised: highlighting happens by toggling a class on one span, never by re-rendering the page. */
const Para = memo(function Para({ words, from, to, head, cls }: { words: string[]; from: number; to: number; head: boolean; cls: string }) {
  const kids = []; for (let i = from; i < to; i++) kids.push(<span key={i} className="w" data-i={i}>{words[i]}</span>, " ");
  return head ? <h3 className={cls} data-p>{kids}</h3> : <p className={cls} data-p>{kids}</p>;
});

export default function Reader({ book, startPos, settings, onSettings, onExit, onProgress, onSession }: { book: Book; startPos: number; settings: Settings; onSettings: (s: Settings) => void; onExit: () => void; onProgress: (pos: number, wpm: number, force?: boolean) => void; onSession: (s: Session) => void }) {
  const flat = useMemo(() => {
    const paras: { text: string; kind: string }[] = [], chPara: number[] = []; for (const c of book.chapters) { chPara.push(paras.length); for (const p of c.paras) if (p.text.trim()) paras.push(p); }
    const doc = tokenize(paras), chWord = chPara.map((pi) => doc.paraStart[Math.min(pi, doc.paraStart.length - 1)] ?? 0); return { doc, chPara, chWord, paraCount: paras.length };
  }, [book]);
  const { doc, chWord } = flat, N = doc.words.length;
  const P = useMemo(() => buildFactorPrefix(doc, settings.smart), [doc, settings.smart]);
  const chapterOf = useCallback((i: number) => { let lo = 0, hi = chWord.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (chWord[m] <= i) lo = m; else hi = m - 1; } return lo; }, [chWord]);

  const S = useRef(settings); S.current = settings;
  const pos = useRef(clamp(startPos, 0, Math.max(0, N - 1))), playing = useRef(false), stats = useRef({ words: 0, active: 0, checks: [] as boolean[], sinceCheck: 0, streak: 0, ramped: 0 }), liveWpm = useRef(settings.wpm), saved = useRef(false);
  const [ui, setUi] = useState({ pos: pos.current, playing: false, wpm: settings.wpm, shown: "", si: pos.current, sj: pos.current + 1 });
  const [sw, setSw] = useState(() => (typeof window === "undefined" ? 1000 : window.innerWidth)), [ch, setCh] = useState(() => chapterOf(pos.current)), [drawer, setDrawer] = useState(false), [check, setCheck] = useState<null | { para: string; shown: boolean; note?: string }>(null), [done, setDone] = useState<null | ReturnType<typeof sessionStats>>(null), [help, setHelp] = useState(false), [find, setFind] = useState<null | { q: string }>(null), deferredQ = useDeferredValue(find?.q ?? "");
  const [audio, setAudioState] = useState<AudioPrefs>(() => loadAudio()), [sound, setSound] = useState(false), [musicOn, setMusicOn] = useState(false), [musicPlaying, setMusicPlaying] = useState(false), [corner, setCorner] = useState(0), [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]), [voiceErr, setVoiceErr] = useState<string | null>(null);
  const speechOk = typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
  const music = useRef<MusicApi>(null), narr = useRef<ReturnType<typeof createNarrator> | null>(null), picked = useRef<SpeechSynthesisVoice | null>(null), pendingPlay = useRef(false), audioRef = useRef(audio); audioRef.current = audio;
  const lang = typeof navigator !== "undefined" ? navigator.language || "en" : "en", ranked = useMemo(() => pickVoices(voices as any, lang), [voices, lang]);
  const voiceLive = useRef(false); voiceLive.current = audio.voiceOn && speechOk && ranked.length > 0;
  const setAudio = useCallback((fn: (a: AudioPrefs) => AudioPrefs) => setAudioState((a) => { const n = fn(a); saveAudio(n); return n; }), []);
  const scroller = useRef<HTMLDivElement>(null), page = useRef<HTMLDivElement>(null), spans = useRef<HTMLElement[]>([]), curEl = useRef<HTMLElement | null>(null), curPara = useRef<HTMLElement | null>(null), scrollTarget = useRef<number | null>(null);
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const effWpm = () => (S.current.ramp ? rampWpm({ start: S.current.wpm, max: S.current.rampMax, step: 10, every: 100 }, stats.current.ramped) : S.current.wpm) * (liveWpm.current / S.current.wpm || 1);
  const curWpm = () => clamp(Math.round(S.current.ramp ? effWpm() : liveWpm.current), MIN_WPM, MAX_WPM);
  const delayAt = (i: number, j: number) => { let d = 0; for (let k = i; k < j; k++) d += delayMs(doc, k, curWpm(), S.current.smart); return d; };

  // ---- show a position: highlight (pacer, scroll) or the word (focus)
  const showPos = useCallback((i: number, hard = false) => {
    pos.current = i; const base = chWord[chapterOf(i)] ?? 0, el = spans.current[i - base] || null;
    if (el !== curEl.current) { curEl.current?.classList.remove("cur"); el?.classList.add("cur"); curEl.current = el; if (S.current.dim) { const p = el?.closest("[data-p]") as HTMLElement | null; if (p !== curPara.current) { curPara.current?.classList.remove("cp"); p?.classList.add("cp"); curPara.current = p; } } }
    if (hard && el && scroller.current) { const sc = scroller.current, y = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop; scrollTarget.current = Math.max(0, y - sc.clientHeight * 0.38); if (reduce || S.current.mode === "pacer") sc.scrollTop = scrollTarget.current; }
  }, [chWord, chapterOf, reduce]);
  const refreshUi = useCallback((extra: any = {}) => setUi((u) => ({ ...u, pos: pos.current, playing: playing.current, wpm: curWpm(), ...extra })), []); // eslint-disable-line react-hooks/exhaustive-deps
  const setFocusWord = useCallback((i: number) => { const j = chunkEnd(doc, i, S.current.chunk), s = chunkText(doc, i, j); setUi((u) => ({ ...u, shown: s, si: i, sj: j, pos: i })); return j; }, [doc]);

  const goTo = useCallback((i: number) => { const t = clamp(i, 0, N - 1); const c = chapterOf(t); if (c !== ch) setCh(c); pos.current = t; if (S.current.mode === "focus") setFocusWord(t); else requestAnimationFrame(() => showPos(t, true)); refreshUi({ pos: t }); if (playing.current && voiceLive.current) narr.current?.start(t); }, [N, chapterOf, ch, setFocusWord, showPos, refreshUi]);

  const finish = useCallback((reason: "end" | "exit") => {
    playing.current = false; const st = stats.current, r = sessionStats({ words: st.words, activeMs: st.active, checks: st.checks as any });
    if (!saved.current && st.words >= 30) { saved.current = true; onSession({ t: Date.now(), title: book.title, words: r.words, wpm: r.wpm, recall: r.recall, minutes: r.minutes }); }
    onProgress(reason === "end" ? 0 : pos.current, S.current.wpm, true); if (reason === "end") { setDone(r); refreshUi({ playing: false }); }
  }, [book.title, onProgress, onSession, refreshUi]);

  // ---- the clock
  useEffect(() => {
    let raf = 0, last = performance.now(), acc = 0, delay = 400;
    const startDelay = () => { const i = pos.current, j = S.current.mode === "focus" ? chunkEnd(doc, i, S.current.chunk) : i + 1; delay = delayAt(i, j); };
    startDelay();
    const step = () => {
      const i = pos.current, focus = S.current.mode === "focus", j = focus ? chunkEnd(doc, i, S.current.chunk) : i + 1; stats.current.words += j - i; stats.current.sinceCheck += j - i; stats.current.ramped += j - i;
      const nxt = j; if (nxt >= N) { finish("end"); return; }
      const c = chapterOf(nxt); if (c !== chapterOf(i)) setCh(c);
      const iv = S.current.checks; if (iv && stats.current.sinceCheck >= iv && (doc.flags[j - 1] & SENT)) { playing.current = false; const r = paragraphRange(doc, i); setCheck({ para: doc.words.slice(Math.max(r.a, i - 90), j).join(" "), shown: false }); pos.current = nxt; refreshUi({ playing: false }); if (focus) setFocusWord(nxt); else showPos(nxt); return; }
      pos.current = nxt; if (focus) setFocusWord(nxt); else showPos(nxt); startDelay();
    };
    const loop = (now: number) => {
      const dt = Math.min(200, now - last); last = now;
      if (playing.current && !document.hidden) {
        stats.current.active += dt; if (voiceLive.current) acc = 0; else { acc += dt; let g = 0; while (playing.current && acc >= delay && g++ < 6) { acc -= delay; step(); } }
        if (S.current.mode !== "focus" && scroller.current && curEl.current) { // glide the page so the current word stays on the reading line
          const sc = scroller.current, e = curEl.current, nx = spans.current[pos.current + 1 - (chWord[chapterOf(pos.current)] ?? 0)] as HTMLElement | undefined, top = sc.getBoundingClientRect().top, y0 = e.getBoundingClientRect().top - top + sc.scrollTop, y1 = nx ? nx.getBoundingClientRect().top - top + sc.scrollTop : y0, f = Math.min(1, acc / Math.max(1, delay)), y = y0 + (y1 - y0) * f * f * (3 - 2 * f);
          if (S.current.mode === "scroll" && !reduce) { const want = y - sc.clientHeight * 0.38, k = 1 - Math.exp(-dt / 180); sc.scrollTop += (want - sc.scrollTop) * k; }
          else { const rel = y0 - sc.scrollTop; if (rel > sc.clientHeight * 0.7 || rel < sc.clientHeight * 0.12 || reduce) { scrollTarget.current = y0 - sc.clientHeight * 0.3; } if (scrollTarget.current !== null) { const d = scrollTarget.current - sc.scrollTop; if (Math.abs(d) < 2 || reduce) { sc.scrollTop = scrollTarget.current; scrollTarget.current = null; } else sc.scrollTop += d * (1 - Math.exp(-dt / 160)); } }
        }
      } else if (!playing.current) { acc = 0; startDelay(); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); const t = window.setInterval(() => { if (playing.current) refreshUi(); }, 300);
    const vis = () => { if (document.hidden && playing.current) { playing.current = false; refreshUi({ playing: false }); } }; document.addEventListener("visibilitychange", vis);
    return () => { cancelAnimationFrame(raf); clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [doc, N, chWord, chapterOf, finish, refreshUi, setFocusWord, showPos, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- read aloud: the voice is the clock while it is on
  useEffect(() => {
    if (!speechOk) return; const syn = window.speechSynthesis, load = () => setVoices(syn.getVoices()); load(); syn.addEventListener?.("voiceschanged", load); return () => syn.removeEventListener?.("voiceschanged", load);
  }, [speechOk]);
  useEffect(() => { picked.current = (audio.voiceName ? voices.find((v) => v.name === audio.voiceName) : null) || (ranked[0]?.voice as SpeechSynthesisVoice | undefined) || null; }, [voices, ranked, audio.voiceName]);
  useEffect(() => {
    if (!speechOk) return;
    const n = createNarrator({
      synth: window.speechSynthesis, Utt: window.SpeechSynthesisUtterance as any, doc, getRate: () => rateFor(curWpm()), getVoice: () => picked.current,
      onWord: (i: number) => { const prev = pos.current, st = stats.current; if (i > prev) { const d = i - prev; st.words += d; st.sinceCheck += d; st.ramped += d; } const c = chapterOf(i); if (c !== chapterOf(prev)) setCh(c); pos.current = i; if (S.current.mode === "focus") setFocusWord(i); else showPos(i); },
      onSegmentEnd: (j: number) => { const iv = S.current.checks; if (iv && stats.current.sinceCheck >= iv && (doc.flags[j - 1] & SENT)) { playing.current = false; const r = paragraphRange(doc, j - 1); setCheck({ para: doc.words.slice(Math.max(r.a, j - 90), j).join(" "), shown: false }); pos.current = j; if (S.current.mode === "focus") setFocusWord(j); refreshUi({ playing: false }); return false; } return true; },
      onEnd: () => finish("end"),
      onError: (e?: string) => { playing.current = false; refreshUi({ playing: false }); setVoiceErr(e === "not-allowed" ? "Your browser blocked the voice. Tap play again." : "The voice stopped working. Try another voice in Sound."); },
    });
    narr.current = n; return () => { n.stop(); narr.current = null; };
  }, [doc, speechOk]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const n = narr.current; if (!n) return; if (ui.playing && voiceLive.current) { setVoiceErr(null); n.start(pos.current); } else n.stop(); }, [ui.playing, audio.voiceOn, audio.voiceName, ranked.length]);  
  useEffect(() => { if (!ui.playing || !voiceLive.current) return; const t = window.setTimeout(() => narr.current?.start(pos.current), 450); return () => clearTimeout(t); }, [settings.wpm]); // eslint-disable-line react-hooks/exhaustive-deps
  // ---- background music follows reading
  useEffect(() => { if (!musicOn) return; if (pendingPlay.current && music.current) { pendingPlay.current = false; music.current.play(); } }, [musicOn]);
  useEffect(() => { if (!audioRef.current.follow || !musicOn) return; if (ui.playing) music.current?.play(); else music.current?.pause(); }, [ui.playing]); // eslint-disable-line react-hooks/exhaustive-deps
  const onMusic = (cmd: "play" | "pause" | "next" | "prev" | "open") => {
    if (!audioRef.current.tracks.length) return;
    if (!musicOn) { setMusicOn(true); if (cmd === "play" || cmd === "open") pendingPlay.current = true; return; }
    if (cmd === "play") music.current?.play(); else if (cmd === "pause") music.current?.pause(); else if (cmd === "next") music.current?.next(); else if (cmd === "prev") music.current?.prev();
  };
  const tryVoice = () => { if (!speechOk) return; const syn = window.speechSynthesis; syn.cancel(); const u = new window.SpeechSynthesisUtterance("This is how I will read your book. Pick the voice that is easiest to follow."); if (picked.current) { u.voice = picked.current; u.lang = picked.current.lang; } u.rate = rateFor(S.current.wpm); syn.speak(u); };

  // ---- after a chapter (or mode) change the spans are new: collect them and put the highlight back
  useEffect(() => {
    spans.current = page.current ? Array.from(page.current.querySelectorAll<HTMLElement>("[data-i]")) : []; curEl.current = null; curPara.current = null;
    if (settings.mode !== "focus") { showPos(pos.current, true); } else setFocusWord(pos.current);
  }, [ch, settings.mode, settings.size, settings.font, settings.width, settings.dim]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (settings.mode === "focus") setFocusWord(pos.current); }, [settings.chunk]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!playing.current) refreshUi({ wpm: settings.wpm }); liveWpm.current = settings.wpm; }, [settings.wpm]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const sv = window.setInterval(() => onProgress(pos.current, S.current.wpm), 4000), leave = () => onProgress(pos.current, S.current.wpm, true); window.addEventListener("pagehide", leave); return () => { clearInterval(sv); window.removeEventListener("pagehide", leave); leave(); }; }, [onProgress]);

  useEffect(() => { const f = () => setSw(window.innerWidth); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  // ---- controls
  const toggle = useCallback(() => { if (check || done) return; if (!playing.current && pos.current >= N - 1) goTo(0); playing.current = !playing.current; if (playing.current) { saved.current = false; if (voiceLive.current) narr.current?.prime(); const a = audioRef.current; if (a.follow && a.tracks.length) { if (!musicOn) { setMusicOn(true); pendingPlay.current = true; } else music.current?.play(); } } refreshUi({ playing: playing.current }); }, [check, done, N, goTo, refreshUi, musicOn]);
  const setWpm = useCallback((w: number) => { const v = clamp(Math.round(w), MIN_WPM, MAX_WPM); liveWpm.current = v; onSettings({ ...S.current, wpm: v }); }, [onSettings]);
  const openFind = () => { if (playing.current) { playing.current = false; refreshUi({ playing: false }); } setFind({ q: "" }); };
  const found = useMemo(() => findMatches(doc, deferredQ), [doc, deferredQ]);
  const goFound = (i: number) => { setFind(null); goTo(i); };
  const nextHit = found.hits.findIndex((h) => h >= pos.current);
  const back = () => goTo(prevSentence(doc, pos.current)), fwd = () => goTo(nextSentence(doc, pos.current));
  const setMode = (m: Settings["mode"]) => { const was = playing.current; playing.current = false; onSettings({ ...S.current, mode: m }); window.setTimeout(() => { if (was) { playing.current = true; refreshUi({ playing: true }); } }, 60); };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; if (/INPUT|SELECT|TEXTAREA/.test(t?.tagName) && (t as HTMLInputElement).type !== "range" && e.key !== "Escape") return; if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key; if (find) { if (k === "Escape") { e.preventDefault(); setFind(null); } return; } if (k === " " || k === "k") { if (t?.tagName === "BUTTON") return; e.preventDefault(); toggle(); } else if (k === "ArrowUp") { e.preventDefault(); setWpm(S.current.wpm + (e.shiftKey ? 50 : 10)); } else if (k === "ArrowDown") { e.preventDefault(); setWpm(S.current.wpm - (e.shiftKey ? 50 : 10)); }
      else if (k === "ArrowLeft") { e.preventDefault(); goTo(prevSentence(doc, pos.current)); } else if (k === "ArrowRight") { e.preventDefault(); goTo(nextSentence(doc, pos.current)); } else if (k === "1") setMode("focus"); else if (k === "2") setMode("pacer"); else if (k === "3") setMode("scroll");
      else if (k === "[") goTo(chWord[Math.max(0, chapterOf(pos.current) - 1)]); else if (k === "]") goTo(chWord[Math.min(chWord.length - 1, chapterOf(pos.current) + 1)]); else if (k === "/" || k === "f") { e.preventDefault(); openFind(); } else if (k === "Escape") { if (find) setFind(null); else if (drawer) setDrawer(false); else if (playing.current) toggle(); } else if (k === "?") setHelp((h) => !h);
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  });

  // ---- recall check-ins
  const answer = (hit: boolean) => {
    const st = stats.current; st.checks.push(hit); st.sinceCheck = 0; const a = adaptWpm(liveWpm.current, hit, st.streak, S.current.ramp ? S.current.rampMax : MAX_WPM); st.streak = a.streak; const before = liveWpm.current; liveWpm.current = a.wpm; onSettings({ ...S.current, wpm: a.wpm });
    const r = paragraphRange(doc, Math.max(0, pos.current - 1)); const note = hit ? (a.wpm > before ? `Nice. Speeding up to ${a.wpm} wpm.` : "Good. Keep going.") : `No problem. Slowing to ${a.wpm} wpm and going back a little.`;
    setCheck(null); if (!hit) goTo(Math.max(r.a, pos.current - 70)); setUi((u) => ({ ...u })); window.setTimeout(() => { playing.current = true; refreshUi({ playing: true }); }, 250); void note;
  };

  const doneFrac = N > 1 ? pos.current / (N - 1) : 0, left = timeLeftMs(P, pos.current, curWpm());
  const paraRange = useMemo(() => { const a = flat.chPara[ch], b = ch + 1 < flat.chPara.length ? flat.chPara[ch + 1] : flat.paraCount; return { a, b }; }, [flat, ch]);
  const paras = useMemo(() => { const out = []; for (let p = paraRange.a; p < paraRange.b; p++) { const from = doc.paraStart[p], to = p + 1 < doc.paraStart.length ? doc.paraStart[p + 1] : N; out.push(<Para key={p} words={doc.words} from={from} to={to} head={!!(doc.flags[from] & HEAD)} cls="" />); } return out; }, [paraRange, doc, N]);
  const [l, p, r] = splitOrp(ui.shown.includes(" ") ? ui.shown : ui.shown); const multi = ui.shown.includes(" "), mid = multi ? Math.floor(ui.shown.length / 2) : -1; const [ml, mp, mr] = multi ? [ui.shown.slice(0, mid), ui.shown[mid], ui.shown.slice(mid + 1)] : [l, p, r];
  const ctxStart = sentenceStart(doc, ui.si), ctxEnd = Math.min(N, nextSentence(doc, ui.si) === ui.si ? N : nextSentence(doc, ui.si));
  const ctx = useMemo(() => (settings.mode === "focus" ? doc.words.slice(ctxStart, Math.min(ctxEnd, ctxStart + 40)).map((w: string, k: number) => <span key={k} className={ctxStart + k >= ui.si && ctxStart + k < ui.sj ? "cur" : ""}>{w} </span>) : null), [settings.mode, doc, ctxStart, ctxEnd, ui.si, ui.sj]);
  const reading = !ui.playing && ui.pos === 0 && stats.current.words === 0;
  const widthVar = { narrow: "28rem", medium: "36rem", wide: "48rem" }[settings.width];

  return (
    <div className={`pc-root pc-reader pc-${settings.font}`} data-theme={settings.theme} role="application" aria-label={`Reading ${book.title}`}>
      <header className="pc-top">
        <button className="pc-btn round" onClick={() => { finish("exit"); onExit(); }} aria-label="Back to the library">←</button>
        <div className="pc-title"><b>{book.title}</b><small>{book.chapters[ch]?.title && book.chapters[ch].title !== book.title ? book.chapters[ch].title : (book.author || "")}</small></div>
        {book.chapters.length > 1 && <select className="pc-select" value={ch} onChange={(e) => goTo(chWord[+e.target.value])} aria-label="Chapter">{book.chapters.map((c, i) => <option key={i} value={i}>{c.title.slice(0, 40)}</option>)}</select>}
        <button className={`pc-btn round${audio.voiceOn || musicPlaying ? " on" : ""}`} onClick={() => setSound(true)} aria-label="Sound: read aloud and music">♪</button>
        <button className="pc-btn round" onClick={openFind} aria-label="Find a word or phrase">⌕</button>
        <button className="pc-btn round" onClick={() => setHelp(true)} aria-label="Help and shortcuts">?</button>
        <button className="pc-btn round" onClick={() => setDrawer((d) => !d)} aria-label="Settings" aria-expanded={drawer}>⚙</button>
      </header>

      <main className="pc-stage" data-mode={settings.mode}>
        {settings.mode === "focus" ? (
          <div className="pc-rsvp" style={{ ["--rs" as any]: `${Math.round(Math.max(20, Math.min(settings.size * 2.3, ((sw - 24) / 2) / (Math.max(ml.length, mr.length, 4) * 0.6))))}px` }}>
            {reading ? <div className="pc-ready" style={{ gridRow: 2 }}><b>Ready.</b><br />Press play or Space. Your eyes stay on the red letter.</div> : (
              <div className="pc-word" aria-hidden><span className="l">{ml}</span><span className="p">{mp}</span><span className="r">{mr}</span></div>)}
            <div className="pc-ctx" aria-hidden>{ctx}</div>
          </div>
        ) : (
          <>
            <div className="pc-scroll" ref={scroller} onWheel={() => { scrollTarget.current = null; }} onTouchMove={() => { scrollTarget.current = null; }}>
              <div className="pc-page" ref={page} data-dim={settings.dim ? 1 : 0} style={{ ["--fs" as any]: `${settings.size}px`, ["--w" as any]: widthVar }} onClick={(e) => { const t = (e.target as HTMLElement).closest("[data-i]") as HTMLElement | null; if (t) goTo(+(t.dataset.i || 0)); }}>{paras}</div>
            </div>
            <div className="pc-fade t" /><div className="pc-fade b" /><div className="pc-line" style={{ top: "38%" }} aria-hidden />
          </>
        )}
        {settings.mode === "focus" && <div ref={page} hidden />}
        {drawer && <Settings_ s={settings} set={(n) => onSettings(n)} close={() => setDrawer(false)} />}
        {check && (
          <div className="pc-modal" role="dialog" aria-label="Quick check">
            <div className="pc-card">
              <h2>Quick check</h2><p>Without looking, retell the last part in your own words. Say it out loud or in your head.</p>
              {check.shown && <p className="mut" style={{ fontStyle: "italic", borderLeft: "3px solid var(--acc)", paddingLeft: 10 }}>{check.para}</p>}
              <div className="pc-row" style={{ justifyContent: "flex-start", marginTop: 10 }}>
                {!check.shown && <button className="pc-btn" onClick={() => setCheck({ ...check, shown: true })}>Show me the text</button>}
                <button className="pc-btn pri" onClick={() => answer(true)}>Got it</button><button className="pc-btn" onClick={() => answer(false)}>Missed it</button>
              </div>
              <p className="mut" style={{ fontSize: ".8rem" }}>Honest answers make Pacer fit you. A miss slows you down a little and rewinds; three clean checks speed you up.</p>
            </div>
          </div>)}
        {done && (
          <div className="pc-modal" role="dialog" aria-label="Session summary">
            <div className="pc-card"><h2>Nice reading</h2><p className="mut">You reached the end of {book.title}.</p>
              <p><b style={{ fontSize: "1.6rem" }}>{done.wpm || "–"}</b> words per minute over {done.minutes} min ({done.words.toLocaleString()} words){done.recall !== null ? `. You recalled ${done.recall}% of your check-ins.` : "."}</p>
              <div className="pc-row" style={{ justifyContent: "flex-start" }}><button className="pc-btn" onClick={() => { setDone(null); stats.current = { words: 0, active: 0, checks: [], sinceCheck: 0, streak: 0, ramped: 0 }; goTo(0); }}>Read again</button><button className="pc-btn pri" onClick={onExit}>Back to the library</button></div>
            </div>
          </div>)}
        {sound && <Sound audio={audio} setAudio={setAudio} voices={ranked.map((r: any) => ({ name: r.voice.name, label: r.label, lang: r.voice.lang }) as VoiceOpt)} speechOk={speechOk} wpm={settings.wpm} musicPlaying={musicPlaying} onMusic={onMusic} onTry={tryVoice} close={() => setSound(false)} />}
        {voiceErr && <p className="pc-err" role="alert" style={{ position: "absolute", left: 12, right: 12, bottom: 8, zIndex: 15, margin: 0 }}>{voiceErr}</p>}
        {musicOn && audio.tracks.length > 0 && <MusicDock ref={music} tracks={audio.tracks} idx={audio.idx} vol={audio.vol} corner={corner} onIndex={(i) => setAudio((a) => ({ ...a, idx: i }))} onPlaying={setMusicPlaying} onTitle={(i, t) => setAudio((a) => (a.tracks[i] && a.tracks[i].title !== t ? { ...a, tracks: a.tracks.map((x, k) => (k === i ? { ...x, title: t } : x)) } : a))} onCorner={() => setCorner((c) => (c + 1) % 4)} onClose={() => { setMusicOn(false); setMusicPlaying(false); }} />}
        {find && (
          <div className="pc-modal pc-find" role="dialog" aria-label="Find in the book" onClick={() => setFind(null)}>
            <div className="pc-card" onClick={(e) => e.stopPropagation()}>
              <h2>Find your spot</h2>
              <p className="mut" style={{ margin: "0 0 8px" }}>Type a word or a few words you remember. Tap a result to jump there.</p>
              <input className="pc-input" autoFocus value={find.q} onChange={(e) => setFind({ q: e.target.value })} placeholder="e.g. lantern or the old bridge" aria-label="Words to find" enterKeyHint="search"
                onKeyDown={(e) => { if (e.key === "Enter" && found.hits.length) goFound(found.hits[nextHit >= 0 ? nextHit : 0]); }} />
              <p className="pc-fcount" role="status">{!deferredQ.trim() ? "" : found.total === 0 ? "No matches. Try fewer or different words." : `${found.total.toLocaleString()} match${found.total === 1 ? "" : "es"}${found.capped ? ` (showing the first ${found.hits.length}; add more words to narrow it)` : ""}. Enter jumps to the next one after your spot.`}</p>
              <ul className="pc-fres">{found.hits.map((h, k) => {
                const a = Math.max(0, h - 7), b = Math.min(N, h + found.len + 9), c = chapterOf(h), t = book.chapters[c]?.title;
                return (<li key={h}><button className={k === nextHit ? "next" : ""} onClick={() => goFound(h)}>
                  <small>{t && t !== book.title ? `${t.slice(0, 40)} · ` : ""}{Math.round((100 * h) / Math.max(1, N - 1))}% in{k === nextHit ? " · next after your spot" : ""}</small>
                  <span>{a > 0 ? "… " : ""}{doc.words.slice(a, h).join(" ")} <mark>{doc.words.slice(h, h + found.len).join(" ")}</mark> {doc.words.slice(h + found.len, b).join(" ")}{b < N ? " …" : ""}</span></button></li>);
              })}</ul>
              <button className="pc-btn" onClick={() => setFind(null)}>Close</button>
            </div>
          </div>)}
        {help && (
          <div className="pc-modal" role="dialog" aria-label="Help" onClick={() => setHelp(false)}>
            <div className="pc-card" onClick={(e) => e.stopPropagation()}><h2>How to use Pacer</h2>
              <p><b>Focus</b> shows one word at a time; keep your eyes on the red letter. <b>Pacer</b> highlights each word on your real page. <b>Scroll</b> glides the page past a reading line.</p>
              <p className="mut">Choose a speed where you can still retell what you read. Turn on check-ins in settings to let Pacer tune the speed for you. Focus mode flashes words quickly; stop if it bothers your eyes.</p>
              <p style={{ fontSize: ".9rem", lineHeight: 1.7 }}><b>/</b> or <b>F</b> find a word · <b>♪</b> read aloud and music · <b>Space</b> play or pause · <b>↑ ↓</b> speed (Shift for ±50) · <b>← →</b> sentence back or forward · <b>1 2 3</b> mode · <b>[ ]</b> chapter · <b>Esc</b> pause · click any word to jump there</p>
              <button className="pc-btn pri" onClick={() => setHelp(false)}>Got it</button></div>
          </div>)}
      </main>

      <footer className="pc-bar">
        <div className="pc-row">
          <button className="pc-btn round" onClick={back} aria-label="Back one sentence">⏮</button>
          <button className="pc-btn big pri" onClick={toggle} aria-label={ui.playing ? "Pause" : "Play"}>{ui.playing ? "❚❚" : "▶"}</button>
          <button className="pc-btn round" onClick={fwd} aria-label="Forward one sentence">⏭</button>
          <div className="pc-speed"><button className="pc-btn round" onClick={() => setWpm(settings.wpm - 10)} aria-label="Slower">−</button><div className="pc-wpm" aria-live="polite"><b>{ui.wpm}</b><small>WORDS/MIN</small></div><button className="pc-btn round" onClick={() => setWpm(settings.wpm + 10)} aria-label="Faster">+</button></div>
        </div>
        <div className="pc-row"><div className="pc-chips" role="group" aria-label="Speed presets">{[150, 250, 350, 500].map((w) => <button key={w} className={settings.wpm === w ? "on" : ""} onClick={() => setWpm(w)}>{w}</button>)}</div>
          <div className="pc-tabs" role="tablist" aria-label="Mode">{(["focus", "pacer", "scroll"] as const).map((m, i) => <button key={m} role="tab" aria-selected={settings.mode === m} onClick={() => setMode(m)}>{["Focus", "Pacer", "Scroll"][i]}</button>)}</div></div>
        <input className="pc-scrub" type="range" min={0} max={Math.max(1, N - 1)} value={ui.pos} onChange={(e) => goTo(+e.target.value)} aria-label="Position in the book" />
        <div className="pc-meta"><span>{Math.round(doneFrac * 100)}% · {paceLabel(ui.wpm)}</span><span>{fmtTime(left)} left</span></div>
      </footer>
    </div>
  );
}
