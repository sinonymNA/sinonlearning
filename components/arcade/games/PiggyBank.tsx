"use client";

/* eslint-disable react/no-unescaped-entities, react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/refs */
import { useEffect, useRef, useState } from "react";
import Avatar from "../Avatar";
import { sfx } from "../prefs";
import { BigCountdown, Timer } from "../ui";
import { useRemaining } from "../useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
const KEY_COLORS = ["#ff5d73", "#4cc3ff", "#ffb02e", "#2fd1a5"];

export function feedLine(f: any, name: (id: string) => string): string | null {
  switch (f.kind) {
    case "steal": return `🕶️ ${name(f.actor)} stole ${f.amount} from ${name(f.victim)}!`;
    case "blocked": return `🛡️ ${name(f.victim)}'s shield blocked ${name(f.actor)}!`;
    case "swap": return `🔄 ${name(f.actor)} swapped piggy banks with ${name(f.victim)}!`;
    case "jackpot": return `🎰 ${name(f.actor)} hit the JACKPOT! +700`;
    case "oops": return `🙈 ${name(f.actor)} tripped and dropped ${f.amount}`;
    default: return null;
  }
}

function resultText(r: any, name: (id: string) => string) {
  if (!r) return "";
  switch (r.text) {
    case "steal": return `You stole ${r.delta} from ${name(r.victim)}! 🕶️`;
    case "blocked": return `${name(r.victim)} had a shield - blocked! 🛡️`;
    case "swap": return `You swapped banks with ${name(r.victim)}! ${r.delta >= 0 ? `(+${r.delta})` : `(${r.delta})`} 🔄`;
    case "jackpot": return "JACKPOT!! +700 🎰";
    case "oops": return `Oops! You dropped ${-r.delta} 🙈`;
    case "squeal": return "The pig squealed - only +40 🐷";
    default: return `+${r.delta} coins 🪙${r.shield ? " and a shield 🛡️!" : ""}`;
  }
}

