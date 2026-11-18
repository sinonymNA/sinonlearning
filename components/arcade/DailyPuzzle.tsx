"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { sfx } from "./prefs";
import { api } from "./useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
const LS = (date: string) => `arcade:daily:${date}`;

function useCountdown() {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date(), end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
      const s = Math.max(0, Math.floor((end - now.getTime()) / 1000));
      setLeft(`${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
    };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, []);
  return left;
}

export default function DailyPuzzle() {
  const [data, setData] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [tries, setTries] = useState<number[]>([]);
  const [reveals, setReveals] = useState<(string | null)[]>([]);
  const [streak, setStreak] = useState(0);
  const [reward, setReward] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [flash, setFlash] = useState<null | { kind: "good" | "bad" | "reveal"; text: string }>(null);
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const left = useCountdown();

  useEffect(() => {
    (async () => {
      try {
        const d = await api("/api/arcade/daily", { type: "get" });
        setData(d);
        if (d.signedIn) {
          setResults(d.state.results); setTries(d.state.tries); setReveals(d.reveals); setStreak(d.state.streak); setReward(d.reward);
        } else {
          let saved: any = null; try { saved = JSON.parse(localStorage.getItem(LS(d.date)) || "null"); } catch { /* private mode */ }
          setResults(saved?.results ?? Array(d.puzzles.length).fill(null)); setTries(saved?.tries ?? Array(d.puzzles.length).fill(0)); setReveals(saved?.reveals ?? Array(d.puzzles.length).fill(null));
        }
      } catch (e: any) { setErr(e.message); }
    })();
  }, []);

  const saveGuest = useCallback((r: any[], t: number[], rv: (string | null)[]) => {
    if (!data || data.signedIn) return;
    try { localStorage.setItem(LS(data.date), JSON.stringify({ results: r, tries: t, reveals: rv })); } catch { /* ignore */ }
  }, [data]);

  if (err && !data) return <div className="ar-panel">Couldn&apos;t load today&apos;s puzzle. {err}</div>;
  if (!data) return <div className="ar-panel daily-card"><p className="ar-h2 float">🧩 Loading today&apos;s puzzle…</p></div>;

  const total = data.puzzles.length;
  const cur = results.findIndex((r) => !r);
  const finished = cur === -1;
  const p = finished ? null : data.puzzles[cur];
  const solved = results.filter((r) => r?.ok).length;
  const triesLeft = p ? data.tries - (tries[cur] ?? 0) : 0;

  async function submit(value: string) {
    if (!p || busy || !value.trim()) return;
    setBusy(true); setErr(null);
    try {
      const r = await api("/api/arcade/daily", { type: "check", n: cur, answer: value, tries: (tries[cur] ?? 0) + 1 });
      const nt = [...tries]; nt[cur] = (nt[cur] ?? 0) + 1;
      let nr = [...results], nv = [...reveals];
      if (r.resolved) { nr[cur] = { ok: r.correct, tries: nt[cur] }; nv[cur] = r.reveal ?? null; }
      if (data.signedIn && r.state) { nr = r.state.results; setStreak(r.state.streak); }
      setTries(nt); setAnswer("");
      if (r.correct) { sfx("good"); setFlash({ kind: "good", text: ["Nailed it!", "Yes!", "Boom!", "Smooth!"][cur % 4] }); }
      else if (r.resolved) { sfx("bad"); setFlash({ kind: "reveal", text: `It was ${r.reveal}` }); }
      else { sfx("bad"); setShake((s) => s + 1); setFlash({ kind: "bad", text: "Not quite - one more try!" }); }
      const delay = r.resolved ? (r.correct ? 900 : 1800) : 1100;
      setTimeout(() => {
        setFlash(null);
        if (r.resolved) { setResults(nr); setReveals(nv); saveGuest(nr, nt, nv); if (r.reward) setReward(r.reward); if (r.finished) window.dispatchEvent(new Event("arcade:refresh")); setTimeout(() => input.current?.focus(), 50); }
        else saveGuest(nr, nt, nv);
      }, delay);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <section className="ar-panel daily-card" aria-label="Daily puzzle">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="ar-h2">🧩 Daily Puzzle</h2>
        <div className="flex items-center gap-2">
          {streak > 0 && <span className="ar-pill" style={{ background: "rgba(255,122,61,.35)" }} title="Days in a row">🔥 {streak}</span>}
          <div className="flex gap-1" aria-label={`${solved} of ${total} solved`}>
            {data.puzzles.map((_: any, i: number) => <span key={i} className={`daily-pip ${results[i] ? (results[i].ok ? "ok" : "miss") : i === cur ? "cur" : ""}`} />)}
          </div>
        </div>
      </header>

      {!finished && p && (
        <div className="daily-body" key={`${cur}-${shake > 0 && flash?.kind === "bad" ? shake : 0}`}>
          <p className="daily-title">{cur + 1}/{total} · {p.title}</p>
          {p.type === "choice" ? (
            <>
              <p className="daily-prompt text">{p.prompt}</p>
              <div className="grid grid-cols-2 gap-2">{p.choices.map((c: string, i: number) => <button key={i} className="choice" disabled={busy || !!flash} onClick={() => submit(String(i))}>{c}</button>)}</div>
            </>
          ) : (
            <>
              <div className={`daily-prompt ${p.kind === "sequence" ? "seq" : ""}`} aria-label={p.prompt}>
                {p.kind === "sequence"
                  ? p.prompt.split(", ").map((t: string, i: number) => <span key={i} className="tile pop" style={{ animationDelay: `${i * 70}ms` }}>{t}</span>)
                  : p.prompt.split(" ").flatMap((w: string, wi: number) => w === "" ? [] : [<span key={wi} className="tile pop" style={{ animationDelay: `${wi * 50}ms` }}>{w}</span>])}
              </div>
              {p.hint && <p className="ar-muted text-sm">{p.hint}</p>}
              <form className={`flex gap-2 ${flash?.kind === "bad" ? "shake" : ""}`} onSubmit={(e) => { e.preventDefault(); submit(answer); }}>
                <input ref={input} className="ar-input" value={answer} onChange={(e) => setAnswer(e.target.value)} inputMode={p.type === "number" ? "numeric" : "text"} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder={p.type === "number" ? "Your number" : "Your answer"} aria-label="Your answer" disabled={busy || !!flash} />
                <button className="ar-btn coral" disabled={busy || !!flash || !answer.trim()}>Go</button>
              </form>
            </>
          )}
          <p className="text-sm font-bold" aria-label={`${triesLeft} tries left`}>{"❤️".repeat(Math.max(0, triesLeft))}{"🖤".repeat(Math.max(0, data.tries - triesLeft))}</p>
          {flash && <div className={`daily-flash ${flash.kind}`} role="status">{flash.text}</div>}
          {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
        </div>
      )}

      {finished && (
        <div className="daily-body daily-done">
          <p className="ar-h1 stamp-in">{solved === total ? "Perfect!" : solved >= 3 ? "Nice work!" : "Done for today"}</p>
          <p className="text-xl font-bold">{solved}/{total} solved{streak > 1 ? ` · 🔥 ${streak} day streak` : ""}</p>
          {data.signedIn
            ? (reward ? <p className="ar-pill" style={{ background: "rgba(255,194,51,.35)" }}>🪙 +{reward} coins earned</p> : null)
            : <p className="ar-card" style={{ padding: 10 }}>Sign in to keep your streak and earn coins. <Link className="font-bold underline" href="/arcade/account">Sign in</Link></p>}
          <ul className="grid gap-1 text-left text-sm">{data.puzzles.map((q: any, i: number) => <li key={i} className="flex items-center gap-2">{results[i]?.ok ? "✅" : "❌"} <b>{q.title}</b>{!results[i]?.ok && reveals[i] ? <span className="ar-muted"> - {reveals[i]}</span> : null}</li>)}</ul>
          <p className="ar-muted">Next puzzle in <b className="tabular-nums">{left}</b></p>
        </div>
      )}
    </section>
  );
}
