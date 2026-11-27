// The running interval walk. One shared session, so the Pacer reader and the walk screens show the same thing.
// The cue tones are one long audio file played through an <audio> element: its clock is the session clock, pausing pauses it, and the tones keep
// sounding when the screen locks (browsers keep playing real audio). Everything else (the banner, buzzing, lock screen title) is driven from that clock.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSyncExternalStore } from "react";
import { buildPhases, buildCueTrack, wav8, phaseAt, phaseStart, splitUpTo, totalSec, sanitizePlan, LEAD_SEC } from "./walk.mjs";

export type Plan = { intervalMin: number; intervalSec: number; sets: number; first: "slow" | "fast" };
export type Phase = { lead: boolean; leadLeft: number; index: number; kind: "slow" | "fast" | "done"; set: number; sets: number; into: number; left: number; total: number; remaining: number; done: boolean };
export type Snap = { status: "idle" | "running" | "paused" | "finished"; phase: Phase | null; plan: Plan | null; startedAt: number; key: string };
export type WalkResult = { startedAt: number; slowSec: number; fastSec: number; totalSec: number; completed: boolean };

const IDLE: Snap = { status: "idle", phase: null, plan: null, startedAt: 0, key: "idle" };
let snap: Snap = IDLE; const subs = new Set<() => void>();
let audio: HTMLAudioElement | null = null, url: string | null = null, phases: any[] = [], plan: Plan | null = null, startedAt = 0, poll: ReturnType<typeof setInterval> | null = null, lastIndex = -2, wake: any = null, finished = false, lastSave = 0, vibrate = true;
const ACTIVE = "walk:active";
const emit = () => subs.forEach((f) => f());

function compute(): Snap {
  if (!audio || !plan) return IDLE; const t = audio.currentTime - LEAD_SEC, ph = phaseAt(phases, t) as Phase;
  const status = finished ? "finished" : audio.paused ? "paused" : "running", key = `${status}|${ph.index}|${ph.left}|${ph.remaining}|${ph.leadLeft}`;
  return snap.key === key ? snap : { status, phase: ph, plan, startedAt, key };
}
function refresh() {
  const n = compute(); if (n === snap) return;
  if (n.phase && n.phase.index !== lastIndex) { lastIndex = n.phase.index; onPhase(n.phase); }
  snap = n; emit();
  if (audio && !finished && Date.now() - lastSave > 5000) { lastSave = Date.now(); try { localStorage.setItem(ACTIVE, JSON.stringify({ plan, startedAt, at: Math.max(0, audio.currentTime), ts: Date.now() })); } catch { /* storage full */ } }
}
function onPhase(p: Phase) {
  if (p.lead || p.done) { if (p.done) { try { navigator.vibrate?.([300, 120, 300, 120, 300]); } catch { /* */ } } return; }
  if (vibrate) { try { navigator.vibrate?.(p.kind === "fast" ? [200, 80, 200, 80, 200] : [500]); } catch { /* */ } }
  try { const ms = (navigator as any).mediaSession; if (ms && typeof MediaMetadata !== "undefined") ms.metadata = new MediaMetadata({ title: p.kind === "fast" ? "FAST walk" : "SLOW walk", artist: `Round ${p.set} of ${p.sets}`, album: "Pacer Walk" }); } catch { /* */ }
}
async function lockScreenOn() { try { if ("wakeLock" in navigator && !wake) { wake = await (navigator as any).wakeLock.request("screen"); wake.addEventListener?.("release", () => { wake = null; }); } } catch { wake = null; } }
const onVis = () => { if (document.visibilityState === "visible" && audio && !finished) { void lockScreenOn(); refresh(); } };

