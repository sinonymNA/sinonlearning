"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import PackOpener from "./PackOpener";
import { sfx } from "./prefs";
import { api } from "./useRoom";
import { RARITIES } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
const A = "/api/arcade/abyss";
const TIER_COLOR: Record<string, string> = { bubble: "#7fd6ff", clever: "#ffb347", shoal: "#4cc3ff", reef: "#2fd1a5", trench: "#a98bff", pearl: "#ffd23d" };

function useCountdown() {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => { const n = new Date(), end = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1); const s = Math.max(0, Math.floor((end - n.getTime()) / 1000)); setLeft(`${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`); };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, []);
  return left;
}
const fmt = (n: number) => n.toLocaleString("en-US");

/* ---------------- Home ---------------- */
export function AbyssHome() {
  const [d, setD] = useState<any>(null);
  const left = useCountdown();
  useEffect(() => { api(A, { type: "home" }).then(setD).catch(() => setD({ error: true })); }, []);
  if (!d) return <p className="ar-h2 float p-6">🌊 Filling the ocean…</p>;
  if (d.error) return <p className="p-6">Couldn&apos;t reach the deep. Try again.</p>;
  const t = d.today;
  const status = !d.signedIn ? "guest" : !t ? "new" : t.done ? "done" : "going";
  return (
    <main className="abyss-home">
      <section className="ar-panel abyss-hero" aria-label="Daily Dive">
        <div className="abyss-hero-text">
          <p className="daily-title">Daily Dive · {d.date}</p>
          <h1 className="ar-h1">{status === "done" ? `${fmt(t.depth)} m deep` : "How deep can you go?"}</h1>
          <p className="ar-muted">{d.daily} prompts · {d.timeLimit}s each · the rarer your correct answer, the deeper you sink.</p>
          <div className="flex gap-1" aria-label="Today's progress">{Array.from({ length: d.daily }, (_, i) => { const r = t?.results?.[i]; return <span key={i} className={`daily-pip ${r ? (r.points ? "ok" : "miss") : i === (t?.i ?? 0) ? "cur" : ""}`} />; })}</div>
          <div className="flex flex-wrap items-center gap-3">
            <Link className="ar-btn xl coral" href="/arcade/abyss/play?mode=daily">{status === "done" ? "See your dive" : status === "going" ? "Resume the dive" : "Dive in"}</Link>
            {d.profile?.streak > 0 && <span className="ar-pill" style={{ background: "rgba(255,122,61,.35)" }}>🔥 {d.profile.streak}-day streak</span>}
            <span className="ar-muted text-sm">New dive in <b className="tabular-nums">{left}</b></span>
          </div>
          {!d.signedIn && <p className="ar-card" style={{ padding: 10 }}>Playing as a guest. <Link className="font-bold underline" href="/arcade/account">Sign in</Link> to save streaks, earn pearls and collect fish.</p>}
        </div>
        <div className="abyss-hero-art" aria-hidden><div className="bubble b1" /><div className="bubble b2" /><div className="bubble b3" /><div className="float"><Avatar id={d.profile?.fish ?? "f-bubbles"} size={150} /></div></div>
      </section>

      <div className="mode-grid abyss-modes">
        <Link href="/arcade/abyss/unlimited" className="mode-tile sky"><span className="mode-icon">♾️</span><span className="mode-name">Unlimited</span><span className="mode-note">3 air tanks · one wrong answer costs one</span></Link>
        <Link href="/arcade/abyss/fish" className="mode-tile grape"><span className="mode-icon">🐠</span><span className="mode-name">Fish packs</span><span className="mode-note">{d.signedIn ? `${d.pearls} pearls to spend` : "Collect fish"}</span></Link>
        <Link href="/arcade/abyss/me" className="mode-tile lime"><span className="mode-icon">📜</span><span className="mode-name">Dive log</span><span className="mode-note">Stats, streaks, best depth</span></Link>
        <Link href="/arcade" className="mode-tile coral"><span className="mode-icon">🎉</span><span className="mode-name">Party mode</span><span className="mode-note">Class games, solo, Mastery Peak</span></Link>
      </div>

      <section className="ar-panel" aria-label="How scoring works">
        <h2 className="ar-h2 mb-2">How deep?</h2>
        <p className="ar-muted mb-3 text-sm">Type a correct answer. The less common it is, the more points - and every point is 10 metres of depth. A wrong or late answer is 0.</p>
        <div className="tier-grid">{d.tiers.map((x: any) => <div key={x.id} className="tier-card" style={{ borderColor: TIER_COLOR[x.id] }}><span className="tier-icon">{x.icon}</span><b>{x.label}</b><span className="tabular-nums">{x.points} pts</span><span className="ar-muted text-xs">{x.blurb}</span></div>)}</div>
      </section>

      {d.signedIn && (
        <section className="ar-panel" aria-label="Archive">
          <h2 className="ar-h2 mb-2">Archive</h2>
          <p className="ar-muted mb-3 text-sm">Replay the last {d.archive.length} days. Archive dives don&apos;t count for streaks or pearls.</p>
          <div className="flex flex-wrap gap-2">{d.archive.map((a: any) => <Link key={a.date} className="ar-btn sm paper" href={`/arcade/abyss/play?mode=archive&date=${a.date}`}>{a.date.slice(5)} {a.done ? `✅ ${a.points}` : a.started ? "…" : ""}</Link>)}</div>
        </section>
      )}
      <p className="ar-muted px-1 text-xs">{d.count} prompts in the bank. Answer lists are curated by hand; if a correct answer isn&apos;t recognised, use &quot;Report&quot; after you answer and it will be reviewed.</p>
    </main>
  );
}

