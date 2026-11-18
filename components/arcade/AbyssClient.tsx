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

/* ---------------- Scene pieces ---------------- */
const ZONES: [number, string][] = [[1500, "Sunlight Zone"], [3500, "Twilight Zone"], [5500, "Midnight Zone"], [7000, "Abyssal Zone"], [Infinity, "Hadal Zone"]];
const zoneOf = (m: number) => ZONES.find(([max]) => m < max)![1];
const SNOW = Array.from({ length: 26 }, (_, i) => ({ x: (i * 37) % 100, s: 7 + ((i * 13) % 9), d: -((i * 7) % 11), z: 2 + (i % 4) }));
const GLOW = Array.from({ length: 12 }, (_, i) => ({ x: (i * 53 + 11) % 96, y: (i * 29 + 8) % 80, d: (i % 5) * 0.7 }));

function CountUp({ value, ms = 1200 }: { value: number; ms?: number }) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now(), a = from.current, b = value;
    if (a === b) return;
    let raf = 0;
    const step = (t: number) => { const f = Math.min(1, (t - start) / ms), e = 1 - (1 - f) ** 3; setV(Math.round(a + (b - a) * e)); if (f < 1) raf = requestAnimationFrame(step); else from.current = b; };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value, ms]);
  return <>{fmt(v)}</>;
}

