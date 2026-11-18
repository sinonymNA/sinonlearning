"use client";

/* eslint-disable react/no-unescaped-entities, react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/refs */
import { useEffect, useRef, useState } from "react";
import Avatar from "../Avatar";
import { usePrefs } from "../prefs";
import PotatoSvg from "../PotatoSvg";
import { sfx } from "../prefs";
import { Timer } from "../ui";
import { useRemaining } from "../useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
const HEAT_LABEL = ["Warm", "Getting hot!", "HOT!!", "ABOUT TO BLOW!!!"];

/** The potato visibly flies from the old holder's avatar to the new holder's avatar whenever it is passed. */
export function usePotatoFlight(grp: any, calm: boolean) {
  const lastN = useRef<number | null>(null);
  useEffect(() => {
    const lp = grp?.lastPass;
    if (!lp) { lastN.current = null; return; }
    const key = grp.round * 1000 + lp.n;
    if (lastN.current === null) { lastN.current = key; return; }
    if (lastN.current === key) return;
    lastN.current = key;
    if (calm || typeof document === "undefined") return;
    const a = document.querySelector(`[data-pid="${lp.from}"]`) as HTMLElement | null, b = document.querySelector(`[data-pid="${lp.to}"]`) as HTMLElement | null;
    if (!a || !b) return;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const el = document.createElement("div");
    el.textContent = "🥔"; el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:fixed;left:0;top:0;z-index:60;font-size:52px;line-height:1;pointer-events:none;filter:drop-shadow(0 4px 0 rgba(0,0,0,.35))";
    document.body.appendChild(el);
    const x0 = ra.left + ra.width / 2 - 26, y0 = ra.top + ra.height / 2 - 26, x1 = rb.left + rb.width / 2 - 26, y1 = rb.top + rb.height / 2 - 26;
    const lift = Math.min(140, Math.max(60, Math.hypot(x1 - x0, y1 - y0) * 0.35));
    const anim = el.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.8) rotate(0deg)` },
      { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - lift}px) scale(1.5) rotate(200deg)`, offset: 0.5 },
      { transform: `translate(${x1}px,${y1}px) scale(1) rotate(400deg)` },
    ], { duration: 650, easing: "cubic-bezier(.4,0,.3,1)" });
    anim.onfinish = () => el.remove();
    setTimeout(() => el.remove(), 900);
    sfx("whoosh");
  }, [grp?.lastPass?.n, grp?.round, calm]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function PotatoGroup({ grp, meId, big = false }: { grp: any; meId?: string; big?: boolean }) {
  return <><PotatoStage grp={grp} meId={meId} big={big} /><PotatoMembers grp={grp} meId={meId} big={big} /></>;
}

