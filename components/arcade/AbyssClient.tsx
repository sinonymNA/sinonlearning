"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import PackOpener from "./PackOpener";
import PixelOcean, { type Marker } from "./PixelOcean";
import { PrefsProvider, sfx, usePrefs } from "./prefs";
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

/* ---------------- Pixel UI pieces ---------------- */
const ZONES: [number, string][] = [[1500, "SUNLIGHT ZONE"], [3500, "TWILIGHT ZONE"], [5500, "MIDNIGHT ZONE"], [7000, "ABYSSAL ZONE"], [Infinity, "HADAL ZONE"]];
const zoneOf = (m: number) => ZONES.find(([max]) => m < max)![1];
const TIER_LIST = [
  { id: "bubble", label: "BUBBLE", points: 10 }, { id: "clever", label: "SHOW-OFF", points: 15 }, { id: "shoal", label: "SHOAL", points: 30 },
  { id: "reef", label: "REEF", points: 60 }, { id: "trench", label: "TRENCH", points: 85 }, { id: "pearl", label: "ABYSS PEARL", points: 100 },
];

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="sheet-back" onClick={onClose} role="presentation">
      <div className="sheet px-plate" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2"><h2 className="px-h">{title}</h2><button className="px-btn sm" onClick={onClose}>CLOSE</button></div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

function PixelMenu({ onClose, signedIn }: { onClose: () => void; signedIn: boolean }) {
  return (
    <Sheet title="MENU" onClose={onClose}>
      <div className="grid gap-2">
        <Link className="px-btn" href="/arcade/abyss">▸ HOME</Link>
        <Link className="px-btn" href="/arcade/abyss/play?mode=daily">▸ DAILY DIVE</Link>
        <Link className="px-btn" href="/arcade/abyss/unlimited">▸ UNLIMITED</Link>
        <Link className="px-btn" href="/arcade/shop?tab=fish">▸ FISH PACKS</Link>
        <Link className="px-btn" href="/arcade/abyss/me">▸ DIVE LOG</Link>
        <Link className="px-btn" href="/arcade">▸ PARTY MODE</Link>
        {!signedIn && <Link className="px-btn" href="/arcade/account">▸ SIGN IN (SAVE STREAKS)</Link>}
      </div>
    </Sheet>
  );
}

function TopButtons({ onMenu }: { onMenu: () => void }) {
  const { prefs, set } = usePrefs();
  return (
    <div className="px-icons">
      <button className="px-icon" onClick={onMenu} aria-label="Menu">☰</button>
      <button className="px-icon" onClick={() => set({ muted: !prefs.muted })} aria-label={prefs.muted ? "Sound off" : "Sound on"} aria-pressed={prefs.muted}>{prefs.muted ? "🔇" : "🔊"}</button>
    </div>
  );
}

