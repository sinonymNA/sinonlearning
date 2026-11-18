"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

/**
 * The single drawing engine for Quick Draw AND Telephone.
 * Protocol (shared with arcade-server/drawing.mjs): segments {k,t,c,w,p[]}, canvas 1000x750.
 *   t: 0 pen, 1 eraser, 2 clear.
 */
export type Seg = { k: number; t: number; c: number; w: number; p: number[] };
export const PALETTE = ["#14163a", "#ff5d73", "#ff9d2e", "#ffd23d", "#2fd1a5", "#4cc3ff", "#8a6bff", "#8a5d3f"];
export const SIZES = [4, 9, 16, 30];
const W = 1000, H = 750;

export class Renderer {
  ctx: CanvasRenderingContext2D;
  last = new Map<number, [number, number]>();
  constructor(ctx: CanvasRenderingContext2D) { this.ctx = ctx; this.reset(); }
  reset() { this.ctx.fillStyle = "#fff"; this.ctx.fillRect(0, 0, W, H); this.last.clear(); }
  seg(s: Seg) {
    const { ctx } = this;
    if (s.t === 2) { this.reset(); return; }
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = s.t === 1 ? "#fff" : PALETTE[s.c] ?? PALETTE[0];
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = s.t === 1 ? SIZES[s.w] * 1.6 : SIZES[s.w] ?? 9;
    const pts = s.p;
    let [px, py] = this.last.get(s.k) ?? [pts[0], pts[1]];
    if (!this.last.has(s.k) && pts.length === 2) { ctx.beginPath(); ctx.arc(pts[0], pts[1], ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(px, py);
    for (let i = 0; i < pts.length; i += 2) { ctx.lineTo(pts[i], pts[i + 1]); px = pts[i]; py = pts[i + 1]; }
    ctx.stroke();
    this.last.set(s.k, [px, py]);
  }
}

function useRenderer() {
  const ref = useRef<HTMLCanvasElement>(null);
  const r = useRef<Renderer | null>(null);
  const get = useCallback(() => {
    if (!r.current && ref.current) { const ctx = ref.current.getContext("2d")!; r.current = new Renderer(ctx); }
    return r.current;
  }, []);
  return { ref, get, reset: () => { r.current = null; get(); } };
}

/** Read-only viewer fed by incremental `{key, from, segs}` payloads. Dedupes overlapping polls. */
export function StrokeViewer({ draw, onCursor }: { draw?: { key: number; from: number; segs: Seg[]; total?: number } | null; onCursor?: (c: { key: number; from: number }) => void }) {
  const { ref, get } = useRenderer();
  const state = useRef({ key: -1, applied: 0 });
  useEffect(() => {
    const r = get();
    if (!r || !draw) return;
    if (draw.key !== state.current.key) { r.reset(); state.current = { key: draw.key, applied: 0 }; }
    const { applied } = state.current;
    if (draw.from <= applied) {
      const fresh = draw.segs.slice(applied - draw.from);
      for (const s of fresh) r.seg(s);
      state.current.applied = applied + fresh.length;
    }
    onCursor?.({ key: state.current.key, from: state.current.applied });
  }, [draw, get, onCursor]);
  return <div className="canvas-wrap"><canvas ref={ref} width={W} height={H} aria-label="Drawing" role="img" /></div>;
}

/** One-shot replay of a finished drawing, animated over ~durationMs. */
export function Replay({ segs, durationMs = 2600, play = true }: { segs: Seg[]; durationMs?: number; play?: boolean }) {
  const { ref, get } = useRenderer();
  useEffect(() => {
    const r = get(); if (!r) return;
    r.reset();
    if (!play || !segs?.length) { segs?.forEach((s) => r.seg(s)); return; }
    const total = segs.reduce((a, s) => a + Math.max(1, s.p.length / 2), 0);
    let done = 0, i = 0, raf = 0; const start = performance.now();
    const step = () => {
      const target = Math.min(1, (performance.now() - start) / durationMs) * total;
      while (i < segs.length && done + Math.max(1, segs[i].p.length / 2) <= target) { r.seg(segs[i]); done += Math.max(1, segs[i].p.length / 2); i++; }
      if (i < segs.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [segs, durationMs, play, get]);
  return <div className="canvas-wrap"><canvas ref={ref} width={W} height={H} aria-label="Drawing replay" role="img" /></div>;
}

export type PadHandle = { clear: () => void };

/** Interactive pad: smooth pointer drawing (mouse/touch/pen), pen+eraser, palette, sizes, clear. Streams compact segments. */
export const DrawPad = forwardRef<PadHandle, { onSegs: (segs: Seg[]) => Promise<unknown> | void; disabled?: boolean; resetKey?: string | number }>(function DrawPad({ onSegs, disabled, resetKey }, handle) {
  const { ref, get, reset } = useRenderer();
  const [tool, setTool] = useState<0 | 1>(0);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(1);
  const stroke = useRef<{ k: number; pts: number[]; sent: number } | null>(null);
  const queue = useRef<Seg[]>([]);
  const sending = useRef(false);
  const kCounter = useRef(Math.floor(Math.random() * 1e6) * 10);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const pump = useCallback(async () => {
    if (sending.current) return;
    sending.current = true;
    try {
      while (queue.current.length) {
        const batch = queue.current.splice(0, 10);
        try { await onSegs(batch); } catch { /* server rejected (round over / full); drop */ }
      }
    } finally { sending.current = false; }
  }, [onSegs]);

  const flush = useCallback((final = false) => {
    const s = stroke.current; if (!s) return;
    const from = Math.max(0, s.sent - 1);       // overlap one point so the viewer connects chunks
    if (s.pts.length / 2 > s.sent || final) {
      const pts = s.pts.slice(from * 2);
      if (pts.length >= 2) {
        for (let i = 0; i < pts.length; i += 120) queue.current.push({ k: s.k, t: tool, c: color, w: size, p: pts.slice(i, Math.min(i + 128, pts.length)) });
        s.sent = s.pts.length / 2;
      }
    }
    void pump();
  }, [color, size, tool, pump]);

  useEffect(() => { reset(); queue.current = []; stroke.current = null; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [resetKey]);
  useEffect(() => () => { if (flushTimer.current) clearInterval(flushTimer.current); }, []);

  useImperativeHandle(handle, () => ({ clear: () => doClear() }));
  function doClear() {
    get()?.reset();
    queue.current.push({ k: ++kCounter.current, t: 2, c: 0, w: 0, p: [] });
    void pump();
  }

  const toCanvas = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return [Math.round(((e.clientX - rect.left) / rect.width) * W), Math.round(((e.clientY - rect.top) / rect.height) * H)];
  };

  const down = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const [x, y] = toCanvas(e);
    stroke.current = { k: ++kCounter.current, pts: [x, y], sent: 0 };
    const r = get()!;
    r.seg({ k: stroke.current.k, t: tool, c: color, w: size, p: [x, y] });
    flushTimer.current = setInterval(() => flush(), 90);
  };
  const move = (e: React.PointerEvent) => {
    const s = stroke.current; if (!s || disabled) return;
    const evs = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [e.nativeEvent];
    const r = get()!;
    for (const ev of evs.length ? evs : [e.nativeEvent]) {
      const rect = ref.current!.getBoundingClientRect();
      const x = Math.round(((ev.clientX - rect.left) / rect.width) * W), y = Math.round(((ev.clientY - rect.top) / rect.height) * H);
      const lx = s.pts[s.pts.length - 2], ly = s.pts[s.pts.length - 1];
      if (Math.abs(x - lx) + Math.abs(y - ly) < 3) continue;
      s.pts.push(x, y);
      r.seg({ k: s.k, t: tool, c: color, w: size, p: [x, y] });
    }
  };
  const up = () => {
    if (!stroke.current) return;
    if (flushTimer.current) { clearInterval(flushTimer.current); flushTimer.current = null; }
    flush(true); stroke.current = null;
  };

  return (
    <div className="grid gap-3">
      <div className="canvas-wrap" style={{ cursor: disabled ? "not-allowed" : "crosshair", opacity: disabled ? 0.6 : 1 }}>
        <canvas ref={ref} width={W} height={H} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} aria-label="Drawing canvas" role="img" />
      </div>
      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Drawing tools">
        {PALETTE.map((c, i) => <button key={c} className={`swatch ${tool === 0 && color === i ? "on" : ""}`} style={{ background: c }} onClick={() => { setTool(0); setColor(i); }} aria-label={`Color ${i + 1}`} />)}
        <button className={`ar-btn sm ${tool === 1 ? "sky" : "paper"}`} onClick={() => setTool(tool === 1 ? 0 : 1)} aria-pressed={tool === 1}>🧽 Eraser</button>
        {SIZES.map((s, i) => <button key={s} onClick={() => setSize(i)} aria-label={`Brush size ${i + 1}`} aria-pressed={size === i} className={`ar-btn sm ${size === i ? "sky" : "paper"}`} style={{ minWidth: 44, padding: 0 }}><span style={{ width: 6 + i * 5, height: 6 + i * 5, borderRadius: "50%", background: "#14163a", display: "block" }} /></button>)}
        <button className="ar-btn sm coral" onClick={doClear} disabled={disabled}>🗑 Clear</button>
      </div>
    </div>
  );
});