export function PotatoStage({ grp, meId, big = false, stamp }: { grp: any; meId?: string; big?: boolean; stamp?: number }) {
  const holdLeft = useRemaining(stamp !== undefined ? grp.holdIn : null, stamp ?? 0);
  const holder = grp.members.find((m: any) => m.id === grp.holder);
  const boom = grp.status === "boom";
  const victim = grp.members.find((m: any) => m.id === grp.boomVictim);
  return (
    <div className="relative">
      <div className="relative mx-auto flex flex-col items-center text-center">
        {grp.status === "live" && (
          <div className="mb-2 flex gap-2" aria-label={`Letters: ${grp.sequence}`}>
            {String(grp.sequence).split("").map((ch: string, i: number) => (
              <span key={`${grp.turn}-${i}`} className="hp-tile pop grid place-items-center rounded-xl border-[3px] border-[var(--ink)] bg-[var(--sun)] font-bold text-[var(--ink)] shadow-[0_5px_0_var(--ink)]" style={{ width: big ? 96 : 64, height: big ? 110 : 74, fontSize: big ? "3.8rem" : "2.6rem", animationDelay: `${i * 0.05}s` }}>{ch}</span>
            ))}
          </div>
        )}
        <div className="hp-potato relative" style={{ minHeight: big ? 280 : 210 }}>
          {boom && <span className="boom-ring" />}
          <div className={`potato h${grp.heat}`} style={{ fontSize: 0 }} key={`${grp.turn}-${grp.status}`}>
            <PotatoSvg heat={grp.heat} mode={boom ? "boom" : grp.status === "done" ? "done" : "live"} size={big ? 230 : 180} />
          </div>
        </div>
        {grp.status === "live" && <div className="font-bold" style={{ color: grp.heat >= 2 ? "var(--coral)" : "var(--muted)" }}>{HEAT_LABEL[grp.heat]}</div>}
        {grp.status === "live" && holder && <div className="mt-1 text-lg font-bold">{holder.id === meId ? "YOU have the potato!" : `${holder.nickname} has the potato`}</div>}
        {grp.status === "live" && holder && stamp !== undefined && holdLeft !== null && (
          <div className="mt-1 w-full max-w-xs" aria-label="Hot hands timer">
            <div className="ar-timer" style={{ height: 10 }}><i style={{ width: `${Math.max(0, Math.min(100, (holdLeft / Math.max(1, grp.holdMs)) * 100))}%`, background: holdLeft < 2500 ? "var(--coral)" : "var(--sun)" }} /></div>
            <div className="text-xs font-bold" style={{ color: holdLeft < 2500 ? "var(--coral)" : "var(--muted)" }}>{holder.id === meId ? `Hot hands! Pass it in ${Math.ceil(holdLeft / 1000)}s or it jumps!` : `${holder.nickname} must pass in ${Math.ceil(holdLeft / 1000)}s`}</div>
          </div>
        )}
        {grp.status === "live" && holder && holder.id !== meId && (
          <div className="draft" aria-live="off" aria-label="What they're typing">{grp.draft}<i /></div>
        )}
        {boom && <div className="mt-1"><span className="stamp" style={{ color: "var(--sun)" }}>BOOM!</span><div className="mt-2 text-xl font-bold">{victim?.nickname} lost a heart</div></div>}
        {boom && grp.boomResults?.length > 0 && <div className="mt-2 flex flex-wrap justify-center gap-2">{grp.boomResults.map((r: any) => <span key={r.id} className="slide ar-pill">🎯 {r.nickname} +{r.pts}</span>)}</div>}
        {grp.status === "done" && <div className="pop mt-1 text-xl font-bold text-[var(--sun)]">{grp.winner ? `${grp.members.find((m: any) => m.id === grp.winner)?.nickname} survived!` : "Group finished"}</div>}
      </div>
    </div>
  );
}

