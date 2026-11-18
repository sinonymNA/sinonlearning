"use client";

 

import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "../Avatar";
import { DrawPad, StrokeViewer } from "../DrawingCanvas";
import { sfx } from "../prefs";
import { Timer } from "../ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function QuickDraw({ view, stamp, send, meId, optsRef, projector = false }: any) {
  const g = view.game, grp = g.group;
  const [guess, setGuess] = useState("");
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const draw = grp?.draw;
  const onCursor = useCallback((c: { key: number; from: number }) => { optsRef.current = { ...optsRef.current, draw: c }; }, [optsRef]);
  const lastTurn = useRef(-1);
  useEffect(() => {
    if (!grp) return;
    if (grp.turn !== lastTurn.current) { lastTurn.current = grp.turn; setMsg(null); setGuess(""); }
    if (grp.status === "reveal") sfx("reveal");
  }, [grp?.turn, grp?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (grp?.you?.guessed) sfx("good"); }, [grp?.you?.guessed]);

  const onSegs = useCallback((segs: any[]) => send({ type: "draw", segs }), [send]);
  if (!grp) return <div className="ar-panel text-center">Getting your group ready…</div>;
  if (grp.status === "done") return <div className="ar-panel text-center"><p className="ar-h2">🎨 Your group is done!</p><p className="ar-muted mt-2">Waiting for the other groups to finish…</p></div>;
  const isArtist = grp.you?.artist;
  if (grp.status === "pick") {
    return (
      <div className="grid gap-4 text-center">
        <div className="ar-panel"><p className="ar-muted font-bold">Round {grp.turn}/{grp.turns}</p><Timer ms={grp.endsIn} stamp={stamp} total={5000} label="Choose" /></div>
        {isArtist && !projector ? (
          <div className="ar-panel grid gap-3"><p className="ar-h2">Pick your word!</p>
            <div className="grid gap-3 sm:grid-cols-3">{grp.options?.map((w: string, i: number) => <button key={w} className="choice pop" style={{ justifyContent: "center", animationDelay: `${i * 0.08}s` }} onClick={() => send({ type: "choose", index: i }).catch(() => undefined)}>{w}</button>)}</div>
            <p className="ar-muted text-sm">Nobody else can see these. Pick something you can draw fast!</p></div>
        ) : <div className="ar-panel"><p className="ar-h2 float">✏️ {grp.artistName} is choosing a word…</p></div>}
      </div>
    );
  }

  async function sendGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!guess.trim()) return;
    try {
      const r = await send({ type: "guess", text: guess });
      setGuess("");
      if (r.correct) { setMsg({ t: `✅ Correct! +${r.points}`, ok: true }); } else setMsg({ t: r.close ? "🔥 So close!" : "Nope, keep guessing!" });
    } catch (e2: any) { setMsg({ t: e2.message }); }
    input.current?.focus();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="grid gap-3">
        <div className="ar-panel grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
            <span>Round {grp.turn}/{grp.turns} · <Avatar id={grp.members.find((m: any) => m.id === grp.artist)?.avatar} size={28} className="inline" /> {isArtist ? "You're drawing!" : `${grp.artistName} is drawing`}</span>
            {grp.status === "draw" && <span className="ar-chip">{grp.guessedCount}/{grp.members.length - 1} guessed</span>}
          </div>
          {grp.status === "draw" ? <Timer ms={grp.endsIn} stamp={stamp} total={grp.totalMs} /> : null}
          {grp.status === "draw" && (
            <div className="text-center">
              {isArtist ? <p className="ar-h2">Draw: <span className="rounded-xl bg-[var(--sun)] px-3 text-[var(--ink)]">{grp.word}</span></p>
                : <p className="ar-h2 tracking-[.25em]" aria-label={`Word has ${grp.mask?.replace(/[^_]/g, "").length} hidden letters`}>{grp.mask}</p>}
            </div>
          )}
          {grp.status === "reveal" && <p className="pop ar-h2 text-center">The word was <span className="rounded-xl bg-[var(--mint)] px-3 text-[var(--ink)]">{grp.word}</span> {grp.note && <span className="block text-base ar-muted">{grp.note}</span>}</p>}
          {grp.status === "pause" && <p className="text-center font-bold">Next artist up…</p>}
        </div>

        {isArtist && grp.status === "draw" && !projector ? <DrawPad onSegs={onSegs} resetKey={grp.draw.key} /> : <StrokeViewer draw={draw} onCursor={onCursor} />}

        {!isArtist && !projector && grp.status === "draw" && (
          grp.you?.guessed ? <div className="ar-card pop text-center ar-h2">🎉 You got it! +{grp.you.points}</div> : (
            <form onSubmit={sendGuess} className="ar-card">
              <div className="flex gap-2"><input ref={input} autoFocus className="ar-input" value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Type your guess…" aria-label="Your guess" autoComplete="off" autoCapitalize="off" spellCheck={false} /><button className="ar-btn mint" type="submit">Guess</button></div>
              <p role="status" className="mt-2 min-h-6 font-bold" style={{ color: msg?.ok ? "#168a69" : "var(--coral)" }}>{msg?.t}</p>
            </form>
          )
        )}
      </div>
      <div className="ar-panel">
        <h3 className="mb-2 font-bold">Your group</h3>
        <ul className="grid gap-2">
          {[...grp.members].sort((a: any, b: any) => b.points - a.points).map((m: any) => (
            <li key={m.id} className={`lb-row ${m.id === meId ? "me" : ""}`}>
              <Avatar id={m.avatar} size={30} /><span className="flex-1 truncate">{m.nickname}{m.artist ? " ✏️" : ""}</span>
              {m.guessed && <span aria-label="guessed">✅</span>}<span className="tabular-nums">{m.points}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
