"use client";
// Telatro is hosted by its author and embedded here, so it costs us no storage. The iframe is only mounted after
// the player taps PLAY, so opening the arcade (or the hub card) never loads the game or slows the site down.
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import "./telatro.css";

export const TELATRO_URL = "https://telatro.tomcat.sh";

export default function Telatro() {
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setPlaying(true); setLoaded(false); setSlow(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSlow(true), 9000);
  }, []);
  const fullscreen = useCallback(() => {
    const el = stage.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null; if (!el) return;
    try { if (document.fullscreenElement) void document.exitFullscreen(); else if (el.requestFullscreen) void el.requestFullscreen(); else el.webkitRequestFullscreen?.(); } catch { /* not supported (e.g. iPhone): use Open in new tab */ }
  }, []);

  return (
    <div className="tl-root">
      <header className="tl-bar">
        <Link href="/arcade/solo" className="tl-btn">← ARCADE</Link>
        <b className="tl-title">TELATRO</b>
        <span className="tl-actions">
          <button className="tl-btn" onClick={fullscreen} aria-label="Toggle full screen">⛶ FULL</button>
          <a className="tl-btn" href={TELATRO_URL} target="_blank" rel="noopener noreferrer">OPEN IN NEW TAB ↗</a>
        </span>
      </header>
      <div className="tl-stage" ref={stage}>
        {!playing ? (
          <div className="tl-cover">
            <div className="tl-logo" aria-hidden>🃏</div>
            <h1>TELATRO</h1>
            <p>An unofficial fan port of Balatro by LocalThunk. The port asks that you own the original game. Tap to load it.</p>
            <button className="tl-play" onClick={start}>▶ PLAY</button>
            <small>Loads from telatro.tomcat.sh. Sound and saves are handled by the game itself.</small>
          </div>
        ) : (
          <>
            <iframe
              className="tl-frame" title="Telatro" src={TELATRO_URL} onLoad={() => { setLoaded(true); if (timer.current) clearTimeout(timer.current); }}
              allow="fullscreen; autoplay; gamepad; clipboard-write" allowFullScreen referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-forms allow-modals"
            />
            {!loaded && <div className="tl-loading" role="status">LOADING…</div>}
            {slow && (
              <div className="tl-help" role="alert">
                Not showing up? The game may refuse to be embedded or be offline.
                <a className="tl-btn" href={TELATRO_URL} target="_blank" rel="noopener noreferrer">OPEN IN NEW TAB ↗</a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
