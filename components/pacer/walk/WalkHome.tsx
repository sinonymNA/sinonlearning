"use client";
/* eslint-disable react-hooks/set-state-in-effect */
// Pacer Walk: interval walking (3 minutes easy, 3 minutes brisk, five rounds) with your book read aloud. Setup, history and weight.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buildPhases, totalSec, weekProgress, sanitizeWalkData } from "../../../lib/pacer/walk.mjs";
import { trendSeries, ratePerWeek, goalEta, dropIsFast, dateKey, addDays } from "../../../lib/stride/engine.mjs";
import { walk, loadActiveWalk, clearActiveWalk, type Plan } from "../../../lib/pacer/walkSession";
import { unlockNarration } from "../../../lib/pacer/audioShared";
import { loadAudio, saveAudio } from "../../../lib/pacer/audioStore";
import type { LibItem } from "../../../lib/pacer/store";
import { KG_PER_LB, latestKg, type WalkData } from "./store";
import { mmss } from "./WalkBar";

type Tab = "walk" | "history" | "weight";
const fmtDate = (key: string) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" }); };
const num = (s: string) => { const t = s.replace(/[,\s]/g, ""); return t === "" ? null : Number(t); };

export default function WalkHome({ library, data, setData, onStart, onBack }: { library: LibItem[]; data: WalkData; setData: (fn: (d: WalkData) => WalkData) => void; onStart: (bookId: string | null) => void; onBack: () => void }) {
  const [now] = useState(() => Date.now()), [tab, setTab] = useState<Tab>("walk"), [err, setErr] = useState<string | null>(null), [stepsBefore, setStepsBefore] = useState(""), [busy, setBusy] = useState(false);
  const lb = data.units === "imperial", kg = latestKg(data), [resume, setResume] = useState<ReturnType<typeof loadActiveWalk>>(null);
  useEffect(() => { setResume(loadActiveWalk()); }, []);
  const phases = buildPhases(data.plan), total = totalSec(phases), books = library.filter((l) => l.local !== false || l.cloud);
  const book = books.find((b) => b.id === data.bookId) || null;
  const [ft, setFt] = useState(() => Math.floor(data.heightCm / 2.54 / 12)), [inch, setInch] = useState(() => Math.round((data.heightCm / 2.54) % 12)), [cm, setCm] = useState(() => String(Math.round(data.heightCm)));
  const [wIn, setWIn] = useState(""), [wDate, setWDate] = useState(() => dateKey(Date.now())), [goalIn, setGoalIn] = useState(() => (data.goalKg == null ? "" : String(Math.round((lb ? data.goalKg / KG_PER_LB : data.goalKg) * 10) / 10)));
  const fileIn = useRef<HTMLInputElement>(null);

  const setHeight = (c: number) => { if (c >= 100 && c <= 230) setData((d) => ({ ...d, heightCm: Math.round(c * 10) / 10 })); };
  const start = async (resumeAt?: { plan: Plan; at: number; startedAt: number }) => {
    setErr(null); setBusy(true); const useBook = book;
    if (useBook) { unlockNarration(); const a = loadAudio(); if (!a.voiceOn) saveAudio({ ...a, voiceOn: true }); } // so the book is actually read aloud
    if (!resumeAt) setData((d) => ({ ...d, meta: { stepsBefore: num(stepsBefore), book: useBook?.title || "" } }));
    const testPlan = process.env.NODE_ENV !== "production" ? (window as unknown as { __walkTestPlan?: object }).__walkTestPlan : undefined; // dev/test hook: short blocks
    const ok = await walk.start({ plan: resumeAt?.plan ?? { ...data.plan, ...testPlan }, resumeAt: resumeAt?.at, startedAt: resumeAt?.startedAt, loud: data.loud, keepAwake: data.keepAwake, buzz: data.buzz }); setBusy(false);
    if (!ok) { setErr("Your browser would not start the sound. Tap Start again, and check the phone is not on silent."); return; }
    onStart(useBook ? useBook.id : null);
  };
  const addWeight = () => { const v = num(wIn); if (v == null || !isFinite(v)) return; const k = lb ? v * KG_PER_LB : v; if (k < 25 || k > 400) { setErr("That weight does not look right."); return; } setErr(null); setData((d) => sanitizeWalkData({ ...d, weights: [...d.weights.filter((w) => w.d !== wDate), { d: wDate, kg: k }] }) as WalkData); setWIn(""); };
  const saveGoal = () => { const v = num(goalIn); setData((d) => ({ ...d, goalKg: v == null || !isFinite(v) || v <= 0 ? null : Math.min(400, Math.max(25, lb ? v * KG_PER_LB : v)) })); };
  const exportData = () => { const blob = new Blob([JSON.stringify({ ...data, meta: null }, null, 1)], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `pacer-walk-backup-${dateKey(Date.now())}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const importData = async (f?: File) => { if (!f) return; try { const j = JSON.parse(await f.text()); setData((d) => sanitizeWalkData({ ...d, sessions: [...d.sessions, ...(j.sessions || [])], weights: [...d.weights, ...(j.weights || [])] }) as WalkData); setErr(null); } catch { setErr("That file is not a Pacer Walk backup."); } };

  const today = dateKey(now), wp = weekProgress(data.sessions, today), series = trendSeries(data.weights), last = series[series.length - 1], rate = ratePerWeek(series), eta = last && data.goalKg != null ? goalEta(last.trend, data.goalKg, rate, today) : null;
  const unit = lb ? "lb" : "kg", show = (k: number) => (lb ? k / KG_PER_LB : k).toFixed(1);
  const monthAgo = last ? [...series].reverse().find((p) => p.d <= addDays(last.d, -30)) : null;
  const totalKcal = data.sessions.reduce((a, s) => a + s.kcal, 0), weekKcal = data.sessions.filter((s) => s.start > now - 7 * 864e5).reduce((a, s) => a + s.kcal, 0);

  return (
    <div className="pc-root pc-sans pc-lib pw-home" data-theme="paper">
      <header className="pc-libtop"><button className="pc-back" onClick={onBack} style={{ background: "none", border: 0 }}>← Pacer</button><span className="pc-badge">Pacer Walk · private</span></header>
      <main className="pc-libmain">
        <section className="pc-hero"><h1>Interval walk</h1>
          <p className="pc-sub">The Japanese method: alternate easy and brisk walking, {data.plan.intervalMin} minutes each, {data.plan.sets} rounds, {Math.round(total / 60)} minutes in all. A tone tells you when to switch, and your book keeps reading in your ears.</p>
        </section>
        <div className="pw-tabs" role="tablist" aria-label="Pacer Walk">{(["walk", "history", "weight"] as Tab[]).map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t === "walk" ? "Walk" : t === "history" ? "History" : "Weight"}</button>)}</div>
        {err && <p className="pc-err" role="alert">{err}</p>}

        {tab === "walk" && (<>
          {resume && (<section className="pc-sync on" aria-label="Unfinished walk"><div><b>You have an unfinished walk</b><p>It was {mmss(resume.at - 5)} in. Pick it up where it stopped, or drop it.</p></div><div className="pc-row"><button className="pc-btn pri" onClick={() => start({ plan: resume.plan, at: resume.at, startedAt: resume.startedAt })}>Resume</button><button className="pc-btn" onClick={() => { clearActiveWalk(); setResume(null); }}>Discard</button></div></section>)}
          <section className="pw-card" aria-label="About you"><h2>About you <small>(for calories)</small></h2>
            <div className="pw-grid">
              <label>Height{lb ? <span className="pw-two"><input type="number" min={3} max={7} value={ft} onChange={(e) => { setFt(+e.target.value); setHeight((+e.target.value * 12 + inch) * 2.54); }} aria-label="Height, feet" /> ft <input type="number" min={0} max={11} value={inch} onChange={(e) => { setInch(+e.target.value); setHeight((ft * 12 + +e.target.value) * 2.54); }} aria-label="Height, inches" /> in</span> : <span className="pw-two"><input type="number" min={100} max={230} value={cm} onChange={(e) => { setCm(e.target.value); setHeight(+e.target.value); }} aria-label="Height in centimetres" /> cm</span>}</label>
              <label>Weight today<span className="pw-two"><input inputMode="decimal" value={wIn} onChange={(e) => setWIn(e.target.value)} placeholder={data.weights.length ? show(kg) : "e.g. " + (lb ? "180" : "82")} aria-label={`Weight in ${unit}`} /> {unit} <button className="pc-btn" onClick={addWeight} disabled={!wIn.trim()}>Save</button></span></label>
            </div>
            <div className="pc-row"><button className={`pc-chip ${!lb ? "on" : ""}`} onClick={() => setData((d) => ({ ...d, units: "metric" }))}>kg · km</button><button className={`pc-chip ${lb ? "on" : ""}`} onClick={() => setData((d) => ({ ...d, units: "imperial" }))}>lb · miles</button>{data.weights.length > 0 ? <span className="mut small">Using {show(kg)} {unit} (saved {fmtDate(data.weights[data.weights.length - 1].d)})</span> : <span className="mut small">No weight saved yet: calories will assume 70 kg.</span>}</div>
          </section>

          <section className="pw-card" aria-label="Your walk"><h2>Your walk</h2>
            <label className="pw-field">Read along<select className="pc-select wide" value={data.bookId} onChange={(e) => setData((d) => ({ ...d, bookId: e.target.value }))} aria-label="Book to listen to"><option value="">No book, just the timer</option>{books.map((b) => <option key={b.id} value={b.id}>{b.title.slice(0, 60)}</option>)}</select></label>
            {books.length === 0 && <p className="mut small">Add a book in Pacer first (a PDF, EPUB or pasted text) and it can read to you while you walk.</p>}
            {book && <p className="mut small">“{book.title.slice(0, 50)}” will be read aloud from where you left off, using the voice in Pacer&apos;s ♪ Sound settings.</p>}
            <details className="pw-more"><summary>Change the pattern</summary>
              <div className="pw-grid">
                <label>Minutes per block<select value={data.plan.intervalMin} onChange={(e) => setData((d) => ({ ...d, plan: { ...d.plan, intervalMin: +e.target.value } }))} aria-label="Minutes per block">{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></label>
                <label>Rounds (easy + brisk)<select value={data.plan.sets} onChange={(e) => setData((d) => ({ ...d, plan: { ...d.plan, sets: +e.target.value } }))} aria-label="Rounds">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select></label>
                <label>Begin with<select value={data.plan.first} onChange={(e) => setData((d) => ({ ...d, plan: { ...d.plan, first: e.target.value as "slow" | "fast" } }))} aria-label="Begin with"><option value="slow">Easy (warm up)</option><option value="fast">Brisk</option></select></label>
              </div>
              <label className="pc-toggle"><input type="checkbox" checked={data.loud} onChange={(e) => setData((d) => ({ ...d, loud: e.target.checked }))} /><span>Louder tones</span></label>
              <label className="pc-toggle"><input type="checkbox" checked={data.buzz} onChange={(e) => setData((d) => ({ ...d, buzz: e.target.checked }))} /><span>Buzz the phone at each switch (Android)</span></label>
              <label className="pc-toggle"><input type="checkbox" checked={data.keepAwake} onChange={(e) => setData((d) => ({ ...d, keepAwake: e.target.checked }))} /><span>Keep the screen on</span></label>
            </details>
            <label className="pw-field">Steps in Apple Health right now <small>(optional, makes calories more accurate)</small><input inputMode="numeric" value={stepsBefore} onChange={(e) => setStepsBefore(e.target.value)} placeholder="Open Health → Steps → today's total" aria-label="Steps in Apple Health before the walk" /></label>
            <button className="pc-btn pri pw-start" onClick={() => start()} disabled={busy} aria-label="Start walk">▶ Start the {Math.round(total / 60)}-minute walk</button>
            <p className="mut small">Press Start, then put the phone in your pocket. The tones are a real audio file, so they keep sounding. Tone guide: <b>three rising tones = go brisk</b>, <b>two falling tones = ease off</b>, a short tick for the last three seconds.</p>
          </section>

          <section className="pw-card pw-info"><h2>How this works</h2>
            <p><b>Brisk</b> means a pace where you could talk but not sing, about 7 out of 10 effort. <b>Easy</b> is a relaxed stroll. A 2007 study from Shinshu University in Japan (Nemoto and colleagues) had people do this pattern for months; they improved their fitness and blood pressure more than people who walked steadily. The research pattern was five rounds, four or more days a week.</p>
            <p><b>Be real about weight loss:</b> a 30-minute walk burns very roughly 120 to 250 calories, depending on your weight and pace. That adds up beautifully over weeks, and what you eat matters as much. This is an estimate from your height, weight and steps, not a medical measurement. If you have a heart condition, are new to exercise or have pain, check with your doctor first.</p>
            <p><b>Limits:</b> a website cannot read Apple Health by itself, which is why you type the two step counts. The tones keep playing with the screen off on most phones. The book&apos;s voice may stop when the screen locks (the HD voice often keeps going; the device voice usually does not), so keeping the screen on is the safest.</p>
          </section>
        </>)}

        {tab === "history" && (<>
          <section className="pw-card"><h2>This week</h2>
            <div className="pw-dots" aria-label={`${wp.days} of ${wp.goal} days this week`}>{Array.from({ length: wp.goal }, (_, i) => <i key={i} className={i < wp.days ? "on" : ""} />)}</div>
            <p className="mut">{wp.days} of {wp.goal} walking days in the last 7 days{wp.done ? ". Goal reached. 🔥" : "."} · {weekKcal} calories this week · {totalKcal.toLocaleString()} in total</p></section>
          {data.sessions.length === 0 ? <p className="pc-note">No walks saved yet. Your first one goes here.</p> : (
            <ul className="pw-list">{data.sessions.map((s) => (<li key={s.id}><div><b>{fmtDate(dateKey(s.start))}</b> · {mmss(s.totalSec)}{s.completed ? "" : " (ended early)"}<small>{s.kcal} cal · {s.steps.toLocaleString()} steps{s.basis === "time" ? " (est.)" : ""} · {lb ? (s.distM / 1609.344).toFixed(2) + " mi" : (s.distM / 1000).toFixed(2) + " km"}{s.book ? ` · ${s.book.slice(0, 30)}` : ""}</small></div><button className="pc-x" style={{ position: "static" }} aria-label="Delete this walk" onClick={() => setData((d) => ({ ...d, sessions: d.sessions.filter((x) => x.id !== s.id) }))}>✕</button></li>))}</ul>)}
          <section className="pw-card"><h2>Backup</h2><p className="mut small">Your walks and weights are saved on this device only. Download a backup now and then, and restore it on another device.</p>
            <div className="pc-row"><button className="pc-btn" onClick={exportData}>Download backup</button><button className="pc-btn" onClick={() => fileIn.current?.click()}>Restore backup</button><input ref={fileIn} type="file" accept="application/json,.json" hidden onChange={(e) => { importData(e.target.files?.[0]); e.target.value = ""; }} /></div></section>
        </>)}

        {tab === "weight" && (<>
          <section className="pw-card"><h2>Log your weight</h2>
            <div className="pc-row"><input type="date" value={wDate} max={today} onChange={(e) => setWDate(e.target.value)} className="pc-input" style={{ maxWidth: 170 }} aria-label="Date" /><input className="pc-input" style={{ maxWidth: 130 }} inputMode="decimal" value={wIn} onChange={(e) => setWIn(e.target.value)} placeholder={unit} aria-label={`Weight in ${unit}`} /><button className="pc-btn pri" onClick={addWeight} disabled={!wIn.trim()}>Save</button></div>
            <p className="mut small">Weigh at about the same time each day. The scale wobbles a pound or two daily from water and food; the line below smooths that out, so trust the trend, not the day.</p>
          </section>
          {series.length > 0 ? (<>
            <section className="pw-card"><WeightChart series={series} goalKg={data.goalKg} lb={lb} />
              <div className="pw-results"><div><b>{show(last.trend)}</b><span>{unit} trend</span></div><div><b>{monthAgo ? (lb ? (last.trend - monthAgo.trend) / KG_PER_LB : last.trend - monthAgo.trend).toFixed(1) : "–"}</b><span>{unit} in 30 days</span></div><div><b>{rate == null ? "–" : (lb ? rate / KG_PER_LB : rate).toFixed(2)}</b><span>{unit} per week</span></div></div>
              {rate != null && dropIsFast(rate, last.trend) && <p className="pc-note">That is a quick drop. Slow and steady usually lasts longer; if it keeps up, mention it to a doctor.</p>}
              {data.goalKg != null && <p className="mut">{eta ? (eta.weeks === 0 ? "You are at your goal. 🎉" : `At this pace you would reach ${show(data.goalKg)} ${unit} around ${fmtDate(eta.date)}${eta.weeks > 52 ? ` (${eta.date.slice(0, 4)})` : ""}.`) : series.length < 2 || rate == null ? "Log a few more days for a goal estimate." : "The trend is not heading toward your goal yet. Give it a couple more weeks of data."}</p>}
            </section>
            <section className="pw-card"><h2>Goal weight <small>(optional)</small></h2><div className="pc-row"><input className="pc-input" style={{ maxWidth: 130 }} inputMode="decimal" value={goalIn} onChange={(e) => setGoalIn(e.target.value)} placeholder={unit} aria-label={`Goal weight in ${unit}`} /><button className="pc-btn" onClick={saveGoal}>Save goal</button></div></section>
            <ul className="pw-list">{[...data.weights].reverse().slice(0, 40).map((w) => (<li key={w.d}><div><b>{fmtDate(w.d)}</b> · {show(w.kg)} {unit}</div><button className="pc-x" style={{ position: "static" }} aria-label={`Delete the ${w.d} weight`} onClick={() => setData((d) => ({ ...d, weights: d.weights.filter((x) => x.d !== w.d) }))}>✕</button></li>))}</ul>
          </>) : <p className="pc-note">No weights yet. Add one above to start your trend line.</p>}
        </>)}
        <p className="pc-priv" style={{ marginTop: 8 }}>🔒 Everything here stays on this device. <Link href="/pacer">Back to reading</Link></p>
      </main>
    </div>
  );
}

function WeightChart({ series, goalKg, lb }: { series: { d: string; kg: number; trend: number }[]; goalKg: number | null; lb: boolean }) {
  const W = 320, H = 150, P = 26, conv = (k: number) => (lb ? k / KG_PER_LB : k), vals = series.flatMap((p) => [conv(p.kg), conv(p.trend)]).concat(goalKg != null ? [conv(goalKg)] : []);
  const lo = Math.min(...vals) - 1, hi = Math.max(...vals) + 1, n = series.length, x = (i: number) => (n === 1 ? W / 2 : P + (i * (W - P - 8)) / (n - 1)), y = (v: number) => 8 + ((hi - v) * (H - 8 - 22)) / (hi - lo);
  return (
    <svg className="pw-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weight over time with the smoothed trend">
      {goalKg != null && <g><line x1={P} x2={W - 8} y1={y(conv(goalKg))} y2={y(conv(goalKg))} className="goal" /><text x={W - 8} y={y(conv(goalKg)) - 3} textAnchor="end" className="lbl">goal</text></g>}
      <text x={2} y={y(hi) + 10} className="lbl">{hi.toFixed(0)}</text><text x={2} y={y(lo) - 2} className="lbl">{lo.toFixed(0)}</text>
      {series.map((p, i) => <circle key={p.d} cx={x(i)} cy={y(conv(p.kg))} r={2.6} className="pt" />)}
      {n > 1 && <polyline className="trend" fill="none" points={series.map((p, i) => `${x(i)},${y(conv(p.trend))}`).join(" ")} />}
      <text x={P} y={H - 4} className="lbl">{fmtDate(series[0].d)}</text><text x={W - 8} y={H - 4} textAnchor="end" className="lbl">{fmtDate(series[n - 1].d)}</text>
    </svg>
  );
}
