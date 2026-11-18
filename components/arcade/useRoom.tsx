"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type View = any;
export type Creds = { playerId: string; token: string; nickname?: string; avatar?: string };

export async function api(path: string, body: unknown): Promise<any> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  let data: any = {};
  try { data = await res.json(); } catch { /* non-JSON error */ }
  if (!res.ok) { const e: any = new Error(data.error || "Request failed"); e.code = data.code; e.status = res.status; throw e; }
  return data;
}

const storageKey = (code: string) => `arcade:room:${code.toUpperCase()}`;
export const saveCreds = (code: string, c: Creds) => { try { localStorage.setItem(storageKey(code), JSON.stringify(c)); } catch { /* private mode */ } };
export const loadCreds = (code: string): Creds | null => { try { return JSON.parse(localStorage.getItem(storageKey(code)) || "null"); } catch { return null; } };
export const clearCreds = (code: string) => { try { localStorage.removeItem(storageKey(code)); } catch { /* ignore */ } };

/**
 * Polls the authoritative room state. Players authenticate with playerId+token (kept in localStorage so a
 * refresh or dropped connection resumes the same seat); teachers authenticate with their site session.
 * `optsRef` carries per-game cursors (drawing strokes, reveal progress) so only new data is downloaded.
 */
export function useRoom(code: string, opts: { host?: boolean; mode?: string } = {}) {
  const { host = false, mode } = opts;
  const [view, setView] = useState<View>(null);
  const [stamp, setStamp] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lost, setLost] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [creds, setCreds] = useState<Creds | null>(null);
  const [ready, setReady] = useState(false);
  const optsRef = useRef<Record<string, unknown>>({});
  const credsRef = useRef<Creds | null>(null);
  const stopped = useRef(false);
  const inflight = useRef(false);

  useEffect(() => { const c = host ? null : loadCreds(code); credsRef.current = c; setCreds(c); setReady(true); }, [code, host]);

  const apply = useCallback((v: View) => { setView(v); setStamp(performance.now()); setOffline(false); setError(null); }, []);

  const poll = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const c = credsRef.current;
      if (!host && !c) return;
      const body = host ? { type: "poll", code, host: true, mode, opts: optsRef.current } : { type: "poll", code, playerId: c!.playerId, token: c!.token, opts: optsRef.current };
      const data = await api("/api/arcade", body);
      apply(data.view);
    } catch (e: any) {
      if (e.status === 404 || e.status === 401 || e.status === 403) { setLost(e.message); }
      else setOffline(true);
    } finally { inflight.current = false; }
  }, [code, host, mode, apply]);

  useEffect(() => {
    if (!ready) return;
    stopped.current = false;
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      if (stopped.current) return;
      await poll();
      const g = (view as View)?.game;
      const fast = g?.group?.status === "draw" || g?.phase === "question" || g?.kind === "hot_potato" || g?.kind === "imposter";
      const base = document.hidden ? 2500 : fast ? 650 : 1000;
      timer = setTimeout(loop, base * (0.9 + Math.random() * 0.25));
    };
    loop();
    return () => { stopped.current = true; clearTimeout(timer); };
    // the loop reads the latest view through the ref below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, poll]);

  const viewRef = useRef<View>(null);
  viewRef.current = view;

  const send = useCallback(async (action: Record<string, unknown>) => {
    const c = credsRef.current;
    if (!c) throw new Error("Not joined");
    try {
      const data = await api("/api/arcade", { type: "act", code, playerId: c.playerId, token: c.token, action, opts: optsRef.current });
      apply(data.view);
      return data.result;
    } catch (e: any) {
      if (e.status === 401) setLost(e.message);
      throw e;
    }
  }, [code, apply]);

  const hostCmd = useCallback(async (cmd: string, args: Record<string, unknown> = {}) => {
    const data = await api("/api/arcade", { type: "host", code, cmd, args });
    apply(data.view);
  }, [code, apply]);

  const join = useCallback(async (nickname: string, avatar: string) => {
    const data = await api("/api/arcade", { type: "join", code, nickname, avatar });
    const c = { playerId: data.playerId, token: data.token, nickname: data.nickname, avatar: data.avatar };
    saveCreds(code, c); credsRef.current = c; setCreds(c); setLost(null); apply(data.view);
    return c;
  }, [code, apply]);

  const leave = useCallback(() => { clearCreds(code); credsRef.current = null; setCreds(null); setView(null); }, [code]);

  return { view, stamp, error, lost, offline, creds, ready, optsRef, send, hostCmd, join, leave, poll };
}

/** Re-render ~10x/second so countdowns animate between polls. */
export function useNow(intervalMs = 100) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => { const t = setInterval(() => setNow(performance.now()), intervalMs); return () => clearInterval(t); }, [intervalMs]);
  return now;
}

/** Remaining ms for a server-provided duration received at `stamp`. */
export function useRemaining(ms: number | null | undefined, stamp: number) {
  const now = useNow(100);
  if (ms == null) return null;
  return Math.max(0, ms - (now - stamp));
}
