"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// Background music from YouTube links, using YouTube's official embedded player (IFrame API).
// The player stays visible (YouTube's rules do not allow hiding it or playing audio-only), as a small dock you can move to another corner.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Track } from "../../lib/pacer/audioStore";

export type MusicApi = { play: () => void; pause: () => void; next: () => void; prev: () => void };
let apiPromise: Promise<any> | null = null;
function loadYT(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject();
  const w = window as any; if (w.YT?.Player) return Promise.resolve(w.YT);
  if (!apiPromise) apiPromise = new Promise((res, rej) => {
    const prev = w.onYouTubeIframeAPIReady; w.onYouTubeIframeAPIReady = () => { prev?.(); res(w.YT); };
    const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.async = true; s.onerror = () => { apiPromise = null; rej(new Error("blocked")); }; document.head.appendChild(s);
    setTimeout(() => { if (!w.YT?.Player) { apiPromise = null; rej(new Error("timeout")); } }, 15000);
  });
  return apiPromise;
}

const MusicDock = forwardRef<MusicApi, { tracks: Track[]; idx: number; vol: number; corner: number; onIndex: (i: number) => void; onPlaying: (p: boolean) => void; onTitle: (i: number, t: string) => void; onCorner: () => void; onClose: () => void }>(function MusicDock({ tracks, idx, vol, corner, onIndex, onPlaying, onTitle, onCorner, onClose }, ref) {
  const host = useRef<HTMLDivElement>(null), player = useRef<any>(null), ready = useRef(false), want = useRef(false), cur = useRef({ tracks, idx, vol }); cur.current = { tracks, idx, vol };
  const cb = useRef({ onIndex, onPlaying, onTitle }); cb.current = { onIndex, onPlaying, onTitle };
  const [msg, setMsg] = useState<string | null>(null), [status, setStatus] = useState("Loading player…");
  const loaded = useRef(""), cuePlaylist = useRef(false);

  const loadCurrent = (autoplay: boolean) => {
    const p = player.current, { tracks: ts, idx: i } = cur.current, t = ts[i]; if (!p || !t) return; loaded.current = `${t.kind}:${t.id}`; setMsg(null);
    try { if (t.kind === "p") { cuePlaylist.current = true; (autoplay ? p.loadPlaylist : p.cuePlaylist).call(p, { list: t.id, listType: "playlist", index: 0 }); p.setLoop?.(true); } else { cuePlaylist.current = false; (autoplay ? p.loadVideoById : p.cueVideoById).call(p, t.id); } } catch { setMsg("Could not start that link."); }
  };
  const step = (d: number) => { const n = cur.current.tracks.length; if (n > 1) cb.current.onIndex((cur.current.idx + d + n) % n); else if (n === 1) { try { player.current?.seekTo(0); player.current?.playVideo(); } catch { /* */ } } };

  useImperativeHandle(ref, () => ({
    play: () => { want.current = true; if (ready.current) { try { player.current.setVolume(cur.current.vol); if (loaded.current !== `${cur.current.tracks[cur.current.idx]?.kind}:${cur.current.tracks[cur.current.idx]?.id}`) loadCurrent(true); else player.current.playVideo(); } catch { /* */ } } },
    pause: () => { want.current = false; try { player.current?.pauseVideo(); } catch { /* */ } },
    next: () => step(1), prev: () => step(-1),
  }));

  useEffect(() => {
    let dead = false;
    loadYT().then((YT) => {
      if (dead || !host.current) return; const el = document.createElement("div"); host.current.appendChild(el);
      player.current = new YT.Player(el, {
        host: "https://www.youtube-nocookie.com", width: "100%", height: "100%", playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 1, origin: location.origin },
        events: {
          onReady: () => { ready.current = true; setStatus(""); player.current.setVolume(cur.current.vol); loadCurrent(want.current); },
          onStateChange: (e: any) => {
            const s = e.data; if (s === 1) { cb.current.onPlaying(true); setMsg(null); try { const d = player.current.getVideoData?.(); const title = d?.title; if (title && !cuePlaylist.current) cb.current.onTitle(cur.current.idx, title); } catch { /* */ } } else if (s === 2 || s === -1) cb.current.onPlaying(false);
            if (s === 0 && !cuePlaylist.current) { cb.current.onPlaying(false); step(1); if (cur.current.tracks.length > 1) want.current = true; }
          },
          onError: (e: any) => { const c = e.data; setMsg(c === 101 || c === 150 ? "The owner of that video does not allow it to play here. Skipping." : c === 100 ? "That video was removed or is private. Skipping." : c === 2 ? "That link does not look right. Skipping." : "That video could not be played. Skipping."); cb.current.onPlaying(false); if (cur.current.tracks.length > 1) window.setTimeout(() => step(1), 1500); },
        },
      });
    }).catch(() => setStatus("Could not reach YouTube. Check your connection, or whether this network blocks youtube.com."));
    return () => { dead = true; try { player.current?.destroy(); } catch { /* */ } player.current = null; ready.current = false; };
  }, []);  
  useEffect(() => { if (ready.current) { try { player.current.setVolume(vol); } catch { /* */ } } }, [vol]);
  useEffect(() => { if (ready.current && `${tracks[idx]?.kind}:${tracks[idx]?.id}` !== loaded.current) loadCurrent(want.current); }, [tracks, idx]);  

  return (
    <div className="pc-dock" data-corner={corner} role="region" aria-label="Music player">
      <div className="pc-dockbar"><b>♪ {tracks[idx]?.title ? tracks[idx].title!.slice(0, 28) : "Music"}</b><button onClick={onCorner} aria-label="Move the player to another corner">⇄</button><button onClick={onClose} aria-label="Close the music player">✕</button></div>
      <div className="pc-dockvid" ref={host} />
      {(status || msg) && <p className="pc-dockmsg" role="status">{msg || status}</p>}
    </div>
  );
});
export default MusicDock;