/* ---------------- Play ---------------- */
type Phase = "loading" | "question" | "reveal" | "done";
export function AbyssPlay({ forceMode }: { forceMode?: string } = {}) {
  const [cfg, setCfg] = useState<{ mode: string; date: string } | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setCfg({ mode: forceMode ?? (["daily", "archive"].includes(p.get("mode") ?? "") ? (p.get("mode") as string) : "daily"), date: p.get("date") ?? "" });
  }, [forceMode]);
  const mode = cfg?.mode ?? "daily";
  const archiveDate = cfg?.date ?? "";
  const [me, setMe] = useState<any>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [run, setRun] = useState<any>(null);
  const [q, setQ] = useState<any>(null);
  const [res, setRes] = useState<any>(null);
  const [finish, setFinish] = useState<any>(null);
  const [share, setShare] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msLeft, setMsLeft] = useState(25000);
  const [depth, setDepth] = useState(0);
  const [reported, setReported] = useState(false);
  const [copied, setCopied] = useState(false);
  const guestRun = useRef<any>(null);
  const base = useRef({ at: 0, left: 25000 });
  const input = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const lsKey = `abyss:guest:${mode}:${archiveDate || "x"}`;

  const take = useCallback((d: any) => {
    if (d.guestRun) { guestRun.current = d.guestRun; try { localStorage.setItem(lsKey, JSON.stringify(d.guestRun)); } catch { /* private mode */ } }
    setRun(d.run); setDepth(d.run.depth);
  }, [lsKey]);

  const showQuestion = useCallback((question: any) => {
    setQ(question); setAnswer(""); setErr(null); setRes(null); setReported(false);
    base.current = { at: performance.now(), left: question.msLeft }; setMsLeft(question.msLeft);
    submitting.current = false; setPhase("question"); setTimeout(() => input.current?.focus(), 80);
  }, []);

  useEffect(() => {
    if (!cfg) return;
    (async () => {
      try {
        const m = await api("/api/arcade/economy", { type: "me" }); setMe(m);
        let held: any = null;
        if (!m.signedIn) { try { held = JSON.parse(localStorage.getItem(lsKey) || "null"); } catch { /* ignore */ } }
        const d = await api(A, { type: "start", mode, date: archiveDate || undefined, run: held ?? undefined });
        take(d);
        if (d.question) showQuestion(d.question); else { setShare(d.share); setPhase("done"); }
      } catch (e: any) { setErr(e.message); setPhase("done"); }
    })();
  }, [cfg, mode, archiveDate, lsKey, take, showQuestion]);

  const submit = useCallback(async (value: string) => {
    if (submitting.current) return;
    submitting.current = true; setBusy(true);
    try {
      const d = await api(A, { type: "answer", mode, date: archiveDate || undefined, answer: value, run: guestRun.current ?? undefined });
      take(d);
      setRes(d.result); sfx(d.result.points >= 60 ? "win" : d.result.points ? "good" : "bad");
      if (d.done) { setFinish(d.finish); setShare(d.share); window.dispatchEvent(new Event("arcade:refresh")); }
      setQ(d.question); setPhase("reveal");
    } catch (e: any) { setErr(e.message); submitting.current = false; } finally { setBusy(false); }
  }, [mode, archiveDate, take]);

  // the 25 s clock (the server is the real authority; this is the display + the auto-submit)
  useEffect(() => {
    if (phase !== "question") return;
    const t = setInterval(() => {
      const left = Math.max(0, base.current.left - (performance.now() - base.current.at));
      setMsLeft(left);
      if (left <= 0) { clearInterval(t); submit(input.current?.value ?? ""); }
    }, 100);
    return () => clearInterval(t);
  }, [phase, submit, q]);

  async function cashOut() {
    try { const d = await api(A, { type: "cashout", mode: "unlimited", run: guestRun.current ?? undefined }); take(d); setFinish(d.finish); setShare(d.share); setQ(null); setRes(null); setPhase("done"); window.dispatchEvent(new Event("arcade:refresh")); } catch (e: any) { setErr(e.message); }
  }
  async function report() { try { await api(A, { type: "report", promptId: res.promptId, answer: res.answer }); setReported(true); } catch (e: any) { setErr(e.message); } }
  async function copy() { if (!share) return; try { await navigator.clipboard.writeText(share); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ } }

  const maxDepth = mode === "unlimited" ? Math.max(7000, depth) : 7000;
  const pct = Math.min(100, (depth / maxDepth) * 100);
  const title = mode === "daily" ? "Daily Dive" : mode === "archive" ? `Archive · ${archiveDate}` : "Unlimited";

  if (phase === "loading") return <p className="ar-h2 float p-6">🤿 Suiting up…</p>;
  return (
    <main className="abyss-play">
      <aside className="gauge" aria-label={`Depth ${depth} metres`}>
        <div className="gauge-track"><div className="gauge-diver" style={{ top: `${pct}%` }}>🤿</div>
          {[0, 25, 50, 75, 100].map((p) => <span key={p} className="gauge-tick" style={{ top: `${p}%` }}>{Math.round((maxDepth * p) / 100 / 100) * 100}m</span>)}</div>
      </aside>
      <section className="play-main">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="ar-h2">{title}</h1>
          <div className="flex items-center gap-2">
            {run?.lives !== null && run?.lives !== undefined && <span className="ar-pill" aria-label={`${run.lives} air tanks`}>{"🫧".repeat(Math.max(0, run.lives))}{"▫️".repeat(Math.max(0, 3 - run.lives))}</span>}
            <span className="ar-pill tabular-nums">⬇ {fmt(depth)} m</span><span className="ar-pill tabular-nums">{run?.points ?? 0} pts</span>
          </div>
        </header>

        {phase === "question" && q && (
          <div className="q-card" key={q.n}>
            <p className="daily-title">{q.total ? `${q.n + 1}/${q.total}` : `Dive ${q.n + 1}`} · {q.cat}</p>
            <p className="q-prompt">{q.prompt}</p>
            <div className={`ar-timer ${msLeft < 6000 ? "low" : ""}`} role="timer" aria-label={`${Math.ceil(msLeft / 1000)} seconds left`}><i style={{ width: `${(msLeft / 25000) * 100}%` }} /></div>
            <p className="text-right text-sm font-bold tabular-nums">{Math.ceil(msLeft / 1000)}s</p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (answer.trim()) submit(answer); }}>
              <input ref={input} className="ar-input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type something correct… and rare" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-label="Your answer" maxLength={80} disabled={busy} />
              <button className="ar-btn coral" style={{ whiteSpace: "nowrap" }} disabled={busy || !answer.trim()}>Lock in</button>
            </form>
            <p className="ar-muted text-sm">Tip: the obvious answer is worth the least. Spelling doesn&apos;t have to be perfect.</p>
            {mode === "unlimited" && <button className="ar-btn sm paper self-start" onClick={cashOut}>Surface with {run?.points ?? 0} pts</button>}
            {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
          </div>
        )}

        {phase === "reveal" && res && (
          <div className="q-card reveal" aria-live="polite">
            <p className="daily-title">{res.prompt}</p>
            {res.points ? (
              <div className="tier-stamp" style={{ borderColor: TIER_COLOR[res.tier] }}>
                <span className="tier-big">{res.tierInfo.icon}</span><div><p className="tier-name" style={{ color: TIER_COLOR[res.tier] }}>{res.tierInfo.label}</p><p className="text-sm">{res.tierInfo.blurb}</p></div><span className="tier-points tabular-nums">+{res.points}</span>
              </div>
            ) : (
              <div className="tier-stamp miss"><span className="tier-big">💀</span><div><p className="tier-name">{res.timedOut ? "Out of time" : "Not on the list"}</p><p className="text-sm">{res.timedOut ? "The clock won this one." : `"${res.answer}" didn't match a known answer.`}</p></div><span className="tier-points">+0</span></div>
            )}
            {res.matched && <p className="text-sm">Counted as <b>{res.matched}</b>{res.fuzzy ? " (we fixed a typo)" : ""}. Depth: <b className="tabular-nums">{fmt(res.depth)} m</b></p>}
            {res.examples?.length > 0 && <p className="text-sm"><span className="ar-muted">Deeper answers were: </span>{res.examples.map((e: any, i: number) => <span key={i} className="ar-pill" style={{ background: TIER_COLOR[e.tier] + "44", marginRight: 4 }}>{e.name}</span>)}</p>}
            <div className="flex flex-wrap items-center gap-2">
              {run?.done ? <button className="ar-btn coral" onClick={() => setPhase("done")}>See your dive</button> : <button className="ar-btn coral" onClick={() => q && showQuestion(q)} autoFocus>Next prompt →</button>}
              {!res.points && !res.timedOut && me?.signedIn && !reported && <button className="ar-btn sm paper" onClick={report}>That was a valid answer - report it</button>}
              {reported && <span className="ar-pill">Thanks - sent for review</span>}
            </div>
            {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
          </div>
        )}

        {phase === "done" && (
          <div className="q-card done">
            {run ? (
              <>
                <p className="ar-h1 stamp-in">{fmt(run.depth)} m</p>
                <p className="text-lg font-bold">{run.points} points · {run.results.length} prompts</p>
                <ul className="grid gap-1 text-left text-sm">{run.results.map((r: any, i: number) => <li key={i} className="flex items-center gap-2"><span>{r.tier ? { bubble: "🫧", clever: "😏", shoal: "🐟", reef: "🪸", trench: "🦑", pearl: "🦪" }[r.tier as string] : "💀"}</span><span className="flex-1 truncate"><b>{r.matched ?? (r.timedOut ? "(no answer)" : r.answer)}</b> <span className="ar-muted">- {r.prompt}</span></span><span className="tabular-nums">+{r.points}</span></li>)}</ul>
                {finish?.pearls > 0 && <p className="ar-pill" style={{ background: "rgba(255,194,51,.35)" }}>🦪 +{finish.pearls} pearls</p>}
                {finish?.newFish?.length > 0 && <div className="ar-card flex items-center gap-3" style={{ padding: 10 }}><Avatar id={finish.newFish[0]} size={64} /><p className="font-bold">New fish unlocked for your streak!</p></div>}
                {finish?.profile?.streak > 0 && <p className="font-bold">🔥 {finish.profile.streak}-day streak</p>}
                {!me?.signedIn && <p className="ar-card" style={{ padding: 10 }}>Sign in to earn pearls and keep a streak. <Link className="font-bold underline" href="/arcade/account">Sign in</Link></p>}
                <div className="flex flex-wrap gap-2">
                  {share && <button className="ar-btn sm mint" onClick={copy}>{copied ? "Copied!" : "📋 Copy result"}</button>}
                  {mode === "unlimited" && <button className="ar-btn sm coral" onClick={() => { window.location.href = "/arcade/abyss/unlimited"; }}>Dive again</button>}
                  <Link className="ar-btn sm paper" href="/arcade/abyss">Back to Abyss</Link>
                </div>
              </>
            ) : <><p className="font-bold text-[var(--coral)]">{err ?? "Something went wrong."}</p><Link className="ar-btn sm paper" href="/arcade/abyss">Back to Abyss</Link></>}
          </div>
        )}
      </section>
    </main>
  );
}

