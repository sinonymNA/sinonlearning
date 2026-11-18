"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { sfx } from "./prefs";
import { api } from "./useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
const STATUS: Record<string, { label: string; color: string; icon: string }> = {
  unseen: { label: "Not visited", color: "#5a6590", icon: "·" },
  climbing: { label: "Climbing", color: "#4cc3ff", icon: "⛰️" },
  wobbly: { label: "Wobbly", color: "#ff5d73", icon: "⚠️" },
  secured: { label: "Secured", color: "#ffc233", icon: "🔒" },
  stamped: { label: "Stamped", color: "#2fd1a5", icon: "🚩" },
};
const EVENT_TEXT: Record<string, string> = {
  ok: "Nice! Keep going.",
  secured: "🔒 Camp secured! You'll be re-checked on it a bit later - that's what makes it stick.",
  stamped: "🚩 Camp stamped! You still remembered it after a break.",
  slip: "Slip! Read why, then catch yourself with a new question on the same idea.",
  fell: "You fell back a camp. It happens - the re-check is there to catch what fades. Read why, then climb again.",
  summit: "🏔️ SUMMIT! Every camp is stamped.",
};

function Mountain({ concepts, current }: { concepts: any[]; current?: string }) {
  const n = concepts.length;
  const W = 640, rowH = 64, H = Math.max(180, n * rowH + 60);
  const pts = concepts.map((_, i) => ({ x: i % 2 === 0 ? 150 + ((i * 53) % 90) : W - 150 - ((i * 37) % 90), y: H - 50 - i * rowH }));
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Mountain trail with one camp per concept">
      <polygon points={`0,${H} ${W / 2},20 ${W},${H}`} fill="rgba(255,255,255,.06)" />
      <path d={path} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="6" strokeDasharray="2 12" strokeLinecap="round" />
      {concepts.map((c, i) => {
        const p = pts[i], st = STATUS[c.status];
        const label = c.name.length > 22 ? c.name.slice(0, 21) + "…" : c.name;
        const left = p.x < W / 2;
        return (
          <g key={c.name} aria-label={`${c.name}: ${st.label}`}>
            {current === c.name && <circle cx={p.x} cy={p.y} r="27" fill="none" stroke="#fff" strokeWidth="3" className="float" />}
            <circle cx={p.x} cy={p.y} r="20" fill={st.color} stroke="#14163a" strokeWidth="4" />
            <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize="18">{st.icon === "·" ? i + 1 : st.icon}</text>
            <text x={left ? p.x + 30 : p.x - 30} y={p.y - 2} textAnchor={left ? "start" : "end"} fontSize="15" fontWeight="700" fill="#fff">{label}</text>
            <text x={left ? p.x + 30 : p.x - 30} y={p.y + 16} textAnchor={left ? "start" : "end"} fontSize="12" fill="rgba(255,255,255,.7)">{c.status === "stamped" ? "stamped" : `${c.streak}/${c.needed} in a row`}</text>
          </g>
        );
      })}
      <text x={W / 2} y="18" textAnchor="middle" fontSize="26">🏔️</text>
    </svg>
  );
}