/* ---------------- Home ---------------- */
export function AbyssHome() {
  const [d, setD] = useState<any>(null);
  const [sheet, setSheet] = useState<null | "how" | "archive" | "menu">(null);
  const left = useCountdown();
  useEffect(() => { api(A, { type: "home" }).then(setD).catch(() => setD({ error: true })); }, []);
  const t = d?.today;
  const status = !d?.signedIn ? "guest" : !t ? "new" : t.done ? "done" : "going";
  return (
    <PrefsProvider>
      <div className="px-play home">
        <PixelOcean depth={0} surfaceFrac={0.64} ruler={false} />
        <div className="px-crt" />
        <TopButtons onMenu={() => setSheet("menu")} />
        {!d ? <p className="px-loading">LOADING…</p> : d.error ? <p className="px-loading">COULDN&apos;T REACH THE DEEP</p> : (
          <>
            <div className="px-title">
              <h1 aria-label="Abyss" className="px-logo">ABYSS</h1>
              <p className="px-sub">THE DAILY DIVE</p>
              <p className="px-blurb">{d.daily} PROMPTS · {d.timeLimit} SECONDS EACH · RARER ANSWERS SINK DEEPER</p>
            </div>
            <div className="px-bottom">
              <Link href="/arcade/abyss/play?mode=daily" className="px-btn big">▼ {status === "done" ? `TODAY: ${fmt(t.depth)} M` : status === "going" ? "RESUME DESCENT" : "BEGIN DESCENT"} ▼</Link>
              <p className="px-meta">{d.profile?.streak > 0 ? `🔥 ${d.profile.streak}-DAY STREAK · ` : ""}NEXT DIVE IN {left}{d.signedIn ? ` · ${d.pearls} PEARLS` : " · GUEST"}</p>
              <div className="px-row">
                <button className="px-btn sm" disabled={!d.signedIn} onClick={() => setSheet("archive")}>ARCHIVE ↺</button>
                <Link className="px-btn sm" href="/arcade/abyss/unlimited">UNLIMITED ∞</Link>
                <Link className="px-btn sm" href="/arcade/shop?tab=fish">FISH 🐠</Link>
                <button className="px-btn sm" onClick={() => setSheet("how")}>HOW TO PLAY</button>
              </div>
            </div>
          </>
        )}
        {sheet === "menu" && <PixelMenu onClose={() => setSheet(null)} signedIn={!!d?.signedIn} />}
        {sheet === "how" && d && (
          <Sheet title="HOW TO PLAY" onClose={() => setSheet(null)}>
            <p className="px-p">Every prompt has lots of correct answers. Type one. <b>The less common your correct answer, the deeper you sink</b> (10 m per point). Wrong guesses are free: keep guessing until one scores or the {d.timeLimit}s run out (12 guesses per prompt).</p>
            <div className="tier-grid">{d.tiers.map((x: any) => <div key={x.id} className="tier-card" style={{ borderColor: TIER_COLOR[x.id] }}><span className="tier-icon">{x.icon}</span><b>{x.label}</b><span className="tabular-nums">{x.points} pts</span><span className="text-xs opacity-70">{x.blurb}</span></div>)}</div>
            <p className="px-p opacity-70">{d.count} prompts in the bank. If a correct answer isn&apos;t recognised, report it after the prompt ends.</p>
          </Sheet>
        )}
        {sheet === "archive" && d && (
          <Sheet title="ARCHIVE" onClose={() => setSheet(null)}>
            <p className="px-p opacity-70">Replay the last {d.archive.length} days. Archive dives don&apos;t count for streaks or pearls.</p>
            <div className="flex flex-wrap gap-2">{d.archive.map((a: any) => <Link key={a.date} className="px-btn sm" href={`/arcade/abyss/play?mode=archive&date=${a.date}`}>{a.date.slice(5)} {a.done ? `✓ ${a.points}` : a.started ? "…" : ""}</Link>)}</div>
          </Sheet>
        )}
      </div>
    </PrefsProvider>
  );
}

