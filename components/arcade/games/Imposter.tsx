"use client";

 

import { useEffect, useRef, useState } from "react";
import Avatar from "../Avatar";
import { sfx } from "../prefs";
import { Timer } from "../ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
function Table({ grp, meId, bubbles, highlight }: { grp: any; meId?: string; bubbles?: Record<string, string | null>; highlight?: string | null }) {
  const n = grp.members.length;
  return (
    <div className="ar-table" aria-label="Players around the table">
      {grp.members.map((m: any, i: number) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = 50 + Math.cos(a) * 42, y = 50 + Math.sin(a) * 40;
        const asker = m.asker, bubble = bubbles?.[m.id];
        return (
          <div key={m.id} className="table-seat" style={{ left: `${x}%`, top: `${y}%` }}>
            <div className={`${asker ? "float" : ""} ${m.connected ? "" : "opacity-40"}`} style={{ borderRadius: 18, outline: asker || highlight === m.id ? "4px solid var(--sun)" : undefined, background: asker ? "rgba(255,194,51,.25)" : undefined, padding: 2, display: "inline-block" }}>
              <Avatar id={m.avatar} size={58} />
            </div>
            <div className="truncate text-sm font-bold">{m.id === meId ? "You" : m.nickname}{asker ? " ❓" : ""}</div>
            {m.answered !== undefined && <div className="text-xs">{m.answered ? "✍️ answered" : "…typing"}</div>}
            {m.voted !== undefined && <div className="text-xs">{m.voted ? "🗳️ voted" : "…deciding"}</div>}
            {bubble !== undefined && <div className="pop mx-auto mt-1 max-w-[120px] rounded-xl border-2 border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-xs font-bold text-[var(--ink)]">{bubble ?? "No answer."}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function Imposter({ view, stamp, send, meId, projector = false }: any) {
  const g = view.game, grp = g.group;
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const keyRef = useRef("");
  const key = grp ? `${grp.phase}:${grp.turn}:${grp.vote?.runoff?.length ?? 0}` : "";
  useEffect(() => { if (keyRef.current !== key) { keyRef.current = key; setText(""); setErr(null); if (grp?.phase === "voteShow" || grp?.phase === "final") sfx("reveal"); if (grp?.phase === "role") sfx("pop"); } }, [key, grp?.phase]);

  if (!grp) return <div className="ar-panel text-center">Waiting for the next game…</div>;
  const you = grp.you;
  const name = (id: string) => grp.members.find((m: any) => m.id === id)?.nickname ?? "?";
  const submit = async (type: string, extra: any = {}) => { try { await send({ type, ...extra }); setErr(null); } catch (e: any) { setErr(e.message); sfx("bad"); } };
  const secretChip = you && (you.role === "imposter" ? <span className="ar-chip" style={{ background: "var(--coral)", color: "#fff" }}>🕵️ You are the imposter</span> : <span className="ar-chip" style={{ background: "var(--mint)" }}>🤫 Secret word: <b>{you.word}</b></span>);
  const isAsker = grp.questioner === meId;

  const answerForm = (label: string, type: string, placeholder: string, max: number) => (
    <form className="ar-card grid gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) submit(type, { text }); }}>
      <label className="font-bold" htmlFor="imp-input">{label}</label>
      <div className="flex gap-2"><input id="imp-input" autoFocus className="ar-input" value={text} maxLength={max} onChange={(e) => setText(e.target.value)} placeholder={placeholder} autoComplete="off" /><button className="ar-btn coral" type="submit">Send</button></div>
      <p role="alert" className="min-h-5 font-bold text-[var(--coral)]">{err}</p>
    </form>
  );

  let body: React.ReactNode = null;
  let bubbles: Record<string, string | null> | undefined;

  switch (grp.phase) {
    case "role":
      body = !you ? <div className="ar-panel text-center ar-h2">Secret roles are being handed out…</div> : (
        <div className={`ar-card pop text-center ${you.role === "imposter" ? "shake" : ""}`} style={{ background: you.role === "imposter" ? "var(--coral)" : "var(--paper)", color: you.role === "imposter" ? "#fff" : "var(--ink)" }}>
          {you.role === "imposter" ? <p className="ar-h1">YOU ARE THE IMPOSTER.</p> : <><p className="font-bold opacity-70">The secret word is</p><p className="ar-h1">{you.word}</p><p className="mt-1 font-bold">One of you doesn&apos;t know it. Don&apos;t say it!</p></>}
          {you.role === "imposter" && <p className="mt-2 font-bold">Blend in. You must not give yourself away.</p>}
        </div>
      );
      break;
    case "ask":
      body = isAsker && !projector ? (
        <div className="ar-card grid gap-3">
          <p className="font-bold">Your turn to ask! Click a question or type your own.</p>
          <div className="grid gap-2 sm:grid-cols-2">{(you?.presets ?? []).map((q: string, i: number) => <button key={q} className="choice pop" style={{ minHeight: 0, padding: "10px 14px", fontSize: "1rem", animationDelay: `${i * 0.05}s` }} onClick={() => submit("question", { preset: i })}>{q}</button>)}</div>
          {you?.canReroll && <button className="ar-btn sm paper w-fit" onClick={() => submit("reroll")}>🔀 Show different questions</button>}
          <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) submit("question", { text }); }}>
            <label className="font-bold" htmlFor="imp-input">…or write your own</label>
            <div className="flex gap-2"><input id="imp-input" className="ar-input" value={text} maxLength={120} onChange={(e) => setText(e.target.value)} placeholder="e.g. What would you bring here?" autoComplete="off" /><button className="ar-btn coral" type="submit">Ask</button></div>
          </form>
          <p role="alert" className="min-h-5 font-bold text-[var(--coral)]">{err}</p>
        </div>
      ) : <div className="ar-panel text-center ar-h2">✏️ {name(grp.questioner)} is picking a question…</div>;
      break;
    case "answer":
      body = (
        <div className="grid gap-3">
          <div className="ar-card text-center"><div className="text-sm font-bold opacity-60">{name(grp.question?.from)} ASKED{grp.question?.fallback ? " (auto question)" : ""}</div><div className="text-3xl font-bold">{grp.question?.text}</div></div>
          {!projector && (you?.answered ? <div className="ar-card pop text-center font-bold">✅ Answer locked in. Others can&apos;t see it yet!</div> : answerForm("Everybody answers at the same time", "answer", "Type your answer…", 80))}
        </div>
      );
      break;
    case "show":
      bubbles = Object.fromEntries((grp.answers ?? []).map((a: any) => [a.id, a.text]));
      body = (
        <div className="grid gap-3">
          <div className="ar-card text-center"><div className="text-sm font-bold opacity-60">QUESTION</div><div className="text-2xl font-bold">{grp.question?.text}</div></div>
          <ul className="grid gap-2 md:grid-cols-2">{grp.answers?.map((a: any, i: number) => <li key={a.id} className="ar-panel slide" style={{ animationDelay: `${i * 0.05}s` }}><b>{a.nickname}:</b> {a.text ?? <span className="ar-muted">No answer.</span>}</li>)}</ul>
        </div>
      );
      break;
    case "vote":
    case "runoff": {
      const pool = grp.phase === "runoff" ? grp.vote.runoff : null;
      body = (
        <div className="ar-card grid gap-3">
          <p className="ar-h2 text-center">{grp.phase === "runoff" ? "Runoff! Pick one of the tied players" : "Who is the imposter?"}</p>
          {!projector && !you?.voted ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {grp.members.filter((m: any) => m.id !== meId && (!pool || pool.includes(m.id))).map((m: any) => (
                <button key={m.id} className="choice" onClick={() => submit("vote", { target: m.id })}><Avatar id={m.avatar} size={40} />{m.nickname}</button>
              ))}
            </div>
          ) : <p className="pop text-center font-bold">🗳️ Vote locked in - waiting for everyone ({grp.vote.count}/{grp.members.length})</p>}
          {err && <p role="alert" className="font-bold text-[var(--coral)]">{err}</p>}
        </div>
      );
      break;
    }
    case "voteShow":
    case "runoffShow": {
      const t = grp.tally;
      body = (
        <div className="ar-card grid gap-2">
          <p className="ar-h2 text-center">{t?.accused ? <>🚨 <span className="text-[var(--coral)]">{name(t.accused)}</span> is accused!</> : t?.tieNote}</p>
          {t?.tieNote && t?.accused == null && <p className="text-center font-bold">{t.tieNote}</p>}
          {t?.accused == null && t?.tieNote?.includes("tie") && <p className="text-center font-bold">Runoff vote coming up…</p>}
          <ul className="grid gap-1 sm:grid-cols-2">{t?.votes.map((v: any, i: number) => <li key={i} className="slide rounded-xl bg-[var(--bg)] px-3 py-1 text-[var(--paper)]" style={{ animationDelay: `${i * 0.08}s` }}>{name(v.from)} → <b>{name(v.to)}</b></li>)}</ul>
        </div>
      );
      break;
    }
    case "guess":
      body = you?.role === "imposter" && !projector ? (
        <div className="grid gap-2">
          <div className="ar-card text-center font-bold">{grp.tally?.accused === you.id ? "You were caught!" : "You survived the vote!"} Guess the secret word to win anyway!</div>
          {grp.guess?.submitted ? <div className="ar-card pop text-center ar-h2">Guess locked in…</div> : answerForm("Your guess for the secret word", "guess", "The secret word is…", 40)}
        </div>
      ) : <div className="ar-panel text-center ar-h2 shake">🕵️ The imposter is making a final guess…</div>;
      break;
    case "final":
    case "finished": {
      const f = grp.final;
      body = f && (
        <div className="grid gap-3">
          <div className="ar-card pop text-center" style={{ background: f.outcome.winner === "crew" ? "var(--mint)" : "var(--coral)", color: f.outcome.winner === "crew" ? "var(--ink)" : "#fff" }}>
            <p className="font-bold">THE IMPOSTER WAS…</p>
            <p className="ar-h1 flash flex items-center justify-center gap-3"><Avatar id={grp.members.find((m: any) => m.id === f.imposter)?.avatar} size={64} />{name(f.imposter)}</p>
            <p className="mt-2 text-2xl font-bold">{f.outcome.winner === "crew" ? "🎉 The group caught the imposter!" : "😈 The imposter wins!"}</p>
            <p className="font-bold opacity-90">{{ guess: `They guessed the word: ${f.word}`, caught: "Caught - and the guess was wrong.", wrong_accusation: `The group accused ${name(f.accused)} by mistake.`, no_accusation: "Nobody was accused." }[f.outcome.reason as string]} · Secret word: {f.word}{f.guess ? ` · Imposter guessed: "${f.guess}"` : ""}</p>
          </div>
        </div>
      );
      break;
    }
  }

  const timerTotal = grp.totalMs ?? 10000;
  return (
    <div className="imp-layout grid gap-3">
      <div className="imp-left grid content-start gap-3">
      <div className="ar-panel grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
          <span>{grp.phase === "role" ? "Secret roles" : grp.phase.startsWith("vote") || grp.phase.startsWith("runoff") ? "Voting" : grp.phase === "guess" ? "Final guess" : grp.phase === "final" || grp.phase === "finished" ? "The reveal" : `Question ${grp.turn} of ${grp.turns}`}</span>
          {!projector && secretChip}
        </div>
        {grp.phase !== "finished" && <Timer ms={grp.endsIn} stamp={stamp} total={timerTotal} />}
      </div>
      <Table grp={grp} meId={meId} bubbles={bubbles} highlight={grp.tally?.accused ?? grp.final?.imposter} />
      </div>
      <div className="imp-right grid content-start gap-3">
      {body}
      {grp.history.length > 0 && !["show", "final", "finished"].includes(grp.phase) && (
        <details className="ar-panel"><summary className="cursor-pointer font-bold">📜 Earlier questions &amp; answers</summary>
          {grp.history.map((h: any) => <div key={h.turn} className="mt-3"><p className="font-bold">{name(h.from)}: {h.question}</p><ul className="ml-4 list-disc">{h.answers.map((a: any) => <li key={a.id}>{name(a.id)}: {a.text ?? "No answer."}</li>)}</ul></div>)}
        </details>
      )}
      </div>
    </div>
  );
}