export default function PiggyBank({ view, stamp, send, meId, projector = false }: any) {
  const g = view.game, you = g.you;
  const [picked, setPicked] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [robbed, setRobbed] = useState<{ n: number; text: string } | null>(null);
  const seenFeed = useRef<number>(-1);
  const name = (id: string) => (id === meId ? "You" : g.players.find((p: any) => p.id === id)?.nickname ?? "?");
  const open = useRemaining(g.openIn, stamp);
  useEffect(() => { setPicked(null); setErr(null); }, [g.round]);

  // react to being robbed
  useEffect(() => {
    const feed: any[] = g.feed ?? [];
    const idx = feed.length ? feed[feed.length - 1].r * 100 + feed.length : 0;
    if (seenFeed.current === -1) { seenFeed.current = idx; return; }
    const latest = feed[feed.length - 1];
    if (latest && idx !== seenFeed.current) {
      seenFeed.current = idx;
      if (latest.kind === "steal" && latest.victim === meId) { sfx("bad"); setRobbed({ n: Date.now(), text: `${name(latest.actor)} stole ${latest.amount} from you!` }); setTimeout(() => setRobbed(null), 3500); }
      else if (latest.actor === meId && ["steal", "jackpot", "swap"].includes(latest.kind)) sfx("win");
    }
  }, [g.feed]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (g.phase === "chest") sfx("whoosh"); }, [g.phase, g.round]);

  const question = g.question;
  const reveal = g.phase === "reveal" || g.phase === "done";
  const canAnswer = !projector && g.phase === "question" && !you?.answered && (open ?? 0) <= 0;
  async function answer(i: number) { setPicked(i); sfx("pop"); try { await send({ type: "answer", choice: i }); } catch (e: any) { setErr(e.message); setPicked(null); } }
  async function pick(chest: string) {
    try { const r = await send({ type: "pick", chest }); sfx(r?.result?.delta < 0 ? "bad" : "good"); } catch (e: any) { setErr(e.message); }
  }
  const lines = (g.feed ?? []).map((f: any) => feedLine(f, name)).filter(Boolean).slice(-5);

  return (
    <div className={`grid gap-3 ${robbed ? "shake" : ""}`}>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <span className="ar-pill">Round {g.round}/{g.rounds}</span>
        {g.phase === "question" ? <Timer ms={g.closeIn} stamp={stamp} total={g.windowMs} label="Answer window" /> : g.phase === "chest" ? <Timer ms={g.chestIn} stamp={stamp} total={g.chestMs} label="Pick a chest" /> : <span />}
        {you && <span className="ar-pill" style={{ background: "var(--sun)", color: "var(--ink)", fontSize: "1.05rem" }}>🐷 {you.bank}{you.shield ? " 🛡️" : ""}</span>}
      </div>
      {robbed && <div key={robbed.n} className="pop ar-panel text-center text-xl font-bold text-[var(--coral)]">😱 {robbed.text}</div>}

      {g.phase === "ready" && <div className="ar-card text-center"><p className="font-bold">Answer right → fill your piggy → pick a chest!</p><BigCountdown ms={g.openIn} stamp={stamp} /></div>}

      {(g.phase === "question" || reveal || g.phase === "chest") && question && (
        <div className="grid gap-3">
          <div className="ar-card"><h2 className="ar-h2" style={{ fontSize: projector ? "2.2rem" : undefined }}>{question.q}</h2></div>
          {(g.phase === "question" || reveal) && (
            <div className={`fit-2col grid gap-3 ${projector ? "grid-cols-2" : ""}`}>
              {question.choices.map((c: string, i: number) => {
                const right = reveal && g.correct === i, wrongPick = reveal && you?.choice === i && g.correct !== i;
                return <button key={i} className={`choice ${picked === i || you?.choice === i ? "picked" : ""} ${right ? "right" : ""} ${wrongPick ? "wrong" : ""}`} disabled={!canAnswer || picked !== null} onClick={() => answer(i)}><span className="k" style={{ background: KEY_COLORS[i] }}>{"ABCD"[i]}</span><span className="flex-1">{c}</span></button>;
              })}
            </div>
          )}
          {g.phase === "question" && (you?.answered || picked !== null) && <p className="pop text-center font-bold">🔒 Locked in! {g.answeredCount}/{g.total} answered…</p>}
        </div>
      )}

      {g.phase === "chest" && !projector && you && (
        <div className="ar-panel grid gap-3">
          <p className="text-center font-bold">{you.correct ? "✅ Correct! All chests unlocked - pick one!" : "❌ Not this time - WILD is locked. Pick a chest anyway!"} <span className="ar-muted">({g.pickedCount}/{g.total} picked)</span></p>
          {you.picked ? (
            <div className="ar-card pop text-center"><p className="text-xl font-bold">{resultText(you.result, name)}</p><p className="ar-muted text-sm">Waiting for the others…</p></div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <button className="chest" style={{ background: "#9fe3b1" }} onClick={() => pick("safe")}><span className="big">🔒</span>SAFE<small>+{you.correct ? 120 : 60} coins, maybe a shield</small></button>
              <button className="chest" style={{ background: "#ffb27a" }} onClick={() => pick("spicy")}><span className="big">🌶️</span>SPICY<small>Try to steal {you.correct ? "20%" : "10%"} from a rival</small></button>
              <button className="chest" style={{ background: "#c9a6ff" }} disabled={!you.canWild} onClick={() => pick("wild")}><span className="big">{you.canWild ? "🎰" : "🔐"}</span>WILD<small>{you.canWild ? "Jackpot · steal from the leader · swap banks · or oops" : "Answer correctly to unlock"}</small></button>
            </div>
          )}
          {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
        </div>
      )}
      {g.phase === "chest" && projector && <div className="ar-panel text-center ar-h2">🎁 Everyone is picking a chest… {g.pickedCount}/{g.total}</div>}

      {lines.length > 0 && (
        <div className="ar-panel" aria-live="polite"><h3 className="mb-1 font-bold">🐷 Heist feed</h3>
          <ul className="grid gap-1 text-sm">{lines.map((l: string, i: number) => <li key={i} className="slide">{l}</li>)}</ul></div>
      )}
      {reveal && you && <div className="ar-panel slide text-center"><p className="font-bold">Your piggy: <span className="text-[var(--sun)]">{you.bank}</span> coins · rank #{you.rank} of {g.players.length}</p></div>}
      {g.phase === "done" && <div className="ar-panel text-center ar-h2">🏆 {g.players[0]?.nickname} has the fattest piggy!</div>}
      {projector && <div className="grid grid-cols-5 gap-2">{g.players.slice(0, 10).map((p: any) => <div key={p.id} className="ar-panel flex items-center gap-2" style={{ padding: 6 }}><Avatar id={p.avatar} size={30} /><span className="truncate text-sm font-bold">{p.nickname}</span><b className="ml-auto tabular-nums">{p.bank}</b></div>)}</div>}
    </div>
  );
}