export const walk = {
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
  getSnapshot: () => snap,
  getServerSnapshot: () => IDLE,
  /** Start (or restart at `resumeAt` seconds into the track). Call inside a tap or click so the browser lets sound play. Resolves false if the browser refused. */
  async start(opts: { plan: Partial<Plan> & { intervalSec?: number }; resumeAt?: number; startedAt?: number; loud?: boolean; keepAwake?: boolean; buzz?: boolean }): Promise<boolean> {
    walk.reset(); plan = sanitizePlan(opts.plan) as Plan; phases = buildPhases(plan); vibrate = opts.buzz !== false; finished = false; lastIndex = -2; lastSave = 0;
    const wav = wav8(buildCueTrack(phases, { amp: opts.loud ? 0.9 : 0.6 })); url = URL.createObjectURL(new Blob([wav as any], { type: "audio/wav" })); const a = new Audio(url); audio = a; a.preload = "auto"; startedAt = opts.startedAt ?? Date.now();
    try { (navigator as any).audioSession && ((navigator as any).audioSession.type = "playback"); } catch { /* not supported */ }
    a.onended = () => { finished = true; refresh(); }; a.onpause = refresh; a.onplay = refresh; a.ontimeupdate = refresh;
    if (opts.resumeAt) { const at = opts.resumeAt, set = () => { try { a.currentTime = at; } catch { /* */ } }; if (a.readyState >= 1) set(); else a.addEventListener("loadedmetadata", set, { once: true }); }
    try { await a.play(); } catch { walk.reset(); return false; }
    poll = setInterval(refresh, 250); document.addEventListener("visibilitychange", onVis); if (opts.keepAwake !== false) void lockScreenOn();
    try { const ms = (navigator as any).mediaSession; if (ms) { ms.setActionHandler?.("play", () => walk.resume()); ms.setActionHandler?.("pause", () => walk.pause()); ms.setActionHandler?.("nexttrack", () => walk.skip()); } } catch { /* */ }
    refresh(); return true;
  },
  /** For tests and debugging only. */
  debug: () => (audio ? { paused: audio.paused, readyState: audio.readyState, networkState: audio.networkState, error: audio.error?.code ?? null, t: audio.currentTime, ended: audio.ended, finished } : null),
  pause() { audio?.pause(); refresh(); },
  resume() { if (audio && !finished) void audio.play().catch(() => {}); refresh(); },
  /** Jump to the start of the next block (or finish if this is the last one). */
  skip() { if (!audio || !plan) return; const p = phaseAt(phases, audio.currentTime - LEAD_SEC) as Phase; const next = p.lead ? 0 : p.index + 1; if (next >= phases.length) { audio.currentTime = LEAD_SEC + totalSec(phases) - 0.01; return; } audio.currentTime = LEAD_SEC + phaseStart(phases, next); refresh(); },
  /** Stop and return what was done. */
  end(): WalkResult | null {
    if (!audio || !plan) return null; const t = Math.max(0, Math.min(totalSec(phases), audio.currentTime - LEAD_SEC)), split = splitUpTo(phases, t);
    const r: WalkResult = { startedAt, slowSec: split.slowSec, fastSec: split.fastSec, totalSec: split.slowSec + split.fastSec, completed: finished || t >= totalSec(phases) - 2 }; walk.reset(); return r;
  },
  reset() {
    if (poll) { clearInterval(poll); poll = null; } document.removeEventListener("visibilitychange", onVis);
    if (audio) { audio.onended = audio.onpause = audio.onplay = audio.ontimeupdate = null; try { audio.pause(); } catch { /* */ } audio.removeAttribute("src"); audio.load?.(); audio = null; } if (url) { URL.revokeObjectURL(url); url = null; }
    try { wake?.release?.(); } catch { /* */ } wake = null; finished = false; lastIndex = -2; try { localStorage.removeItem(ACTIVE); } catch { /* */ }
    try { const ms = (navigator as any).mediaSession; if (ms) { ms.metadata = null; ["play", "pause", "nexttrack"].forEach((a) => ms.setActionHandler?.(a, null)); } } catch { /* */ }
    if (snap !== IDLE) { snap = IDLE; emit(); }
  },
};
/** A session that was running when the page was closed or killed (less than 6 hours ago), so it can be picked up again. */
export function loadActiveWalk(): { plan: Plan; startedAt: number; at: number } | null {
  try { const j = JSON.parse(localStorage.getItem(ACTIVE) || "null"); if (!j || Date.now() - j.ts > 6 * 3600e3 || !(j.at > 5)) return null; return { plan: sanitizePlan(j.plan) as Plan, startedAt: Number(j.startedAt) || Date.now(), at: Number(j.at) }; } catch { return null; }
}
export const clearActiveWalk = () => { try { localStorage.removeItem(ACTIVE); } catch { /* */ } };
export const useWalk = (): Snap => useSyncExternalStore(walk.subscribe, walk.getSnapshot, walk.getServerSnapshot);

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") (window as any).__walk = walk; // dev/test hook only