export function PotatoMembers({ grp, meId, big = false }: { grp: any; meId?: string; big?: boolean }) {
  return (
    <div className="relative">
      <div className="hp-members mt-4 grid grid-cols-[repeat(auto-fit,minmax(86px,1fr))] gap-3">
        {grp.members.map((m: any) => {
          const isHolder = grp.status === "live" && m.id === grp.holder;
          return (
            <div key={m.id} data-pid={m.id} className={`ar-av ${m.hearts <= 0 ? "off" : ""} ${m.connected ? "" : "off"}`}>
              <div className={`relative ${isHolder ? "float" : ""}`} style={{ outline: isHolder ? "4px solid var(--sun)" : undefined, borderRadius: 18, padding: 4, background: isHolder ? "rgba(255,194,51,.25)" : undefined }}>
                <Avatar id={m.avatar} size={big ? 72 : 56} />
                {isHolder && <span className="absolute -top-3 -right-2 text-2xl">🥔</span>}
              </div>
              <span className="nm">{m.id === meId ? "You" : m.nickname}</span>
              <span aria-label={`${Math.max(0, m.hearts)} hearts`}>{[0, 1, 2].map((i) => <span key={i} style={{ opacity: i < m.hearts ? 1 : 0.2 }}>❤️</span>)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HotPotato({ view, stamp, send, meId }: any) {
  const g = view.game, grp = g.group;
  const [word, setWord] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [fx, setFx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const { prefs } = usePrefs();
  usePotatoFlight(grp, prefs.calm);
  const lastDraft = useRef({ at: 0, text: "" });
  const prev = useRef<{ boom?: boolean; holder?: boolean }>({});

  useEffect(() => {
    if (!grp) return;
    if (grp.status === "boom" && !prev.current.boom) { sfx("boom"); setFx((n) => n + 1); }
    if (grp.you?.holder && !prev.current.holder) { sfx("whoosh"); setTimeout(() => input.current?.focus(), 30); setErr(null); setWord(""); }
    prev.current = { boom: grp.status === "boom", holder: grp.you?.holder };
  }, [grp]);
  // ticking gets faster as the potato heats up
  useEffect(() => {
    if (!grp || grp.status !== "live" || grp.heat < 1) return;
    const every = [0, 1100, 560, 260][grp.heat];
    const t = setInterval(() => sfx("tick"), every);
    return () => clearInterval(t);
  }, [grp?.heat, grp?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!grp) return <div className="ar-panel">You'll join the next game!</div>;
  const canType = grp.status === "live" && (grp.you?.holder || (grp.you?.ghost && grp.you?.assistLeft));

  function onType(v: string) {
    setWord(v);
    if (!grp.you?.holder) return;
    const now = performance.now();
    if (now - lastDraft.current.at > 320 && v !== lastDraft.current.text) { lastDraft.current = { at: now, text: v }; send({ type: "draft", text: v }).catch(() => undefined); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim()) return;
    try { const r = await send({ type: "word", word, turn: grp.turn }); setWord(""); setErr(null); sfx("good"); if (r?.assist) setErr("Nice! You cooled the potato a little."); else if (r?.quick) setErr("⚡ Quick pass bonus!"); }
    catch (e2: any) { setErr(e2.message); setShake((s) => s + 1); sfx("bad"); }
  }
  async function boomGuess() { try { await send({ type: "boom" }); sfx("pop"); } catch (e: any) { setErr(e.message); } }

  return (
    <div className={`grid gap-4 ${grp.status === "boom" ? "bigshake" : ""}`} key={grp.status === "boom" ? `b${fx}` : "n"}>
      {fx > 0 && grp.status === "boom" && <div className="flashfx" key={fx} />}
      {grp.status === "live" && grp.heat >= 3 && <div className="heatglow" />}
      <div className="hp-layout">
      <div className="grid gap-3 content-start">
      <div className="grid grid-cols-2 items-end gap-4">
        <div className="font-bold">Round {grp.round}/{grp.maxRounds}</div>
        <Timer ms={g.endsIn} stamp={stamp} total={210000} label="Game" />
      </div>
      <div className="ar-panel"><PotatoStage grp={grp} meId={meId} stamp={stamp} /></div>
      </div>
      <div className="grid gap-3 content-start">
      <div className="ar-panel"><PotatoMembers grp={grp} meId={meId} /></div>

      {canType && (
        <form onSubmit={submit} key={shake} className={`ar-card ${shake ? "shake" : ""}`}>
          <label className="mb-2 block font-bold">
            {grp.you.holder ? <>Type a word containing <span className="rounded bg-[var(--sun)] px-2">{grp.sequence}</span> to pass the potato!</> : <>You're out - but you can still help! A valid word with <b>{grp.sequence}</b> cools the potato.</>}
          </label>
          <div className="flex gap-2">
            <input ref={input} className="ar-input" value={word} onChange={(e) => onType(e.target.value)} autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="send" placeholder="type here…" aria-label="Your word" />
            <button className="ar-btn coral" type="submit">{grp.you.holder ? "PASS!" : "Help"}</button>
          </div>
          <p role="status" className="mt-2 min-h-6 font-bold text-[var(--coral)]">{err}</p>
        </form>
      )}
      {grp.status === "live" && !grp.you?.holder && (
        <div className="ar-panel grid gap-3 text-center">
          <button className="ar-btn xl coral boomguess" disabled={grp.you?.boomGuessed} onClick={boomGuess}>
            {grp.you?.boomGuessed ? "🎯 Guess locked - wait for the boom…" : "💥 I think it blows NOW!"}
          </button>
          <p className="ar-muted text-sm">Closest to the real explosion wins up to 15 points. One guess per round.</p>
          <div className="flex flex-wrap justify-center gap-2">{g.reactions.map((emo: string) => <button key={emo} className="ar-btn sm paper" onClick={() => { send({ type: "react", emoji: emo }).catch(() => undefined); sfx("pop"); }} aria-label={`React ${emo}`}>{emo}</button>)}</div>
        </div>
      )}
      <div className="flex min-h-10 flex-wrap items-center gap-3" aria-live="polite">
        {grp.lastPass && <span key={grp.lastPass.n} className="slide ar-pill">🥔 {grp.members.find((m: any) => m.id === grp.lastPass.from)?.nickname} → {grp.members.find((m: any) => m.id === grp.lastPass.to)?.nickname}: {grp.lastPass.stalled ? <b>too slow! (-5, shorter fuse)</b> : <b>{grp.lastPass.word}</b>}</span>}
        {grp.reactions.map((r: any) => <span key={r.at + r.from} className="pop text-2xl">{r.emoji}</span>)}
      </div>
      </div>
      </div>
    </div>
  );
}