export default function PeakClient() {
  const [me, setMe] = useState<any>(null);
  const [setId, setSetId] = useState<string>("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState<any>(null);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<any>(null);

  const call = useCallback((type: string, extra: any = {}, id = setId) => api("/api/arcade/mastery", { type, setId: id, ...extra }), [setId]);

  useEffect(() => {
    api("/api/arcade/economy", { type: "me" }).then(setMe).catch(() => setMe({ signedIn: false }));
    const fromUrl = new URLSearchParams(window.location.search).get("set");
    if (fromUrl) { setSetId(fromUrl); setInput(fromUrl); }
  }, []);

  const open = useCallback(async (id: string) => {
    setErr(null); setRes(null); setQ(null); setReport(null);
    try { const d = await call("start", {}, id); setSetId(id); setData(d); } catch (e: any) { setErr(e.message); setData(null); }
  }, [call]);
  useEffect(() => { if (setId && me?.signedIn && !data) open(setId); }, [setId, me, data, open]);

  function parseId(v: string) { const m = v.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i); return (m?.[0] ?? (v.trim() === "builtin" ? "builtin" : v.trim())); }

  async function next() {
    setBusy(true); setErr(null); setRes(null);
    try { const d = await call("next"); setData(d); setQ(d.question); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  async function answer(i: number) {
    setBusy(true); setErr(null);
    try {
      const d = await call("answer", { choice: i });
      setData(d); setRes({ ...d.result, picked: i, reward: d.reward });
      sfx(d.result.correct ? "good" : "bad");
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  async function loadReport() { try { setReport(await call("report")); } catch (e: any) { setErr(e.message); } }

  if (!me) return <p className="ar-h2">Loading…</p>;
  if (!me.signedIn) return <div className="ar-panel grid gap-3"><h1 className="ar-h1">⛰️ Mastery Peak</h1><p>Sign in to climb - your progress is saved to your account (username + password only, no personal info).</p><Link className="ar-btn mint" href="/arcade/account">Sign in or make an account</Link></div>;

  if (!data) return (
    <div className="grid gap-4">
      <h1 className="ar-h1">⛰️ Mastery Peak</h1>
      <div className="ar-panel grid gap-3">
        <p className="text-lg">Climb through every idea in a set. Miss one and the game teaches it, then asks you a <b>different</b> question. Reach the peak when every camp is secured <i>and</i> still stuck after a break.</p>
        <label className="grid gap-1 font-bold">Set link or ID from your teacher<input className="ar-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste the Mastery Peak link" /></label>
        <div className="flex flex-wrap gap-2"><button className="ar-btn coral" disabled={!input.trim()} onClick={() => open(parseId(input))}>Start climbing</button><button className="ar-btn sm paper" onClick={() => open("builtin")}>Try the starter set</button></div>
        {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
      </div>
    </div>
  );

  const done = data.concepts.filter((c: any) => c.status === "stamped").length;
  const current = q?.concept;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><h1 className="ar-h1">⛰️ {data.title}</h1><p className="ar-muted">{done}/{data.concepts.length} camps stamped</p></div>
        <div className="flex gap-2">{me.role === "teacher" && <button className="ar-btn sm paper" onClick={loadReport}>📊 Class report</button>}<button className="ar-btn sm paper" onClick={() => { setData(null); setQ(null); setRes(null); setSetId(""); }}>Change set</button></div></div>
      {data.truncated && <p className="ar-pill">Big set: only the first 20 camps are used.</p>}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="ar-panel"><Mountain concepts={data.concepts} current={current} />
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">{Object.entries(STATUS).map(([k, v]) => <span key={k} className="ar-pill" style={{ background: v.color + "55" }}>{v.icon === "·" ? "○" : v.icon} {v.label}</span>)}</div></div>
        <div className="grid content-start gap-3">
          {data.summit && !q && !res ? (
            <div className="ar-panel grid gap-3 text-center"><p className="ar-h1">🏔️ You reached the peak!</p><p className="text-lg">Every camp is stamped. That is real evidence you know this material.</p>
              <button className="ar-btn sm paper" onClick={async () => { await call("reset"); open(setId); }}>Climb again from the bottom</button></div>
          ) : res ? (
            <div className="ar-panel grid gap-3" style={{ borderColor: res.correct ? "var(--mint)" : "var(--coral)" }} aria-live="polite">
              <p className="ar-h2">{res.correct ? "✅ Correct!" : res.event === "fell" ? "🪂 You fell back a camp" : "⚠️ Slip!"}</p>
              {!res.correct && <p>The answer was <b>{res.correctText}</b>.</p>}
              {res.explain && <p className="ar-card" style={{ padding: 12 }}>💡 {res.explain}</p>}
              <p className="font-bold">{EVENT_TEXT[res.event]}</p>
              {res.reward ? <p className="ar-pill">🪙 +{res.reward} coins for reaching the peak!</p> : null}
              {data.summit ? <button className="ar-btn mint" onClick={() => { setQ(null); setRes(null); }}>See the summit</button> : <button className="ar-btn coral" onClick={next} disabled={busy}>{res.correct ? "Next question" : "Catch yourself →"}</button>}
            </div>
          ) : q ? (
            <div className="ar-panel grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="ar-pill">{q.concept}</span>{q.recheck ? <span className="ar-pill" style={{ background: "rgba(255,194,51,.4)" }}>🔁 Re-check: does it still stick?</span> : <span className="ar-pill">{q.streak}/{q.needed} different right in a row</span>}</div>
              <p className="text-xl font-bold">{q.q}</p>
              <div className="grid gap-2">{q.choices.map((c: string, i: number) => <button key={`${q.id}-${i}`} className="choice" disabled={busy} onClick={() => answer(i)}>{c}</button>)}</div>
            </div>
          ) : (
            <div className="ar-panel grid gap-3 text-center"><p className="ar-h2">{done ? "Ready to keep climbing?" : "Ready to climb?"}</p>
              <p className="ar-muted">Take your time. There's no clock - this is about understanding, not speed.</p>
              <button className="ar-btn xl coral" onClick={next} disabled={busy}>{done ? "Continue" : "Start climbing"}</button></div>
          )}
          {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
        </div>
      </div>
      {report && (
        <div className="ar-panel grid gap-2" aria-label="Class report">
          <h2 className="ar-h2">📊 Class report · {report.students} students · {report.summited} at the summit</h2>
          {report.hardest.length > 0 && <p className="font-bold">Hardest camps: {report.hardest.join(", ")}</p>}
          <div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th>Camp</th><th>Unseen</th><th>Climbing</th><th>Wobbly</th><th>Secured</th><th>Stamped</th><th>Accuracy</th></tr></thead>
            <tbody>{report.concepts.map((c: any) => <tr key={c.name}><td className="py-1 font-bold">{c.name}</td>{["unseen", "climbing", "wobbly", "secured", "stamped"].map((k) => <td key={k}>{c.counts[k]}</td>)}<td>{c.accuracy === null ? "-" : `${c.accuracy}%`}</td></tr>)}</tbody></table></div>
        </div>
      )}
    </div>
  );
}
