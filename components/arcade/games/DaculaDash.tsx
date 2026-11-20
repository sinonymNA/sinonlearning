"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs, @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "../Avatar";
import { sfx, usePrefs } from "../prefs";
import { useRemaining } from "../useRoom";
import { BOARD } from "../../../arcade-server/dacula/board.mjs";
import { buildMap, GRAPH, MAP_W, MAP_H, toPx, PLAYER_COLORS, CAT_COLORS, drawCar, drawShape } from "../dacula/mapArt";
import "../dacula/dacula.css";

const CATS: any[] = BOARD.categories as any[];
const CP: any[] = GRAPH.checkpoints;
const SHAPE: Record<string, string> = Object.fromEntries(CATS.map((c) => [c.id, c.shape]));
const catOf = (id: string) => CATS.find((c) => c.id === id);
const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const P = (id: number): [number, number] => toPx(GRAPH.nodes[id].x, GRAPH.nodes[id].y);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** A wedge icon: category colour + a distinct SHAPE and emoji so colour is never the only cue. */
function Wedge({ cat, on, size = 22 }: { cat: string; on: boolean; size?: number }) {
  const c = catOf(cat); const sh = c.shape;
  const path = sh === "circle" ? "M16 3a13 13 0 100 26 13 13 0 000-26z" : sh === "square" ? "M4 4h24v24H4z" : sh === "triangle" ? "M16 3l14 25H2z" : sh === "diamond" ? "M16 2l14 14-14 14L2 16z" : sh === "star" ? "M16 2l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" : "M9 4h14l8 12-8 12H9L1 16z";
  return (
    <span className={`dd-wedge ${on ? "on" : ""}`} title={`${c.name}${on ? " ✓" : ""}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden><path d={path} fill={on ? c.color : "#1a2146"} stroke={on ? "#fff" : c.color} strokeWidth="2.5" strokeLinejoin="round" /></svg>
      <span className="dd-wicon" aria-hidden>{on ? c.icon : ""}</span><span className="sr-only">{c.name} {on ? "collected" : "not yet"}</span>
    </span>
  );
}

function Dice({ face, rolling }: { face: number; rolling: boolean }) {
  const pips: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  return <div className={`dd-dice ${rolling ? "rolling" : ""}`} role="img" aria-label={`Die showing ${face}`}>{Array.from({ length: 9 }, (_, i) => <i key={i} className={pips[face]?.includes(i) ? "on" : ""} />)}</div>;
}

function optionLabel(path: number[]) {
  const dest = GRAPH.nodes[path.at(-1)!]; const lm = dest.landmark ? (BOARD.landmarks as any[]).find((l) => l.id === dest.landmark) : null;
  const edge = GRAPH.edges.find((e: any) => (e.a === path.at(-2) && e.b === path.at(-1)) || (e.b === path.at(-2) && e.a === path.at(-1)));
  const road = edge && !edge.name.startsWith("(") ? edge.name : "side road";
  const a = GRAPH.nodes[path[0]], dx = dest.x - a.x, dy = dest.y - a.y, ang = Math.round((Math.atan2(dy, dx) / Math.PI) * 4);     // y grows southward
  const dir = path.length < 2 ? "" : ["→ E", "↘ SE", "↓ S", "↙ SW", "← W", "↖ NW", "↑ N", "↗ NE"][(ang + 8) % 8];
  return { name: lm ? (lm.short ?? lm.name) : road, landmark: !!lm, steps: path.length - 1, dir };
}

export default function DaculaDash({ view, stamp, send, meId, projector = false }: any) {
  const g = view.game, b = g.board;
  const { prefs } = usePrefs();
  const canvasRef = useRef<HTMLCanvasElement>(null), wrapRef = useRef<HTMLDivElement>(null), mapRef = useRef<HTMLCanvasElement | null>(null);
  const cam = useRef({ x: 520 / 3, y: 1080 / 3, z: 1, free: false, drag: null as null | { x: number; y: number; cx: number; cy: number; moved: boolean } });
  const tokens = useRef(new Map<string, any>());
  const live = useRef<any>({ b, hover: null, preview: null, parts: [] as any[], rollFx: 0 });
  const [err, setErr] = useState<string | null>(null);
  const [boost, setBoost] = useState(0);
  const [face, setFace] = useState(1), [rolling, setRolling] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: string; n: number } | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [zoomLabel, setZoomLabel] = useState("1x");
  const prev = useRef<any>({});
  const me = b?.players?.find((p: any) => p.id === meId);
  const mine = !!b?.you?.cur && !projector;
  const sessionLeft = useRemaining(b?.sessionLeft, stamp), phaseLeft = useRemaining(b?.phaseLeft || null, stamp), qLeft = useRemaining(b?.q?.left || null, stamp);
  live.current.b = b;

  // ---- map + camera + animation loop --------------------------------------------------------------------------
  useEffect(() => { mapRef.current = buildMap(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current; if (!canvas || !wrap) return; const ctx = canvas.getContext("2d")!; let raf = 0, S = 3, W = 300, H = 200;
    const resize = () => { const r = wrap.getBoundingClientRect(); S = r.width < 520 ? 2 : 3; W = Math.max(120, Math.floor(r.width / S)); H = Math.max(100, Math.floor(r.height / S)); canvas.width = W; canvas.height = H; };
    resize(); const ro = new ResizeObserver(resize); ro.observe(wrap);
    const calm = prefs.calm;
    const frame = (now: number) => {
      const bb = live.current.b; const map = mapRef.current; const c = cam.current as any;
      if (bb && map) {
        // tokens: animate along the path the server just resolved, otherwise glide to the current space
        for (const p of bb.players) {
          let tk = tokens.current.get(p.id); const [tx, ty] = P(p.pos);
          if (!tk) { tk = { x: tx, y: ty, dir: "h", flip: false, anim: null }; tokens.current.set(p.id, tk); }
          if (tk.anim) {
            const f = clamp((now - tk.anim.start) / tk.anim.dur, 0, 1), pts = tk.anim.pts, lens = tk.anim.lens, total = lens.at(-1), d = f * total; let i = 0;
            while (i < lens.length - 2 && d > lens[i + 1]) i++;
            const a = pts[i], bpt = pts[i + 1] ?? pts[i], seg = (lens[i + 1] ?? total) - lens[i] || 1, k = clamp((d - lens[i]) / seg, 0, 1);
            tk.x = a[0] + (bpt[0] - a[0]) * k; tk.y = a[1] + (bpt[1] - a[1]) * k;
            const dx = bpt[0] - a[0], dy = bpt[1] - a[1]; if (Math.abs(dx) + Math.abs(dy) > 0.1) { tk.dir = Math.abs(dx) >= Math.abs(dy) ? "h" : "v"; tk.flip = tk.dir === "h" ? dx < 0 : dy < 0; }
            if (f >= 1) tk.anim = null;
          } else { const dx = tx - tk.x, dy = ty - tk.y; if (Math.hypot(dx, dy) < 0.4) { tk.x = tx; tk.y = ty; } else { tk.x += dx * 0.25; tk.y += dy * 0.25; } }
        }
        const follow = bb.players.find((p: any) => p.id === bb.cur); const ft = follow ? tokens.current.get(follow.id) : null;
        if (!c.free && ft) { c.tx = ft.x; c.ty = ft.y; }
        if (!c.free && c.tx !== undefined) { c.x += (c.tx - c.x) * (calm ? 1 : 0.12); c.y += (c.ty - c.y) * (calm ? 1 : 0.12); }
        const z = c.z, vw = W / z, vh = H / z;
        c.x = clamp(c.x, Math.min(vw / 2, MAP_W / 2), Math.max(MAP_W - vw / 2, MAP_W / 2)); c.y = clamp(c.y, Math.min(vh / 2, MAP_H / 2), Math.max(MAP_H - vh / 2, MAP_H / 2));
        ctx.imageSmoothingEnabled = false; ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.scale(z, z); ctx.translate(Math.round(-c.x + vw / 2), Math.round(-c.y + vh / 2)); ctx.drawImage(map, 0, 0);
        const t = calm ? 0 : now / 1000;
        // blocked roads
        for (const bl of bb.blocked) { const e = GRAPH.edges.find((x: any) => x.k === bl.k); if (!e) continue; const [ax, ay] = P(e.a), [bx, by] = P(e.b), mx = (ax + bx) / 2, my = (ay + by) / 2; ctx.fillStyle = "#ff7a2e"; ctx.fillRect(Math.round(mx - 3), Math.round(my - 3), 6, 6); ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(mx - 3), Math.round(my - 1), 6, 2); ctx.fillStyle = "#14163a"; ctx.fillRect(Math.round(mx - 4), Math.round(my + 3), 8, 1); }
        // spaces
        const x0 = c.x - vw / 2 - 6, x1 = c.x + vw / 2 + 6, y0 = c.y - vh / 2 - 6, y1 = c.y + vh / 2 + 6;
        for (const n of GRAPH.nodes) {
          const [x, y] = toPx(n.x, n.y); if (x < x0 || x > x1 || y < y0 || y > y1 || n.landmark) continue;
          if (n.flavor === "question") { ctx.fillStyle = "#14163a"; ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 5, 5); ctx.fillStyle = CAT_COLORS[n.cat]; ctx.fillRect(Math.round(x - 1), Math.round(y - 1), 3, 3); }
          else if (n.flavor === "event") { ctx.fillStyle = "#14163a"; ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 5, 5); ctx.fillStyle = "#ffe27a"; ctx.fillRect(Math.round(x - 1), Math.round(y - 1), 3, 3); ctx.fillStyle = "#14163a"; ctx.fillRect(Math.round(x), Math.round(y - 1), 1, 2); }
          else { ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(Math.round(x - 1), Math.round(y - 1), 2, 2); }
        }
        // route options + preview
        if (bb.options) {
          const pulse = calm ? 1 : 0.6 + 0.4 * Math.sin(t * 6);
          for (const o of bb.options) { const [x, y] = P(o.to); ctx.strokeStyle = `rgba(255,255,255,${0.55 + 0.4 * pulse})`; ctx.lineWidth = 1; ctx.strokeRect(Math.round(x - 4) + 0.5, Math.round(y - 4) + 0.5, 8, 8); ctx.fillStyle = `rgba(255,226,122,${0.35 + 0.4 * pulse})`; ctx.fillRect(Math.round(x - 3), Math.round(y - 3), 6, 6); }
          const pv = live.current.preview != null ? bb.options.find((o: any) => o.to === live.current.preview) : null;
          if (pv) { ctx.strokeStyle = "#7dffb0"; ctx.lineWidth = 2; ctx.beginPath(); pv.path.forEach((id: number, i: number) => { const [x, y] = P(id); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke(); const [dx, dy] = P(pv.to); ctx.fillStyle = "#7dffb0"; ctx.fillRect(Math.round(dx - 4), Math.round(dy - 4), 8, 8); }
        }
        // checkpoints + school
        const mineWedges: string[] = bb.you?.wedges ?? [];
        for (const cp of CP) {
          const [x, y] = P(cp.node), have = mineWedges.includes(cp.cat), bob = calm ? 0 : Math.round(Math.sin(t * 3 + cp.node) * 1);
          ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(Math.round(x - 3), Math.round(y + 1), 7, 2); ctx.fillStyle = "#e8eaf2"; ctx.fillRect(Math.round(x), Math.round(y - 12 + bob), 1, 13);
          drawShape(ctx, SHAPE[cp.cat], x, y - 15 + bob, 5, have ? "#3a3f55" : CAT_COLORS[cp.cat], "#fff"); if (have) { ctx.fillStyle = "#7dffb0"; ctx.fillRect(Math.round(x - 2), Math.round(y - 15 + bob), 4, 1); ctx.fillRect(Math.round(x - 1), Math.round(y - 14 + bob), 1, 2); }
        }
        { const [x, y] = P(GRAPH.schoolNode); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(Math.round(x - 3), Math.round(y + 1), 7, 2); ctx.fillStyle = "#e8eaf2"; ctx.fillRect(Math.round(x), Math.round(y - 14), 1, 15); ctx.fillStyle = bb.homeStretch ? (Math.floor(t * 4) % 2 ? "#ffe27a" : "#fff") : "#3b82f6"; ctx.fillRect(Math.round(x + 1), Math.round(y - 14), 8, 5); ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(x + 1), Math.round(y - 11), 8, 1); }
        // tokens (cars), stacked slightly when sharing a space
        const seen = new Map<string, number>();
        for (const p of [...bb.players].sort((a: any, b2: any) => tokens.current.get(a.id)?.y - tokens.current.get(b2.id)?.y)) {
          const tk = tokens.current.get(p.id); if (!tk || p.gone) continue; const key = `${Math.round(tk.x)}:${Math.round(tk.y)}`, k = seen.get(key) ?? 0; seen.set(key, k + 1);
          const cur = p.id === bb.cur; const bob = calm || !cur ? 0 : Math.round(Math.sin(t * 8) * 1);
          drawCar(ctx, tk.x + (k % 2 ? 4 : -2) * (k ? 1 : 0), tk.y - 2 - k * 4, PLAYER_COLORS[p.color % 6], tk.dir, tk.flip, bob);
          if (cur) { ctx.fillStyle = "#ffe27a"; const ay = Math.round(tk.y - 14 - k * 4 + (calm ? 0 : Math.sin(t * 6) * 1.5)); ctx.fillRect(Math.round(tk.x) - 2, ay, 5, 1); ctx.fillRect(Math.round(tk.x) - 1, ay + 1, 3, 1); ctx.fillRect(Math.round(tk.x), ay + 2, 1, 1); }
          if (p.id === meId) { ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(tk.x) - 1, Math.round(tk.y - 12 - k * 4), 3, 1); }
        }
        // particles (wedge bursts, confetti)
        const parts = live.current.parts; const dt = 1 / 60;
        for (const q of parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 40 * dt; q.l += dt; ctx.globalAlpha = clamp(1 - q.l / q.max, 0, 1); ctx.fillStyle = q.c; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s); }
        ctx.globalAlpha = 1; live.current.parts = parts.filter((q: any) => q.l < q.max);
        ctx.restore();
        // home-stretch tint
        if (bb.homeStretch && !bb.over) { ctx.fillStyle = `rgba(255,120,60,${calm ? 0.06 : 0.05 + 0.04 * Math.sin(t * 3)})`; ctx.fillRect(0, 0, W, H); }
        (canvas as any)._view = { S, W, H, vw, vh };
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [prefs.calm, meId]);

  // ---- react to the server's state: moves, dice, sounds, toasts -----------------------------------------------
  useEffect(() => {
    if (!b) return; const p = prev.current;
    // start a movement animation exactly once per turn
    if (b.moving && `${b.id}:${b.turn}:${b.moving.pid}` !== p.moveKey) {
      const pts = b.moving.path.map((id: number) => P(id)); const lens = [0]; for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      let tk = tokens.current.get(b.moving.pid); if (!tk) { tk = { x: pts[0][0], y: pts[0][1], dir: "h", flip: false, anim: null }; tokens.current.set(b.moving.pid, tk); }
      if (pts.length > 1 && !prefs.calm) { tk.x = pts[0][0]; tk.y = pts[0][1]; tk.anim = { pts, lens, start: performance.now() - (b.moving.elapsed || 0), dur: Math.max(300, b.moving.dur) }; }
      else tk.anim = null;
      p.moveKey = `${b.id}:${b.turn}:${b.moving.pid}`; sfx("whoosh");
      if (pts.length > 1) { let n = 0; const iv = setInterval(() => { sfx("tick"); if (++n >= pts.length - 1) clearInterval(iv); }, Math.max(120, b.moving.dur / pts.length)); }
    }
    // dice
    const rk = b.roll ? `${b.turn}:${b.roll.die}:${b.roll.steps}` : null;
    if (rk && rk !== p.rollKey) { p.rollKey = rk; if (!prefs.calm) { setRolling(true); let n = 0; const iv = setInterval(() => { setFace(1 + Math.floor(Math.random() * 6)); if (++n > 8) { clearInterval(iv); setFace(b.roll.die); setRolling(false); } }, 80); } else setFace(b.roll.die); sfx("pop"); }
    if (!b.roll && p.rollKey) { p.rollKey = null; setBoost(0); }
    // turn change
    if (b.turn !== p.turn) { p.turn = b.turn; setPicked(null); setErr(null); live.current.preview = null; setBoost(0); if (b.you?.cur) sfx("reveal"); const cur = tokens.current.get(b.cur); if (cur) { (cam.current as any).tx = cur.x; (cam.current as any).ty = cur.y; cam.current.free = false; } }
    // question appeared / resolved
    if (b.q && `${b.turn}:${b.q.kind}` !== p.qKey) { p.qKey = `${b.turn}:${b.q.kind}`; setPicked(null); sfx("reveal"); }
    if (b.result?.correct !== undefined && `${b.turn}` !== p.resKey) {
      p.resKey = `${b.turn}`; sfx(b.result.correct ? (b.result.award?.wedge || b.result.award?.win ? "win" : "good") : "bad");
      if (b.result.award?.wedge) { const tk = tokens.current.get(b.result.pid); if (tk) for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, v = 20 + Math.random() * 50; live.current.parts.push({ x: tk.x, y: tk.y - 12, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, l: 0, max: 1.2, c: i % 3 ? CAT_COLORS[b.result.award.wedge] : "#fff", s: 2 }); } }
    }
    if (b.winner && p.winner !== b.winner) { p.winner = b.winner; sfx("win"); for (let i = 0; i < 160; i++) { const tk = tokens.current.get(b.winner); if (!tk) break; const a = Math.random() * 6.28, v = 30 + Math.random() * 90; live.current.parts.push({ x: tk.x, y: tk.y - 8, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, l: 0, max: 2.2, c: ["#ef476f", "#ffd23f", "#4cc3ff", "#86efac", "#fff", "#a98bff"][i % 6], s: 2 }); } }
    if (b.homeStretch && !p.bell) { p.bell = true; sfx("boom"); }
    const last = b.feed?.at(-1); if (last && `${last.turn}:${last.text}` !== p.feedKey) { p.feedKey = `${last.turn}:${last.text}`; if (p.feedInit) setToast({ text: last.text, kind: last.kind, n: Date.now() }); p.feedInit = true; }
  }, [b, prefs.calm]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4200); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (b?.phase === "question" && qLeft != null && qLeft < 3200 && qLeft > 0 && b.you?.cur) { const t = setInterval(() => sfx("tick"), 400); return () => clearInterval(t); } }, [b?.phase, qLeft != null && qLeft < 3200, b?.turn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- inputs ---------------------------------------------------------------------------------------------------
  const turnNo = b?.turn;
  const act = useCallback(async (a: any) => { try { await send({ ...a, turn: turnNo }); setErr(null); } catch (e: any) { setErr(e?.message ?? "Something went wrong."); } }, [send, turnNo]);
  const roll = () => act({ type: "roll", boost });
  const move = (to: number) => { act({ type: "move", to }); live.current.preview = null; };
  const answer = (i: number) => { if (picked !== null) return; setPicked(i); act({ type: "answer", index: i }); };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!b || projector || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (b.phase === "question" && b.you?.cur && picked === null) { const i = ["1", "2", "3", "4"].indexOf(e.key); const l = ["a", "b", "c", "d"].indexOf(e.key.toLowerCase()); const k = i >= 0 ? i : l; if (k >= 0) { e.preventDefault(); answer(k); } }
      if (b.phase === "roll" && b.you?.cur && (e.key === " " || e.key === "Enter") && (e.target as HTMLElement)?.tagName !== "BUTTON") { e.preventDefault(); roll(); }
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  });

  const toMap = (e: React.PointerEvent) => { const cv = canvasRef.current!, r = cv.getBoundingClientRect(), v = (cv as any)._view; if (!v) return null; const c = cam.current; const lx = ((e.clientX - r.left) / r.width) * v.W, ly = ((e.clientY - r.top) / r.height) * v.H; return { x: (lx - v.W / 2) / c.z + c.x, y: (ly - v.H / 2) / c.z + c.y, r }; };
  const nearestOption = (m: { x: number; y: number }) => { let best: any = null, bd = 11; for (const o of b?.options ?? []) { const [x, y] = P(o.to); const d = Math.hypot(x - m.x, y - m.y); if (d < bd) { bd = d; best = o; } } return best; };
  const onDown = (e: React.PointerEvent) => { const m = toMap(e); if (!m) return; const c = cam.current; c.drag = { x: e.clientX, y: e.clientY, cx: c.x, cy: c.y, moved: false }; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); };
  const onMove = (e: React.PointerEvent) => {
    const c = cam.current, m = toMap(e); if (!m) return;
    if (c.drag) { const dx = e.clientX - c.drag.x, dy = e.clientY - c.drag.y; if (Math.hypot(dx, dy) > 6) c.drag.moved = true; if (c.drag.moved) { const v = (canvasRef.current as any)._view; c.free = true; c.x = c.drag.cx - (dx / v.S) / c.z; c.y = c.drag.cy - (dy / v.S) / c.z; (c as any).tx = c.x; (c as any).ty = c.y; setTip(null); return; } }
    const o = mine && b.phase === "choose" ? nearestOption(m) : null; live.current.preview = o ? o.to : live.current.preview;
    // tooltips for landmarks
    let text = ""; for (const l of BOARD.landmarks as any[]) { const [x, y] = toPx(l.at[0], l.at[1]); if (Math.hypot(x - m.x, y - m.y) < 14) { const cp = CP.find((q: any) => q.landmark === l.id); text = cp ? `${l.name}: ${catOf(cp.cat).name}` : `${l.name}: START / FINISH`; } }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setTip(text ? { x: e.clientX - r.left, y: e.clientY - r.top, text } : null);
  };
  const onUp = (e: React.PointerEvent) => { const c = cam.current; const moved = c.drag?.moved; c.drag = null; if (moved) return; const m = toMap(e); if (!m || !mine || b.phase !== "choose") return; const o = nearestOption(m); if (o) move(o.to); };
  const zoom = (z: number) => { cam.current.z = z; setZoomLabel(z === 0.5 ? "map" : z === 1 ? "1x" : "2x"); };
  const recenter = () => { const tk = tokens.current.get(b.cur); cam.current.free = false; if (tk) { (cam.current as any).tx = tk.x; (cam.current as any).ty = tk.y; } };

  if (!b) return <div className="ar-panel">You&apos;ll join the next game!</div>;
  const curP = b.players.find((p: any) => p.id === b.cur);
  const opts: any[] = (b.options ?? []).map((o: any) => ({ ...o, ...optionLabel(o.path) })).sort((a: any, c: any) => a.steps - c.steps || a.name.localeCompare(c.name));
  const needed = CATS.filter((c) => !(b.you?.wedges ?? []).includes(c.id));
  const q = b.q, res = b.result;
  const sessionFrac = clamp(1 - (sessionLeft ?? b.sessionTotal) / b.sessionTotal, 0, 1);
  const qFrac = q && qLeft != null ? clamp(qLeft / q.total, 0, 1) : 0;

  return (
    <div className={`dd-root ${b.homeStretch ? "home" : ""}`}>
      <header className="dd-top">
        <div className="dd-clock" role="timer" aria-label={`${mmss(sessionLeft ?? 0)} left in the game`}>
          <b>{mmss(sessionLeft ?? 0)}</b><div className="dd-bar"><i style={{ width: `${sessionFrac * 100}%` }} /><em style={{ left: "75%" }} title="Home stretch" /></div>
        </div>
        {b.homeStretch && !b.over && <span className="dd-home">🔔 HOME STRETCH</span>}
        <div className="dd-turn" aria-live="polite">{b.over ? "GAME OVER" : b.phase === "intro" ? "GET READY" : curP ? <><span className="dd-dot" style={{ background: PLAYER_COLORS[curP.color % 6] }} />{curP.id === meId ? "YOUR TURN" : `${curP.nickname}'s turn`}</> : ""}</div>
      </header>

      <div className="dd-stage" ref={wrapRef}>
        <canvas ref={canvasRef} className="dd-canvas" aria-label="Map of Dacula" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => { setTip(null); live.current.preview = null; }} />
        <div className="dd-crt" aria-hidden />
        <div className="dd-zoom" role="group" aria-label="Map controls">
          <button className="dd-mini" onClick={() => zoom(2)} aria-label="Zoom in">＋</button><button className="dd-mini" onClick={() => zoom(1)} aria-label="Normal zoom">{zoomLabel}</button><button className="dd-mini" onClick={() => zoom(0.5)} aria-label="Overview map">🗺</button><button className="dd-mini" onClick={recenter} aria-label="Follow the active player">◎</button>
        </div>
        {tip && <div className="dd-tip" style={{ left: tip.x + 12, top: tip.y + 12 }}>{tip.text}</div>}
        {toast && <div className={`dd-toast ${toast.kind}`} key={toast.n} role="status">{toast.text}</div>}

        {b.phase === "intro" && (
          <div className="dd-overlay intro" role="dialog" aria-label="How to play">
            <h2 className="dd-title">DACULA DASH</h2><p className="dd-sub">Race through the streets of Dacula!</p>
            <ol className="dd-steps"><li><b>ROLL</b> the die and pick your route on the real roads.</li><li><b>WIN A WEDGE</b> at each landmark by answering its question. Six landmarks, six colours.</li><li><b>RACE HOME</b> to the school with all six and answer the FINAL question!</li></ol>
            <div className="dd-wedgerow">{CATS.map((c) => <Wedge key={c.id} cat={c.id} on size={30} />)}</div>
            <p className="dd-sub">First bell in {mmss(b.phaseLeft)}…</p>
          </div>
        )}
        {b.over && (
          <div className="dd-overlay over" role="dialog" aria-label="Final standings">
            <h2 className="dd-title">{b.winner ? `${b.players.find((p: any) => p.id === b.winner)?.nickname} WINS!` : "TIME! FINAL STANDINGS"}</h2>
            <p className="dd-sub">{b.winner ? "First home with all six wedges!" : "The bell rang. Ranked by wedges, then correct answers, then distance to school."}</p>
            <ol className="dd-table">{(b.table ?? []).map((r: any) => { const pl = b.players.find((p: any) => p.id === r.id); return <li key={r.id} className={r.win ? "win" : ""}><b>#{r.rank}</b><span className="dd-dot" style={{ background: PLAYER_COLORS[pl.color % 6] }} /><span className="nm">{pl.nickname}</span><span className="wd">{CATS.map((c) => <Wedge key={c.id} cat={c.id} on={pl.wedges.includes(c.id)} size={16} />)}</span><span className="ct">{r.correct}✓</span></li>; })}</ol>
          </div>
        )}
      </div>

      <section className="dd-panel" aria-label="Your turn">
        {err && <p className="dd-err" role="alert">{err}</p>}
        {q && b.phase === "question" && (
          <div className="dd-question" style={{ ["--cat" as any]: CAT_COLORS[q.cat] }}>
            <div className="dd-qhead"><Wedge cat={q.cat} on size={24} /><b>{q.kind === "checkpoint" ? `${q.cp?.toUpperCase()}: ${catOf(q.cat).name.toUpperCase()} WEDGE` : q.kind === "final" ? "FINAL QUESTION: WIN THE GAME" : q.kind === "duel" ? `TRIVIA DUEL with ${q.rival}` : q.kind === "shortcut" ? "SHORTCUT QUESTION: 2 BONUS MOVES" : `BONUS QUESTION: ${catOf(q.cat).name.toUpperCase()}`}</b><span className="dd-qt">{Math.ceil((qLeft ?? 0) / 1000)}s</span></div>
            <div className="dd-qbar"><i style={{ width: `${qFrac * 100}%` }} className={qFrac < 0.25 ? "low" : ""} /></div>
            <p className="dd-qtext">{q.text}</p>
            <div className="dd-choices">{q.choices.map((c: string, i: number) => <button key={i} className="px-btn dd-choice" disabled={!b.you?.cur || picked !== null} aria-pressed={picked === i} onClick={() => answer(i)}><kbd>{"ABCD"[i]}</kbd>{c}</button>)}</div>
            {!b.you?.cur && <p className="dd-sub">{curP?.nickname} is answering…</p>}
          </div>
        )}
        {res && b.phase === "result" && (
          <div className={`dd-result ${res.correct === undefined ? "" : res.correct ? "good" : "bad"}`}>
            {res.correct === undefined ? <p className="dd-qtext">{res.msg}</p> : (
              <>
                <p className="dd-banner">{res.correct ? (res.award?.wedge ? `${catOf(res.award.wedge).icon} WEDGE SECURED!` : res.award?.win ? "🏆 BACK TO SCHOOL!" : "✔ NICE ONE!") : "✖ NOT QUITE"}</p>
                <p className="dd-qtext">Answer: <b>{res.right}</b></p>{res.explanation && <p className="dd-sub">{res.explanation}</p>}
                {res.award?.tokens ? <p className="dd-chip">+{res.award.tokens} bonus move{res.award.tokens > 1 ? "s" : ""}{res.award.catchUp ? " (catch-up!)" : ""}</p> : null}
              </>
            )}
          </div>
        )}
        {!q && !res && !b.over && b.phase !== "intro" && (
          <div className="dd-actions">
            {b.phase === "roll" && (mine ? (
              <><button className="px-btn big dd-roll" onClick={roll} autoFocus>ROLL THE DIE 🎲</button>
                {b.you.tokens > 0 && <button className="px-btn sm" onClick={() => setBoost((x) => (x + 1) % (Math.min(2, b.you.tokens) + 1))} aria-label="Use bonus moves">BONUS MOVES: +{boost} <small>(have {b.you.tokens})</small></button>}
                {me?.green > 0 && <span className="dd-chip">🟢 GREEN LIGHT +{me.green}</span>}
                {b.you.retry && <span className="dd-chip">Missed a question here? You can stay and retry.</span>}</>
            ) : <p className="dd-sub">{curP?.nickname} is about to roll… ({Math.ceil((phaseLeft ?? 0) / 1000)}s)</p>)}
            {b.phase === "choose" && (mine ? (
              <><div className="dd-rolled"><Dice face={face} rolling={rolling} /><span className="dd-chip">{b.roll?.steps} spaces{b.roll?.boost ? ` (incl. +${b.roll.boost} bonus)` : ""}{b.roll?.green ? " + green light" : ""}</span></div>
                <p className="dd-sub">Tap a glowing space on the map, or choose a destination:</p>
                <div className="dd-dests">{opts.map((o) => <button key={o.to} className={`px-btn sm dd-dest ${o.landmark ? "lm" : ""}`} onMouseEnter={() => (live.current.preview = o.to)} onFocus={() => (live.current.preview = o.to)} onMouseLeave={() => (live.current.preview = null)} onBlur={() => (live.current.preview = null)} onClick={() => move(o.to)}>{o.steps === 0 ? "STAY & RETRY" : `${o.landmark ? "⚑ " : ""}${o.name} · ${o.steps} ${o.dir}`}</button>)}</div></>
            ) : <div className="dd-rolled"><Dice face={face} rolling={rolling} /><p className="dd-sub">{curP?.nickname} rolled {b.roll?.steps} and is choosing a route…</p></div>)}
            {b.phase === "moving" && <div className="dd-rolled"><Dice face={face} rolling={false} /><p className="dd-sub">{mine ? "Driving…" : `${curP?.nickname} is driving…`}</p>{mine && <button className="px-btn sm" onClick={() => { const tk = tokens.current.get(b.cur); if (tk) tk.anim = null; }}>⏩ SKIP</button>}</div>}
          </div>
        )}
        <ul className="dd-players" aria-label="Players">
          {b.players.map((p: any) => (
            <li key={p.id} className={`${p.id === b.cur ? "cur" : ""} ${p.id === meId ? "me" : ""} ${p.gone || !p.connected ? "off" : ""}`}>
              <span className="dd-dot" style={{ background: PLAYER_COLORS[p.color % 6] }} />
              <span className="nm">{p.nickname}{p.id === meId ? " (you)" : ""}</span>
              <span className="wd">{CATS.map((c) => <Wedge key={c.id} cat={c.id} on={p.wedges.includes(c.id)} size={18} />)}</span>
              {p.tokens > 0 && <span className="tk" title="Bonus moves">⚡{p.tokens}</span>}
            </li>
          ))}
        </ul>
        {!projector && !b.over && needed.length > 0 && <p className="dd-need">Still need: {needed.map((c) => `${c.icon} ${c.name}`).join(" · ")}</p>}
        {!projector && !b.over && needed.length === 0 && <p className="dd-need go">All six wedges! Race back to Dacula High School 🏫</p>}
        <ol className="dd-feed" aria-live="polite" aria-label="Game feed">{(b.feed ?? []).slice(-3).map((f: any, i: number) => <li key={i} className={f.kind}>{f.text}</li>)}</ol>
      </section>
    </div>
  );
}
void Avatar;
