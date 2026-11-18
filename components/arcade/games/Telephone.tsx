"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DrawPad, Replay, StrokeViewer } from "../DrawingCanvas";
import { sfx } from "../prefs";
import { Timer } from "../ui";
import { useRemaining } from "../useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
const STEP_TITLES = ["The prompt…", "First drawing", "Someone described it as…", "Final drawing"];

function Chain({ entry, step, projector }: { entry: any; step: number; projector?: boolean }) {
  return (
    <div className="grid gap-3">
      <p className="ar-muted font-bold">Started by {entry.owner}</p>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <div className={`ar-card pop ${step === 0 ? "flash" : ""}`}><div className="text-sm font-bold opacity-60">ORIGINAL PROMPT</div><div className={projector ? "text-4xl font-bold" : "text-2xl font-bold"}>{entry.prompt}</div></div>
        {step >= 2 && entry.desc != null && <div className="ar-card slide"><div className="text-sm font-bold opacity-60">{entry.descBy} DESCRIBED IT AS</div><div className={projector ? "text-4xl font-bold" : "text-2xl font-bold"}>&ldquo;{entry.desc}&rdquo;</div></div>}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {step >= 1 && entry.d1 && <div className="slide"><p className="mb-1 font-bold">🎨 First drawing</p><Replay segs={entry.d1} play={step === 1} /></div>}
        {step >= 3 && entry.d2 && <div className="slide"><p className="mb-1 font-bold">🎨 Final drawing</p><Replay segs={entry.d2} play={step === 3} /></div>}
      </div>
    </div>
  );
}

export default function Telephone({ view, stamp, send, meId, optsRef, projector = false }: any) {
  const g = view.game, grp = g.group;
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [chains, setChains] = useState<Record<number, any>>({});
  const task = grp?.status === "stage" ? g.task : null;
  const srcRef = useRef<{ key: string; segs: any[] } | null>(null);

  // keep the describe-stage drawing (sent once) and the reveal data (sent incrementally)
  useEffect(() => {
    if (task?.kind === "describe" && task.src) { srcRef.current = { key: task.key, segs: task.src }; }
    if (task?.kind === "describe") optsRef.current = { ...optsRef.current, tel: { ...(optsRef.current.tel as any), src: task.key } };
  }, [task, optsRef]);
  useEffect(() => { setText(""); setErr(null); }, [task?.key]);
  useEffect(() => {
    const r = g.reveal; if (!r?.chains?.length) return;
    setChains((prev) => { const next = { ...prev }; let latest = { ci: 0, st: -1 }; for (const e of r.chains) { next[e.ci] = { ...(next[e.ci] ?? {}), ...e }; latest = { ci: e.ci, st: e.upto }; } optsRef.current = { ...optsRef.current, tel: { ci: latest.ci, st: latest.st } }; return next; });
  }, [g.reveal, optsRef]);
  const stage = grp?.stage;
  useEffect(() => { if (stage === 3 || grp?.status === "reveal") sfx("reveal"); }, [grp?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSegs = useCallback((segs: any[]) => send({ type: "draw", segs }), [send]);
  const stepLeft = useRemaining(g.reveal?.stepIn, stamp);
  void stepLeft;
  if (!grp) return <div className="ar-panel text-center">Hang tight - you'll join the next game!</div>;

  const label = ["Stage 1 of 3 · DRAW", "Stage 2 of 3 · DESCRIBE", "Stage 3 of 3 · DRAW AGAIN"][Math.min(2, stage)];

  if (grp.status === "stage") {
    return (
      <div className="grid gap-3">
        <div className="ar-panel grid gap-2"><div className="flex flex-wrap items-center justify-between font-bold"><span>{label}</span><span className="ar-chip">{grp.submitted}/{grp.size} done</span></div><Timer ms={grp.endsIn} stamp={stamp} total={grp.stageTotal} /></div>
        {!task ? <div className="ar-panel text-center">Spectating group…</div> : task.kind === "draw" ? (
          <div className="grid gap-3">
            <div className="ar-card text-center"><div className="text-sm font-bold opacity-60">{task.prompt ? "DRAW THIS" : "DRAW WHAT THIS SAYS"}</div><div className="text-3xl font-bold">{task.prompt ?? `“${task.description}”`}</div></div>
            {projector ? null : task.done ? <div className="ar-card pop text-center ar-h2">✅ Submitted! Waiting for the others…</div> : (
              <><DrawPad onSegs={onSegs} resetKey={task.key} /><button className="ar-btn mint xl" onClick={() => send({ type: "done" }).catch((e: any) => setErr(e.message))}>I'm done!</button></>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="ar-card text-center font-bold">What is this a drawing of? Describe it in a few words.</div>
            <StaticDrawing segs={task.src ?? (srcRef.current && srcRef.current.key === task.key ? srcRef.current.segs : [])} />
            {task.submitted ? <div className="ar-card pop text-center ar-h2">✅ “{task.submitted}”</div> : (
              <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); try { await send({ type: "describe", text }); setErr(null); } catch (e2: any) { setErr(e2.message); } }}>
                <input autoFocus className="ar-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={100} placeholder="It looks like…" aria-label="Description" /><button className="ar-btn mint" type="submit">Send</button>
              </form>
            )}
          </div>
        )}
        {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
      </div>
    );
  }

  if (grp.status === "reveal") {
    const rv = g.reveal; const cur = chains[rv.ri];
    return (
      <div className="grid gap-3">
        <div className="ar-panel flex flex-wrap items-center justify-between font-bold"><span>📞 The big reveal - chain {rv.ri + 1} of {grp.n}</span><span>{STEP_TITLES[rv.step] ?? "…"}</span></div>
        {cur ? <Chain key={rv.ri} entry={cur} step={rv.step} projector={projector} /> : <div className="ar-panel text-center">Loading chain…</div>}
      </div>
    );
  }

  const vote = g.vote;
  return (
    <div className="grid gap-3">
      <div className="ar-panel text-center"><p className="ar-h2">{grp.status === "vote" ? "😂 Vote for the funniest chain!" : "Results are in!"}</p>{grp.status === "vote" && <Timer ms={grp.endsIn} stamp={stamp} total={10000} />}</div>
      <div className="grid gap-3 md:grid-cols-2">
        {vote?.options.map((o: any) => {
          const win = vote.funniest?.includes(o.ci);
          return (
            <button key={o.ci} disabled={projector || grp.status !== "vote" || vote.voted || o.ownerId === meId} onClick={() => send({ type: "vote", chain: o.ci }).catch((e: any) => setErr(e.message))} className={`choice ${win ? "right" : ""}`} style={{ display: "grid", gap: 4 }}>
              <span className="text-sm opacity-60">{o.owner}&apos;s chain</span><span>{o.prompt}</span><span className="text-base font-semibold opacity-80">→ &ldquo;{o.desc}&rdquo;</span>
              {vote.counts && <span className="ar-chip w-fit">{vote.counts[o.ci]} votes {win ? "🏆" : ""}</span>}
            </button>
          );
        })}
      </div>
      {vote?.voted && grp.status === "vote" && <p className="pop text-center font-bold">Vote locked in! {vote.votedCount}/{grp.n}</p>}
      {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
    </div>
  );
}

function StaticDrawing({ segs }: { segs: any[] }) {
  const draw = { key: 1, from: 0, segs: segs ?? [] };
  return <StrokeViewer draw={draw} />;
}
