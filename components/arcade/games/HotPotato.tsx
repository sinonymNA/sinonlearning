"use client";

/* eslint-disable react/no-unescaped-entities */

import { useEffect, useRef, useState } from "react";
import Avatar from "../Avatar";
import { sfx } from "../prefs";
import { Timer } from "../ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
const HEAT_LABEL = ["Warm", "Getting hot!", "HOT!!", "ABOUT TO BLOW!!!"];

export function PotatoGroup({ grp, meId, big = false }: { grp: any; meId?: string; big?: boolean }) {
  const holder = grp.members.find((m: any) => m.id === grp.holder);
  const boom = grp.status === "boom";
  return (
    <div className="relative">
      <div className="relative mx-auto flex flex-col items-center text-center">
        {grp.status === "live" && (
          <div className="mb-1 flex gap-2" aria-label={`Letters: ${grp.sequence}`}>
            {String(grp.sequence).split("").map((ch: string, i: number) => (
              <span key={`${grp.turn}-${i}`} className="pop grid place-items-center rounded-xl border-[3px] border-[var(--ink)] bg-[var(--sun)] font-bold text-[var(--ink)] shadow-[0_4px_0_var(--ink)]" style={{ width: big ? 84 : 58, height: big ? 96 : 66, fontSize: big ? "3.4rem" : "2.4rem", animationDelay: `${i * 0.05}s` }}>{ch}</span>
            ))}
          </div>
        )}
        <div className="relative">
          {boom && <span className="boom-ring" />}
          <span className={`potato h${grp.heat}`} key={`${grp.turn}-${grp.status}`} aria-hidden>{boom ? "💥" : grp.status === "done" ? "🏆" : "🥔"}</span>
        </div>
        {grp.status === "live" && <div className="font-bold" style={{ color: grp.heat >= 2 ? "var(--coral)" : "var(--muted)" }}>{HEAT_LABEL[grp.heat]}</div>}
        {grp.status === "live" && holder && <div className="mt-1 text-lg font-bold">{holder.id === meId ? "YOU have the potato!" : `${holder.nickname} has the potato`}</div>}
        {boom && <div className="shake mt-1 text-xl font-bold text-[var(--sun)]">💥 {grp.members.find((m: any) => m.id === grp.boomVictim)?.nickname} lost a heart!</div>}
        {grp.status === "done" && <div className="pop mt-1 text-xl font-bold text-[var(--sun)]">{grp.winner ? `${grp.members.find((m: any) => m.id === grp.winner)?.nickname} survived!` : "Group finished"}</div>}
      </div>
      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(86px,1fr))] gap-3">
        {grp.members.map((m: any) => {
          const isHolder = grp.status === "live" && m.id === grp.holder;
          return (
            <div key={m.id} className={`ar-av ${m.hearts <= 0 ? "off" : ""} ${m.connected ? "" : "off"}`}>
              <div className={`relative ${isHolder ? "float" : ""}`} style={{ outline: isHolder ? "4px solid var(--sun)" : undefined, borderRadius: 18, padding: 4, background: isHolder ? "rgba(255,194,51,.25)" : undefined }}>
                <Avatar id={m.avatar} size={big ? 72 : 56} />
                {isHolder && <span className="absolute -top-3 -right-2 text-2xl wobble">🥔</span>}
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
  const input = useRef<HTMLInputElement>(null);
  const prev = useRef<{ turn?: number; boom?: boolean; holder?: boolean }>({});

  useEffect(() => {
    if (!grp) return;
    if (grp.status === "boom" && !prev.current.boom) sfx("boom");
    if (grp.you?.holder && !prev.current.holder) { sfx("whoosh"); setTimeout(() => input.current?.focus(), 30); setErr(null); }
    prev.current = { turn: grp.turn, boom: grp.status === "boom", holder: grp.you?.holder };
  }, [grp]);
  useEffect(() => { if (grp?.status === "live" && grp.heat >= 2) sfx("tick"); }, [grp?.heat, grp?.status]);

  if (!grp) return <div className="ar-panel">You'll join the next game!</div>;
  const canType = grp.status === "live" && (grp.you?.holder || (grp.you?.ghost && grp.you?.assistLeft));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim()) return;
    try { const r = await send({ type: "word", word, turn: grp.turn }); setWord(""); setErr(null); sfx("good"); if (r?.assist) setErr("Nice! You cooled the potato a little."); }
    catch (e2: any) { setErr(e2.message); setShake((s) => s + 1); sfx("bad"); }
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 items-end gap-4">
        <div className="font-bold">Round {grp.round}/{grp.maxRounds}</div>
        <Timer ms={g.endsIn} stamp={stamp} total={170000} label="Game" />
      </div>
      <div className="ar-panel"><PotatoGroup grp={grp} meId={meId} /></div>

      {canType && (
        <form onSubmit={submit} key={shake} className={`ar-card ${shake ? "shake" : ""}`}>
          <label className="mb-2 block font-bold">
            {grp.you.holder ? <>Type a word containing <span className="rounded bg-[var(--sun)] px-2">{grp.sequence}</span> to pass the potato!</> : <>You're out - but you can still help! A valid word with <b>{grp.sequence}</b> cools the potato.</>}
          </label>
          <div className="flex gap-2">
            <input ref={input} className="ar-input" value={word} onChange={(e) => setWord(e.target.value)} autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="send" placeholder="type here…" aria-label="Your word" />
            <button className="ar-btn coral" type="submit">{grp.you.holder ? "PASS!" : "Help"}</button>
          </div>
          <p role="status" className="mt-2 min-h-6 font-bold text-[var(--coral)]">{err}</p>
        </form>
      )}
      {!canType && grp.status === "live" && (
        <div className="ar-panel text-center">
          <p className="mb-3 font-bold">{grp.you?.ghost ? "The potato can't cool down any more this round. Cheer them on!" : "Not yours yet… be ready! React:"}</p>
          <div className="flex flex-wrap justify-center gap-2">{g.reactions.map((emo: string) => <button key={emo} className="ar-btn sm paper" onClick={() => { send({ type: "react", emoji: emo }).catch(() => undefined); sfx("pop"); }} aria-label={`React ${emo}`}>{emo}</button>)}</div>
        </div>
      )}
      <div className="flex min-h-10 flex-wrap items-center gap-3" aria-live="polite">
        {grp.lastPass && <span key={grp.lastPass.n} className="slide ar-pill">🥔 {grp.members.find((m: any) => m.id === grp.lastPass.from)?.nickname} → {grp.members.find((m: any) => m.id === grp.lastPass.to)?.nickname}: <b>{grp.lastPass.word}</b></span>}
        {grp.reactions.map((r: any) => <span key={r.at + r.from} className="pop text-2xl">{r.emoji}</span>)}
      </div>
    </div>
  );
}