/** The underwater world. `depth` (metres) darkens the water and `diving` speeds the drifting plankton up. */
function Scene({ depth, diving = false, children }: { depth: number; diving?: boolean; children: React.ReactNode }) {
  const d = Math.min(1, depth / 7000);
  return (
    <div className={`sc ${diving ? "diving" : ""}`} style={{ ["--d" as any]: d }}>
      <div className="sc-bg" /><div className="sc-rays" aria-hidden><i /><i /><i /></div>
      <div className="sc-snow" aria-hidden>{SNOW.map((p, i) => <i key={i} style={{ left: `${p.x}%`, animationDuration: `${p.s}s`, animationDelay: `${p.d}s`, width: p.z, height: p.z }} />)}</div>
      <div className="sc-glow" aria-hidden>{GLOW.map((g, i) => <i key={i} style={{ left: `${g.x}%`, top: `${g.y}%`, animationDelay: `${g.d}s` }} />)}</div>
      <svg className="sc-floor" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden>
        <path className="weed w1" d="M20 60 C14 40 28 30 18 8 C34 30 26 44 32 60Z" /><path className="weed w2" d="M52 60 C46 44 58 34 50 14 C64 34 58 46 64 60Z" />
        <path className="weed w1" d="M340 60 C334 38 350 28 340 4 C356 30 348 46 356 60Z" /><path className="weed w2" d="M372 60 C368 44 380 36 372 18 C388 38 380 48 388 60Z" />
        <path d="M0 60 L0 50 Q40 40 90 52 Q200 44 310 52 Q360 42 400 50 L400 60Z" className="rock" />
      </svg>
      <div className="sc-ui">{children}</div>
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="sheet-back" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2"><h2 className="ar-h2">{title}</h2><button className="ar-btn sm paper" onClick={onClose}>Close</button></div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Home ---------------- */
export function AbyssHome() {
  const [d, setD] = useState<any>(null);
  const [sheet, setSheet] = useState<null | "how" | "archive">(null);
  const left = useCountdown();
  useEffect(() => { api(A, { type: "home" }).then(setD).catch(() => setD({ error: true })); }, []);
  if (!d) return <Scene depth={0}><div className="sc-center"><p className="ar-h2 float">🌊 Filling the ocean…</p></div></Scene>;
  if (d.error) return <Scene depth={0}><div className="sc-center"><p>Couldn&apos;t reach the deep. Try again.</p></div></Scene>;
  const t = d.today;
  const status = !d.signedIn ? "guest" : !t ? "new" : t.done ? "done" : "going";
  const depth = status === "done" ? t.depth : 0;
  return (
    <Scene depth={depth}>
      <div className="home-stack">
        <h1 className="abyss-logo" aria-label="Abyss">{"ABYSS".split("").map((c, i) => <span key={i} style={{ animationDelay: `${i * 120}ms` }}>{c}</span>)}</h1>
        <p className="abyss-tag">Find the answer nobody else thinks of.</p>
        <div className="hero-fish"><div className="fish-halo" /><div className="fish-body"><Avatar id={d.profile?.fish ?? "f-bubbles"} size={220} /></div></div>
        <div className="home-cta">
          <Link className="ar-btn xl coral dive-btn" href="/arcade/abyss/play?mode=daily">{status === "done" ? `Today: ${fmt(t.depth)} m` : status === "going" ? "Resume the dive" : "Daily Dive"}</Link>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {d.profile?.streak > 0 && <span className="sc-pill">🔥 {d.profile.streak}-day streak</span>}
            <span className="sc-pill">⏳ new dive in <b className="tabular-nums">{left}</b></span>
            {!d.signedIn && <Link className="sc-pill" href="/arcade/account">Guest · sign in to save streaks</Link>}
          </div>
        </div>
        <nav className="home-dock" aria-label="Abyss menu">
          <Link href="/arcade/abyss/unlimited" className="dock-btn"><span>♾️</span>Unlimited</Link>
          <button className="dock-btn" onClick={() => setSheet("archive")} disabled={!d.signedIn}><span>🗓️</span>Archive</button>
          <Link href="/arcade/abyss/fish" className="dock-btn"><span>🐠</span>Fish</Link>
          <button className="dock-btn" onClick={() => setSheet("how")}><span>❓</span>How to play</button>
        </nav>
      </div>
      {sheet === "how" && (
        <Sheet title="How deep can you go?" onClose={() => setSheet(null)}>
          <p className="mb-3">Each prompt has lots of correct answers. Type one. <b>The less common your correct answer, the more points</b> - every point is 10 metres of depth. Wrong guesses are free: keep guessing until something scores or the {d.timeLimit}s run out (you get 12 guesses per prompt).</p>
          <div className="tier-grid">{d.tiers.map((x: any) => <div key={x.id} className="tier-card" style={{ borderColor: TIER_COLOR[x.id] }}><span className="tier-icon">{x.icon}</span><b>{x.label}</b><span className="tabular-nums">{x.points} pts</span><span className="ar-muted text-xs">{x.blurb}</span></div>)}</div>
          <p className="ar-muted mt-3 text-sm">{d.count} prompts in the bank. If a correct answer isn&apos;t recognised, report it after the prompt ends.</p>
        </Sheet>
      )}
      {sheet === "archive" && (
        <Sheet title="Archive" onClose={() => setSheet(null)}>
          <p className="ar-muted mb-3 text-sm">Replay the last {d.archive.length} days. Archive dives don&apos;t count for streaks or pearls.</p>
          <div className="flex flex-wrap gap-2">{d.archive.map((a: any) => <Link key={a.date} className="ar-btn sm paper" href={`/arcade/abyss/play?mode=archive&date=${a.date}`}>{a.date.slice(5)} {a.done ? `✅ ${a.points}` : a.started ? "…" : ""}</Link>)}</div>
        </Sheet>
      )}
    </Scene>
  );
}

/* ---------------- Play ---------------- */
type Phase = "loading" | "question" | "reveal" | "done";
type Mood = "idle" | "nope" | "good" | "great" | "miss";
export function AbyssPlay({ forceMode }: { forceMode?: string } = {}) {
  const [cfg, setCfg] = useState<{ mode: string; date: string } | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setCfg({ mode: forceMode ?? (["daily", "archive"].includes(p.get("mode") ?? "") ? (p.get("mode") as string) : "daily"), date: p.get("date") ?? "" });
  }, [forceMode]);
  const mode = cfg?.mode ?? "daily";
  const archiveDate = cfg?.date ?? "";
  const [me, setMe] = useState<any>(null);
  const [fish, setFish] = useState<string>("f-bubbles");
  const [phase, setPhase] = useState<Phase>("loading");
  const [run, setRun] = useState<any>(null);
  const [q, setQ] = useState<any>(null);
  const [res, setRes] = useState<any>(null);
  const [finish, setFinish] = useState<any>(null);
  const [share, setShare] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msLeft, setMsLeft] = useState(25000);
  const [depth, setDepth] = useState(0);
  const [mood, setMood] = useState<Mood>("idle");
  const [diving, setDiving] = useState(false);
  const [reported, setReported] = useState<string[]>([]);
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
    setQ(question); setAnswer(""); setErr(null); setRes(null); setReported([]); setWrong(question.guesses ?? []); setMood("idle");
    base.current = { at: performance.now(), left: question.msLeft }; setMsLeft(question.msLeft);
    submitting.current = false; setPhase("question"); setTimeout(() => input.current?.focus(), 120);
  }, []);

  useEffect(() => {
    if (!cfg) return;
    (async () => {
      try {
        const m = await api("/api/arcade/economy", { type: "me" }); setMe(m);
        let held: any = null;
        if (!m.signedIn) { try { held = JSON.parse(localStorage.getItem(lsKey) || "null"); } catch { /* ignore */ } }
        const d = await api(A, { type: "start", mode, date: archiveDate || undefined, run: held ?? undefined });
        if (d.fish) setFish(d.fish);
        take(d);
        if (d.question) showQuestion(d.question); else { setShare(d.share); setPhase("done"); }
      } catch (e: any) { setErr(e.message); setPhase("done"); }
    })();
  }, [cfg, mode, archiveDate, lsKey, take, showQuestion]);

  const submit = useCallback(async (value: string, expired = false) => {
    if (submitting.current && !expired) return;
    if (!expired && !value.trim()) return;
    submitting.current = true; setBusy(true); setErr(null);
    try {
      const d = await api(A, { type: "answer", mode, date: archiveDate || undefined, answer: value, expired: expired || undefined, run: guestRun.current ?? undefined });
      take(d);
      if (d.retry) {          // not on the list: keep the question open
        setWrong(d.guesses); setAnswer(""); setMood("nope"); sfx("bad"); setTimeout(() => setMood("idle"), 700);
        if (d.question) { base.current = { at: performance.now(), left: d.question.msLeft }; }
        submitting.current = false; setTimeout(() => input.current?.focus(), 30);
        return;
      }
      setRes(d.result); setPhase("reveal");
      const pts = d.result.points;
      setMood(pts >= 85 ? "great" : pts ? "good" : "miss"); sfx(pts >= 60 ? "win" : pts ? "good" : "bad");
      if (pts) { setDiving(true); setTimeout(() => setDiving(false), 1800); }
      if (d.done) { setFinish(d.finish); setShare(d.share); window.dispatchEvent(new Event("arcade:refresh")); }
      setQ(d.question);
    } catch (e: any) { setErr(e.message); submitting.current = false; } finally { setBusy(false); }
  }, [mode, archiveDate, take]);

  useEffect(() => {
    if (phase !== "question") return;
    const t = setInterval(() => {
      const left = Math.max(0, base.current.left - (performance.now() - base.current.at));
      setMsLeft(left);
      if (left <= 0) { clearInterval(t); submit(input.current?.value ?? "", true); }
    }, 100);
    return () => clearInterval(t);
  }, [phase, submit, q]);

  async function cashOut() {
    try { const d = await api(A, { type: "cashout", mode: "unlimited", run: guestRun.current ?? undefined }); take(d); setFinish(d.finish); setShare(d.share); setQ(null); setRes(null); setPhase("done"); window.dispatchEvent(new Event("arcade:refresh")); } catch (e: any) { setErr(e.message); }
  }
  async function report(g: string) { try { await api(A, { type: "report", promptId: res.promptId, answer: g }); setReported((r) => [...r, g]); } catch (e: any) { setErr(e.message); } }
  async function copy() { if (!share) return; try { await navigator.clipboard.writeText(share); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ } }

  const title = mode === "daily" ? "Daily Dive" : mode === "archive" ? `Archive · ${archiveDate}` : "Unlimited";
  const frac = msLeft / 25000;
  const R = 112, C = 2 * Math.PI * R;
  const tierColor = res?.tier ? TIER_COLOR[res.tier] : "#ff5d73";

  if (phase === "loading") return <Scene depth={0}><div className="sc-center"><p className="ar-h2 float">🤿 Suiting up…</p></div></Scene>;
  return (
    <Scene depth={depth} diving={diving}>
      <div className="play-stack">
        <header className="play-hud">
          <div className="zone-chip">{zoneOf(depth)}<small>{title}</small></div>
          <div className="depth-big" aria-label={`Depth ${depth} metres`}><b><CountUp value={depth} /></b><span>metres</span></div>
          <div className="hud-pills">
            {run?.lives !== null && run?.lives !== undefined && <span className="sc-pill" aria-label={`${run.lives} air tanks`}>{"🫧".repeat(Math.max(0, run.lives))}{"▫️".repeat(Math.max(0, 3 - run.lives))}</span>}
            <span className="sc-pill tabular-nums">{run?.points ?? 0} pts</span>
            {run?.total ? <span className="sc-pill tabular-nums">{Math.min((run.i ?? 0) + (phase === "question" ? 1 : 0), run.total)}/{run.total}</span> : null}
          </div>
        </header>

        {phase !== "done" && (q || res) && (
          <div className="sonar" key={res ? `r${res.n}` : `q${q?.n}`}>
            <p className="sonar-cat">{(res ? res.prompt : null) ? "Answered" : q?.cat}</p>
            <p className="sonar-prompt">{res ? res.prompt : q?.prompt}</p>
          </div>
        )}

        <div className="fish-stage">
          {phase === "question" && (
            <svg className="timer-ring" viewBox="0 0 240 240" role="timer" aria-label={`${Math.ceil(msLeft / 1000)} seconds left`}>
              <circle cx="120" cy="120" r={R} className="ring-bg" />
              <circle cx="120" cy="120" r={R} className={`ring-fg ${msLeft < 6000 ? "low" : ""}`} strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 120 120)" />
            </svg>
          )}
          <div className={`fish-halo ${mood}`} />
          <div className={`fish-body mood-${mood}`}><Avatar id={fish} size={190} /></div>
          {phase === "question" && <span className="ring-num tabular-nums">{Math.ceil(msLeft / 1000)}</span>}
          {mood === "great" && <><span className="shock" /><span className="shock s2" /></>}
          {phase === "reveal" && res && (
            <div className={`tier-pop ${res.points ? "" : "miss"}`} key={res.n} style={{ ["--tc" as any]: tierColor }}>
              <span className="tier-big">{res.points ? res.tierInfo.icon : "💀"}</span>
              <b>{res.points ? res.tierInfo.label : res.timedOut ? "Out of time" : res.outOfGuesses ? "Out of guesses" : "Missed"}</b>
              <span className="tier-points tabular-nums">+{res.points}</span>
            </div>
          )}
          {phase === "question" && wrong.length > 0 && <div className="wrong-chips" aria-live="polite">{wrong.slice(-3).map((g, i) => <span key={`${g}-${i}`} className="wrong-chip">✖ {g}</span>)}</div>}
        </div>

        {phase === "question" && q && (
          <div className="play-input">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (answer.trim()) submit(answer); }}>
              <input ref={input} className="ar-input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type a correct answer… make it a rare one" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-label="Your answer" maxLength={80} />
              <button className="ar-btn coral" style={{ whiteSpace: "nowrap" }} disabled={busy || !answer.trim()}>Lock in</button>
            </form>
            <p className="play-hint">{wrong.length ? `Not on the list - keep trying! ${q.guessesLeft ?? ""} guesses left` : "Wrong guesses are free - keep going until the clock runs out."}</p>
            {mode === "unlimited" && <button className="ar-btn sm paper" onClick={cashOut}>Surface with {run?.points ?? 0} pts</button>}
            {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
          </div>
        )}

        {phase === "reveal" && res && (
          <div className="play-input reveal-panel" aria-live="polite">
            {res.matched && <p className="text-sm">Counted as <b>{res.matched}</b>{res.fuzzy ? " (we fixed a typo)" : ""} · {res.tierInfo?.blurb}</p>}
            {!res.matched && res.wrong?.length > 0 && <div className="text-sm"><span className="ar-muted">Valid answer that we missed? </span>{res.wrong.slice(0, 4).map((g: string) => <button key={g} className="ar-btn sm paper" style={{ marginRight: 4, marginBottom: 4 }} disabled={!me?.signedIn || reported.includes(g)} onClick={() => report(g)}>{reported.includes(g) ? "✓ reported" : `Report "${g}"`}</button>)}</div>}
            {res.examples?.length > 0 && <p className="text-sm"><span className="ar-muted">Deeper answers: </span>{res.examples.map((e: any, i: number) => <span key={i} className="ar-pill" style={{ background: TIER_COLOR[e.tier] + "44", marginRight: 4 }}>{e.name}</span>)}</p>}
            {run?.done ? <button className="ar-btn xl coral" onClick={() => setPhase("done")} autoFocus>See your dive</button> : <button className="ar-btn xl coral" onClick={() => q && showQuestion(q)} autoFocus>Next prompt →</button>}
            {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
          </div>
        )}

        {phase === "done" && (
          <div className="done-card">
            {run ? (
              <>
                <p className="ar-h1 stamp-in"><CountUp value={run.depth} /> m</p>
                <p className="text-lg font-bold">{run.points} points · {zoneOf(run.depth)}</p>
                <ul className="done-list">{run.results.map((r: any, i: number) => <li key={i}><span>{r.tier ? { bubble: "🫧", clever: "😏", shoal: "🐟", reef: "🪸", trench: "🦑", pearl: "🦪" }[r.tier as string] : "💀"}</span><span className="flex-1 truncate"><b>{r.matched ?? (r.timedOut ? "(no answer)" : r.answer)}</b> <span className="ar-muted">- {r.prompt}</span></span><span className="tabular-nums">+{r.points}</span></li>)}</ul>
                {finish?.pearls > 0 && <p className="sc-pill">🦪 +{finish.pearls} pearls</p>}
                {finish?.newFish?.length > 0 && <div className="ar-card flex items-center gap-3" style={{ padding: 10 }}><Avatar id={finish.newFish[0]} size={64} /><p className="font-bold">New fish unlocked for your streak!</p></div>}
                {finish?.profile?.streak > 0 && <p className="font-bold">🔥 {finish.profile.streak}-day streak</p>}
                {!me?.signedIn && <p className="ar-card" style={{ padding: 10 }}>Sign in to earn pearls and keep a streak. <Link className="font-bold underline" href="/arcade/account">Sign in</Link></p>}
                <div className="flex flex-wrap justify-center gap-2">
                  {share && <button className="ar-btn sm mint" onClick={copy}>{copied ? "Copied!" : "📋 Copy result"}</button>}
                  {mode === "unlimited" && <button className="ar-btn sm coral" onClick={() => { window.location.href = "/arcade/abyss/unlimited"; }}>Dive again</button>}
                  <Link className="ar-btn sm paper" href="/arcade/abyss">Back to Abyss</Link>
                </div>
              </>
            ) : <><p className="font-bold text-[var(--coral)]">{err ?? "Something went wrong."}</p><Link className="ar-btn sm paper" href="/arcade/abyss">Back to Abyss</Link></>}
          </div>
        )}
      </div>
    </Scene>
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