/* ---------------- Fish ---------------- */
export function AbyssFish() {
  const [d, setD] = useState<any>(null);
  const [packId, setPackId] = useState("abyss_reef");
  const pending = useRef<string | null>(null);
  const refresh = useCallback(() => api(A, { type: "fish" }).then(setD), []);
  useEffect(() => { refresh(); }, [refresh]);
  if (!d) return <p className="ar-h2 float p-6">🐠 Counting fish…</p>;
  const packs: any[] = d.packs;
  const sel = packs.find((p) => p.pack.id === packId) ?? packs[1];
  const ownedMap = new Map<string, number>(d.owned.map((o: any) => [o.id, o.count]));
  const total = d.fish.length, have = d.fish.filter((f: any) => ownedMap.has(f.id)).length;

  async function open() {
    pending.current ??= crypto.randomUUID();
    try { const r = await api(A, { type: "open_pack", requestId: pending.current, packId }); pending.current = null; setD((x: any) => ({ ...x, pearls: r.coins })); setTimeout(refresh, 2500); window.dispatchEvent(new Event("arcade:refresh")); return r; }
    catch (e: any) { if (e.status && e.status < 500) pending.current = null; throw e; }
  }
  async function choose(id: string) { await api(A, { type: "select_fish", id }); refresh(); }

  return (
    <main className="abyss-fish">
      <div className="ar-panel flex flex-wrap items-center justify-between gap-3"><div><p className="ar-h2">🦪 {d.pearls} pearls</p><p className="ar-muted text-sm">Earn pearls from dives: a Daily Dive gives points ÷ 5, Unlimited gives points ÷ 10. Fish are cosmetic only.</p></div><span className="ar-pill">{have}/{total} fish</span></div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="ar-card text-center">
          <h2 className="text-2xl font-bold">{sel.pack.name} · {sel.pack.cost} 🦪</h2><p className="mb-2 min-h-12 font-medium">{sel.pack.blurb}</p>
          <PackOpener key={sel.pack.id} pack={sel.pack} brand={["ABYSS", "FISH"]} onOpen={open} canOpen={d.signedIn && d.pearls >= sel.pack.cost} label={`Open ${sel.pack.name} · ${sel.pack.cost} 🦪`}
            hint={!d.signedIn ? "Sign in to collect fish." : d.pearls < sel.pack.cost ? `You need ${sel.pack.cost - d.pearls} more pearls. Take a dive!` : undefined} />
          {!d.signedIn && <p className="font-bold"><Link className="underline" href="/arcade/account">Sign in</Link></p>}
        </section>
        <section className="ar-panel grid content-start gap-3">
          <h2 className="ar-h2">Choose a pack</h2>
          <div className="grid gap-2 sm:grid-cols-3">{packs.map((p) => <button key={p.pack.id} aria-pressed={sel.pack.id === p.pack.id} onClick={() => setPackId(p.pack.id)} className="ar-card text-left" style={{ background: p.pack.color, padding: 10, outline: sel.pack.id === p.pack.id ? "5px solid #fff" : undefined, outlineOffset: 2 }}><div className="font-bold">{p.pack.name}</div><div className="text-lg font-bold">{p.pack.cost} 🦪</div></button>)}</div>
          <table className="w-full text-left"><tbody>{sel.rarities.map((r: any) => <tr key={r.id}><td className="py-1 font-bold" style={{ color: RARITIES[r.id].color }}>{r.label}</td><td className="text-right tabular-nums">{r.percent}%</td></tr>)}</tbody></table>
          <p className="ar-muted text-xs">Odds are applied on the server. Duplicates are possible. Streak fish (5, 14, 30, 60 and 100 days of Daily Dives) can&apos;t be bought.</p>
        </section>
      </div>
      <section className="ar-panel" aria-label="Fish collection">
        <h2 className="ar-h2 mb-3">Your fish</h2>
        <div className="fish-grid">{d.fish.map((f: any) => { const n = ownedMap.get(f.id) ?? 0; return (
          <button key={f.id} className={`fish-card ${n ? "" : "locked"} ${d.selected === f.id ? "sel" : ""}`} disabled={!n || !d.signedIn} onClick={() => choose(f.id)} aria-label={`${f.name}${n ? `, owned ×${n}` : ", not owned"}`} style={{ borderColor: RARITIES[f.rarity].color }}>
            <Avatar id={f.id} size={64} /><b className="text-sm">{n ? f.name : "???"}</b><span className="text-xs" style={{ color: RARITIES[f.rarity].color }}>{RARITIES[f.rarity].label}{f.streak ? " · streak" : ""}</span>{n > 1 && <span className="text-xs font-bold">×{n}</span>}{d.selected === f.id && <span className="ar-pill text-xs">your fish</span>}
          </button>); })}</div>
        <p className="ar-muted mt-2 text-xs">Tap a fish you own to make it your diver icon.</p>
      </section>
    </main>
  );
}

