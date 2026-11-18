"use client";

/* eslint-disable react/no-unescaped-entities, react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import Avatar from "../Avatar";
import { sfx } from "../prefs";
import { BigCountdown, Timer } from "../ui";
import { useRemaining } from "../useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
const KEY_COLORS = ["#ff5d73", "#4cc3ff", "#ffb02e", "#2fd1a5"];

export function Arena({ g, meId, size = 46 }: { g: any; meId?: string; size?: number }) {
  const lr = g.lastRound;
  const gone = new Set(lr?.eliminated ?? []);
  const alive = g.players.filter((p: any) => p.alive || (gone.has(p.id) && g.phase === "reveal"));
  return (
    <div>
      <div className="arena" aria-label={`${g.aliveCount} players on the platform`}>
        {alive.map((p: any) => (
          <div key={p.id} className={gone.has(p.id) && g.phase === "reveal" ? "out" : ""} style={{ textAlign: "center", marginBottom: -4 }}>
            <Avatar id={p.avatar} size={size} />
            {p.id === meId && <div className="text-[10px] font-bold leading-none text-[var(--sun)]">YOU</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LastOne({ view, stamp, send, meId, projector = false }: any) {
  const g = view.game;
  const [picked, setPicked] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const qKey = g.asked;
  useEffect(() => { setPicked(null); setErr(null); }, [qKey]);
  const open = useRemaining(g.openIn, stamp);
  const last = useRef<string>("");
  useEffect(() => {
    const k = `${g.phase}${g.asked}`; if (k === last.current) return; last.current = k;
    if (g.phase === "reveal") { if (g.lastRound?.eliminated?.includes(meId)) sfx("bad"); else if (g.you?.alive) sfx("good"); sfx("reveal"); }
  }, [g.phase, g.asked, g.lastRound, g.you, meId]);

  const you = g.you;
  const reveal = g.phase === "reveal" || g.phase === "done";
  const canAnswer = !projector && g.phase === "question" && !you?.answered && (open ?? 0) <= 0;

  async function answer(i: number) {
    setPicked(i); sfx("pop");
    try { await send({ type: "answer", choice: i }); } catch (e: any) { setErr(e.message); setPicked(null); }
  }

  const lr = g.lastRound;
  return (
    <div className="grid gap-4">
      <div className="ar-panel">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-bold">
          <span className="ar-pill">{g.finale ? "🔥 FINAL SHOWDOWN" : `Round ${g.round}`}</span>
          <span className="text-xl"><span className="tabular-nums">{g.aliveCount}</span> standing {g.aliveCount > 1 && <span className="ar-muted">→ {g.target} advance</span>}</span>
        </div>
        <Arena g={g} meId={meId} size={projector ? 64 : g.aliveCount > 20 ? 34 : 46} />
      </div>

      {g.phase === "ready" && (
        <div className="ar-card text-center">
          <p className="font-bold">{g.finale ? "Two players. One question. Fastest correct answer wins!" : lr?.retry ? lr.retry : "Get ready - fastest correct answers stay on the platform!"}</p>
          <BigCountdown ms={g.openIn} stamp={stamp} />
          {g.question && <p className="mt-2 text-xl font-bold opacity-0" aria-hidden>{g.question.q}</p>}
        </div>
      )}

      {(g.phase === "question" || reveal) && g.question && (
        <div className="grid gap-3">
          <div className="ar-card"><h2 className="ar-h2" style={{ fontSize: projector ? "2.6rem" : undefined }}>{g.question.q}</h2></div>
          {g.phase === "question" && <Timer ms={g.closeIn} stamp={stamp} total={g.windowMs} label={you?.alive === false ? "Consolation round" : "Answer window"} />}
          <div className={`grid gap-3 ${projector ? "grid-cols-2" : ""}`}>
            {g.question.choices.map((c: string, i: number) => {
              const isRight = reveal && g.correct === i;
              const isWrongPick = reveal && you?.choice === i && g.correct !== i;
              return (
                <button key={i} className={`choice ${picked === i || you?.choice === i ? "picked" : ""} ${isRight ? "right" : ""} ${isWrongPick ? "wrong" : ""}`} disabled={!canAnswer || picked !== null} onClick={() => answer(i)} aria-label={`Answer ${"ABCD"[i]}: ${c}`}>
                  <span className="k" style={{ background: KEY_COLORS[i] }}>{"ABCD"[i]}</span><span className="flex-1">{c}</span>
                  {reveal && lr?.counts && <span className="ar-chip tabular-nums">{lr.counts[i]}</span>}
                </button>
              );
            })}
          </div>
          {!projector && g.phase === "question" && (you?.answered || picked !== null) && <p className="pop text-center text-lg font-bold">🔒 Locked in! {g.answeredCount}/{g.total} answered…</p>}
          {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
        </div>
      )}

      {!projector && you && g.phase === "question" && you.alive === false && <div className="ar-panel text-center font-bold">🪂 You're in the <span className="text-[var(--sun)]">Consolation Round</span> - answer fast to score points!</div>}
      {reveal && lr && (
        <div className="ar-panel slide text-center">
          {lr.retry ? <p className="ar-h2">{lr.retry}</p> : (
            <>
              {g.phase === "done" ? (
                <p className="ar-h2 pop">🏆 {g.players.find((p: any) => p.id === g.winner)?.nickname ?? "Nobody"} is the Last One Standing!</p>
              ) : you?.alive && lr.advanced.includes(meId) ? <p className="ar-h2 pop text-[var(--mint)]">You advance! {lr.tie ? "(won the tie-break draw)" : ""}</p>
                : you ? <p className="ar-h2 shake text-[var(--coral)]">{you.answered && you.correct ? "So close - too slow!" : "You're off the platform!"} Keep playing in the consolation round.</p> : null}
              <p className="ar-muted mt-1">{lr.advanced.length} advance · {lr.eliminated.length} eliminated{lr.tie ? " · tie window used (fair random draw)" : ""}</p>
            </>
          )}
        </div>
      )}
      {g.consolation?.length > 0 && !projector && (
        <div className="ar-panel"><h3 className="font-bold">🪂 Consolation leaders</h3><ol className="mt-1">{g.consolation.map((c: any, i: number) => <li key={c.id}>{i + 1}. {c.nickname} <b>{c.score}</b></li>)}</ol></div>
      )}
    </div>
  );
}