/* ---------------- Play ---------------- */
type Phase = "loading" | "question" | "reveal" | "done";
type Mood = "idle" | "nope" | "good" | "great" | "miss";
export function AbyssPlay({ forceMode }: { forceMode?: string } = {}) {
  return <PrefsProvider><AbyssPlayInner forceMode={forceMode} /></PrefsProvider>;
}
function AbyssPlayInner({ forceMode }: { forceMode?: string }) {
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
  const [lead, setLead] = useState(0);
  const [target, setTarget] = useState(0);        // depth the diver is heading to
  const [shown, setShown] = useState(0);          // depth currently on screen (HUD)
  const [markerBase, setMarkerBase] = useState(0);
  const [mood, setMood] = useState<Mood>("idle");
  const [arrived, setArrived] = useState(true);
  const [reported, setReported] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState(false);
  const guestRun = useRef<any>(null);
  const base = useRef({ at: 0, left: 25000, lead: 0 });
  const input = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const lsKey = `abyss:guest:${mode}:${archiveDate || "x"}`;

  const take = useCallback((d: any) => {
    if (d.guestRun) { guestRun.current = d.guestRun; try { localStorage.setItem(lsKey, JSON.stringify(d.guestRun)); } catch { /* private mode */ } }
    setRun(d.run);
  }, [lsKey]);

  const showQuestion = useCallback((question: any, runDepth: number) => {
    setQ(question); setAnswer(""); setErr(null); setRes(null); setReported([]); setWrong(question.guesses ?? []); setMood("idle"); setMarkerBase(runDepth); setArrived(true);
    base.current = { at: performance.now(), left: question.msLeft, lead: question.startsIn ?? 0 }; setMsLeft(question.msLeft); setLead(question.startsIn ?? 0);
    submitting.current = false; setPhase("question");
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
        take(d); setTarget(d.run.depth); setShown(d.run.depth);
        if (d.question) showQuestion(d.question, d.run.depth); else { setShare(d.share); setPhase("done"); }
      } catch (e: any) { setErr(e.message); setPhase("done"); }
    })();
  }, [cfg, mode, archiveDate, lsKey, take, showQuestion]);

  const submit = useCallback(async (value: string, expired = false) => {
    if (submitting.current && !expired) return;
    if (!expired && !value.trim()) return;
    submitting.current = true; setBusy(true); setErr(null);
    try {
      const d = await api(A, { type: "answer", mode, date: archiveDate || undefined, answer: value, expired: expired || undefined, run: guestRun.current ?? undefined });
      if (d.retry) {          // not on the list: keep the question open
        take(d); setWrong(d.guesses); setAnswer(""); setMood("nope"); sfx("bad"); setTimeout(() => setMood("idle"), 700);
        if (d.question) base.current = { at: performance.now(), left: d.question.msLeft, lead: 0 };
        submitting.current = false; setTimeout(() => input.current?.focus(), 30);
        return;
      }
      take(d); setRes(d.result); setArrived(false); setPhase("reveal"); setTarget(d.run.depth);
      const pts = d.result.points;
      setMood(pts >= 85 ? "great" : pts ? "good" : "miss"); sfx(pts >= 60 ? "win" : pts ? "good" : "bad");
      if (d.done) { setFinish(d.finish); setShare(d.share); window.dispatchEvent(new Event("arcade:refresh")); }
      setQ(d.question);
    } catch (e: any) { setErr(e.message); submitting.current = false; } finally { setBusy(false); }
  }, [mode, archiveDate, take]);

  useEffect(() => {
    if (phase !== "question") return;
    const t = setInterval(() => {
      const el = performance.now() - base.current.at;
      setLead(Math.max(0, base.current.lead - el));
      const left = Math.max(0, base.current.left - Math.max(0, el - base.current.lead));
      setMsLeft(left);
      if (left <= 0 && el >= base.current.lead) { clearInterval(t); submit(input.current?.value ?? "", true); }
    }, 100);
    return () => clearInterval(t);
  }, [phase, submit, q]);

  useEffect(() => { if (phase === "question" && lead <= 0) input.current?.focus(); }, [phase, lead <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cashOut() {
    try { const d = await api(A, { type: "cashout", mode: "unlimited", run: guestRun.current ?? undefined }); take(d); setFinish(d.finish); setShare(d.share); setQ(null); setRes(null); setPhase("done"); window.dispatchEvent(new Event("arcade:refresh")); } catch (e: any) { setErr(e.message); }
  }
  async function report(g: string) { try { await api(A, { type: "report", promptId: res.promptId, answer: g }); setReported((r) => [...r, g]); } catch (e: any) { setErr(e.message); } }
  async function copy() { if (!share) return; try { await navigator.clipboard.writeText(share); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ } }

  const markers: Marker[] = phase === "done" ? [] : TIER_LIST.map((t) => ({ depth: markerBase + t.points * 10, label: `${t.label} · ${t.points}`, color: TIER_COLOR[t.id] }));
  const title = mode === "daily" ? "DAILY DIVE" : mode === "archive" ? `ARCHIVE ${archiveDate.slice(5)}` : "UNLIMITED";
  const tierColor = res?.tier ? TIER_COLOR[res.tier] : "#ff5d73";
  const total = run?.total ?? null;
  const frac = msLeft / 25000;

  return (
    <div className="px-play">
      <PixelOcean depth={target} surfaceFrac={0.5} markers={markers} fishId={phase === "loading" || phase === "done" ? null : fish} mood={mood} onDepth={setShown} onArrive={() => setArrived(true)} arriveKey={res?.n ?? -1} />
      <div className="px-crt" />
      <header className="px-hud">
        <div className="px-plate px-stat"><small>DEPTH</small><b>{fmt(shown)}m</b></div>
        <div className="px-progress" aria-label="Progress">
          {total ? <div className="px-pips">{Array.from({ length: total }, (_, i) => { const r = run?.results?.[i]; return <i key={i} style={{ background: r ? (r.tier ? TIER_COLOR[r.tier] : "#5a2230") : i === (run?.i ?? 0) ? "#ff5d9e" : "#0c1a33" }} />; })}</div>
            : <div className="px-lives">{"●".repeat(Math.max(0, run?.lives ?? 0))}<span>{"○".repeat(Math.max(0, 3 - (run?.lives ?? 0)))}</span></div>}
          <small>{total ? `PROMPT ${Math.min((run?.i ?? 0) + 1, total)} OF ${total}` : `${title} · ${zoneOf(shown)}`}</small>
        </div>
        <div className="px-plate px-stat right"><small>SCORE</small><b>{run?.points ?? 0}</b></div>
      </header>
      <TopButtons onMenu={() => setMenu(true)} />

      {phase !== "loading" && phase !== "done" && (
        <div className={`px-sign ${phase === "reveal" ? "answered" : ""}`} key={phase === "reveal" ? `a${res?.n}` : `q${q?.n}`}>
          {phase === "question" ? (
            <>
              <p className="px-signtag">{q?.total ? `PROMPT ${q.n + 1} OF ${q.total}` : `DIVE ${q?.n + 1}`} · {String(q?.cat).toUpperCase()}</p>
              <p className="px-prompt">{q?.prompt}</p>
              <p className="px-signfoot">▼ RARER ANSWERS SINK DEEPER ▼</p>
            </>
          ) : res && (
            <>
              <p className="px-signtag">{res.prompt.toUpperCase()}</p>
              <p className="px-prompt">{res.matched ? `“${res.matched.toUpperCase()}”` : res.timedOut ? "“…”" : `“${res.answer.toUpperCase()}”`}</p>
            </>
          )}
        </div>
      )}

      {phase === "question" && wrong.length > 0 && <div className="px-wrong" aria-live="polite">{wrong.slice(-3).map((g, i) => <span key={`${g}-${i}`}>✖ {g.toUpperCase()}</span>)}</div>}

      {phase === "question" && q && (
        <div className="px-bottom">
          {lead > 0 ? (
            <p className="px-plate px-lead">DESCENDING · THE CLOCK STARTS IN {Math.ceil(lead / 1000)}</p>
          ) : (
            <>
              <div className={`px-clock ${msLeft < 6000 ? "low" : ""}`} role="timer" aria-label={`${Math.ceil(msLeft / 1000)} seconds left`}><div className="px-clockbar">{Array.from({ length: 25 }, (_, i) => <i key={i} className={i < Math.ceil(frac * 25) ? "on" : ""} />)}</div><b>{Math.ceil(msLeft / 1000)}s</b></div>
              <form className="px-form" onSubmit={(e) => { e.preventDefault(); if (answer.trim()) submit(answer); }}>
                <input ref={input} className="px-input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="TYPE AN ANSWER…" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-label="Your answer" maxLength={80} />
                <button className="px-btn" disabled={busy || !answer.trim()}>LOCK IN</button>
              </form>
              <p className="px-meta">{wrong.length ? `NOT ON THE LIST - KEEP TRYING (${q.guessesLeft ?? ""} LEFT)` : "WRONG GUESSES ARE FREE UNTIL THE CLOCK ENDS"}{mode === "unlimited" ? "" : ""}</p>
              {mode === "unlimited" && <button className="px-btn sm" type="button" onClick={cashOut}>SURFACE WITH {run?.points ?? 0} PTS</button>}
            </>
          )}
          {err && <p role="alert" className="px-err">{err}</p>}
        </div>
      )}

      {phase === "reveal" && res && arrived && (
        <>
          <div className="px-banner" key={`b${res.n}`} style={{ ["--tc" as any]: tierColor }}>
            <span>{res.points ? res.tierInfo.icon : "💀"}</span>
            <b>{res.points ? res.tierInfo.label.toUpperCase() : res.timedOut ? "OUT OF TIME" : res.outOfGuesses ? "OUT OF GUESSES" : "MISSED"}</b>
            <em>+{res.points}</em>
          </div>
          <div className="px-bottom" aria-live="polite">
            {res.matched && <p className="px-meta">COUNTED AS {res.matched.toUpperCase()}{res.fuzzy ? " (TYPO FIXED)" : ""} · {fmt(res.depth)} M</p>}
            {!res.matched && res.wrong?.length > 0 && <div className="px-row">{res.wrong.slice(0, 3).map((g: string) => <button key={g} className="px-btn sm" disabled={!me?.signedIn || reported.includes(g)} onClick={() => report(g)}>{reported.includes(g) ? "✓ REPORTED" : `REPORT “${g.toUpperCase()}”`}</button>)}</div>}
            {res.examples?.length > 0 && <p className="px-meta">DEEPER ANSWERS: {res.examples.map((e: any) => e.name.toUpperCase()).join(" · ")}</p>}
            {run?.done ? <button className="px-btn big" onClick={() => setPhase("done")} autoFocus>SEE YOUR DIVE</button> : <button className="px-btn big" onClick={() => q && showQuestion(q, run.depth)} autoFocus>NEXT PROMPT ▼</button>}
            {err && <p role="alert" className="px-err">{err}</p>}
          </div>
        </>
      )}

      {phase === "done" && (
        <div className="px-done">
          {run ? (
            <div className="px-plate px-donecard">
              <p className="px-bigdepth">{fmt(run.depth)} M</p>
              <p className="px-meta">{run.points} POINTS · {zoneOf(run.depth)}</p>
              <ul className="done-list">{run.results.map((r: any, i: number) => <li key={i}><span>{r.tier ? { bubble: "🫧", clever: "😏", shoal: "🐟", reef: "🪸", trench: "🦑", pearl: "🦪" }[r.tier as string] : "💀"}</span><span className="flex-1 truncate"><b>{(r.matched ?? (r.timedOut ? "(no answer)" : r.answer)).toUpperCase()}</b> <span className="opacity-60">- {r.prompt}</span></span><span className="tabular-nums">+{r.points}</span></li>)}</ul>
              {finish?.pearls > 0 && <p className="px-meta">🦪 +{finish.pearls} PEARLS</p>}
              {finish?.newFish?.length > 0 && <div className="flex items-center justify-center gap-3"><Avatar id={finish.newFish[0]} size={56} /><p className="px-meta">NEW FISH UNLOCKED FOR YOUR STREAK!</p></div>}
              {finish?.profile?.streak > 0 && <p className="px-meta">🔥 {finish.profile.streak}-DAY STREAK</p>}
              {!me?.signedIn && <p className="px-meta">SIGN IN TO EARN PEARLS AND KEEP A STREAK · <Link className="underline" href="/arcade/account">SIGN IN</Link></p>}
              <div className="px-row">
                {share && <button className="px-btn sm" onClick={copy}>{copied ? "COPIED!" : "COPY RESULT"}</button>}
                {mode === "unlimited" && <button className="px-btn sm" onClick={() => { window.location.href = "/arcade/abyss/unlimited"; }}>DIVE AGAIN</button>}
                <Link className="px-btn sm" href="/arcade/abyss">BACK</Link>
              </div>
            </div>
          ) : <div className="px-plate px-donecard"><p className="px-err">{err ?? "SOMETHING WENT WRONG"}</p><Link className="px-btn sm" href="/arcade/abyss">BACK</Link></div>}
        </div>
      )}
      {menu && <PixelMenu onClose={() => setMenu(false)} signedIn={!!me?.signedIn} />}
    </div>
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