/* ---------------- Log ---------------- */
export function AbyssLog() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { api(A, { type: "home" }).then(setD); }, []);
  if (!d) return <p className="ar-h2 float p-6">📜 Opening the logbook…</p>;
  if (!d.signedIn) return <main className="abyss-home"><div className="ar-panel grid gap-3"><h1 className="ar-h1">📜 Dive log</h1><p>Sign in to track streaks, best depth and your fish.</p><Link className="ar-btn mint" href="/arcade/account">Sign in</Link></div></main>;
  const p = d.profile;
  const stat = (label: string, v: string | number) => <div className="ar-card text-center" style={{ padding: 12 }}><p className="text-3xl font-bold tabular-nums">{v}</p><p className="text-sm font-semibold">{label}</p></div>;
  const milestones = [[5, "Pearl Guppy"], [14, "Lantern Eel"], [30, "Moon Jelly"], [60, "Anglerlord"], [100, "Old Kraken"]] as const;
  return (
    <main className="abyss-home">
      <h1 className="ar-h1">📜 Dive log</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stat("Current streak", `🔥 ${p.streak}`)}{stat("Best streak", p.best)}{stat("Daily dives", p.dives)}{stat("Best daily score", `${p.bestScore}/700`)}
        {stat("Deepest ever", `${fmt(p.bestDepth)} m`)}{stat("Best Unlimited", `${p.bestUnlimited} pts`)}{stat("Unlimited dives", p.unlimitedRuns)}{stat("Pearls", `🦪 ${d.pearls}`)}
      </div>
      <section className="ar-panel"><h2 className="ar-h2 mb-2">Streak rewards</h2>
        <div className="flex flex-wrap gap-2">{milestones.map(([days, name]) => <span key={days} className="ar-pill" style={{ background: p.best >= days ? "rgba(47,209,165,.35)" : undefined }}>{p.best >= days ? "✅" : "🔒"} {days} days · {name}</span>)}</div></section>
    </main>
  );
}
