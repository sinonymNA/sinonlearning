"use client";

/* eslint-disable react/no-unescaped-entities, react-hooks/set-state-in-effect, react-hooks/refs */
import { useEffect, useRef, useState } from "react";
import Avatar from "../Avatar";
import { sfx, usePrefs } from "../prefs";
import { useRemaining } from "../useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
const TIER_COLOR: Record<string, string> = { bubble: "#7fd6ff", clever: "#ffb347", shoal: "#4cc3ff", reef: "#2fd1a5", trench: "#a98bff", pearl: "#ffd23d" };

export function PufferSvg({ size = 90, mood = "calm" }: { size?: number; mood?: "calm" | "worried" | "pop" }) {
  const body = mood === "pop" ? "#ff8a5c" : "#ffd35a";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden style={{ overflow: "visible" }}>
      {Array.from({ length: 12 }, (_, i) => <path key={i} d="M50 6 l-4 14 h8z" fill="#e0a52c" stroke="#14163a" strokeWidth="3" strokeLinejoin="round" transform={`rotate(${i * 30} 50 52)`} />)}
      <circle cx="50" cy="52" r="34" fill={body} stroke="#14163a" strokeWidth="5" />
      <path d="M30 60 q20 22 40 0" fill="#fff3c4" opacity=".7" />
      <path d="M14 52 L2 40 L4 64 Z" fill="#e0a52c" stroke="#14163a" strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="62" cy="44" rx="9" ry={mood === "calm" ? 9 : 11} fill="#fff" stroke="#14163a" strokeWidth="4" /><circle cx="64" cy="45" r="4" fill="#14163a" />
      {mood === "pop" ? <path d="M58 68 q8 -8 16 0" stroke="#14163a" strokeWidth="4" fill="none" strokeLinecap="round" /> : mood === "worried" ? <ellipse cx="70" cy="66" rx="5" ry="6" fill="#14163a" /> : <path d="M60 66 q8 6 16 0" stroke="#14163a" strokeWidth="4" fill="none" strokeLinecap="round" />}
      <circle cx="42" cy="58" r="5" fill="#ff9bb0" opacity=".7" />
    </svg>
  );
}

function seatPos(i: number, n: number) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(1, n);
  return { x: 50 + 39 * Math.cos(a), y: 52 + 33 * Math.sin(a) };
}

export default function PufferParty({ view, stamp, send, meId, projector = false }: any) {
  const g = view.game;
  const grp = g.group;
  const { prefs } = usePrefs();
  const [text, setText] = useState("");
  const [err, setErr] = useState<{ msg: string; n: number } | null>(null);
  const [popFx, setPopFx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const lastDraft = useRef({ at: 0, text: "" });
  const prev = useRef<{ turn?: number; status?: string; round?: number; mine?: boolean }>({});
  const left = useRemaining(grp?.status === "live" ? grp.turnLeft : null, stamp);

  useEffect(() => {
    if (!grp) return;
    const p = prev.current;
    if (p.turn !== undefined && grp.turn !== p.turn && grp.status === "live") sfx("whoosh");
    if (grp.status === "pop" && p.status !== "pop") { sfx("boom"); setPopFx((n) => n + 1); }
    if (grp.you?.holder && !p.mine) { setText(""); setErr(null); setTimeout(() => input.current?.focus(), 40); }
    prev.current = { turn: grp.turn, status: grp.status, round: grp.round, mine: !!grp.you?.holder };
  }, [grp]);
  useEffect(() => {
    if (!grp || grp.status !== "live" || left == null || left > 3200 || left <= 0) return;
    const t = setInterval(() => sfx("tick"), 380); return () => clearInterval(t);
  }, [grp?.status, left == null ? null : left < 3200, grp?.turn]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!grp) return <div className="ar-panel">You'll join the next game!</div>;
  const members: any[] = grp.members;
  const n = members.length;
  const holderIdx = members.findIndex((m) => m.id === grp.holder);
  const victimIdx = members.findIndex((m) => m.id === grp.victim);
  const pufIdx = grp.status === "pop" ? victimIdx : holderIdx;
  const pos = pufIdx >= 0 ? seatPos(pufIdx, n) : { x: 50, y: 52 };
  const frac = left == null || !grp.turnMs ? 1 : Math.max(0, Math.min(1, left / grp.turnMs));
  const inflate = grp.status === "live" ? 1 + (1 - frac) * 0.55 : 1;
  const mood = grp.status === "pop" ? "pop" : frac < 0.35 ? "worried" : "calm";
  const me = members.find((m) => m.id === meId);
  const canType = grp.status === "live" && grp.you?.holder;
  const holder = members[holderIdx];

  function onType(v: string) {
    setText(v);
    const now = performance.now();
    if (grp.you?.holder && now - lastDraft.current.at > 320 && v !== lastDraft.current.text) { lastDraft.current = { at: now, text: v }; send({ type: "draft", text: v }).catch(() => undefined); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    try { const r = await send({ type: "answer", text, turn: grp.turn }); setText(""); setErr(null); sfx(TIER_COLOR[r?.tier] && r.tier !== "bubble" ? "win" : "good"); }
    catch (e2: any) { setErr({ msg: e2.message, n: (err?.n ?? 0) + 1 }); sfx("bad"); setTimeout(() => input.current?.focus(), 20); }
  }

  return (
    <div className={`pp ${projector ? "big" : ""}`}>
      <div className="pp-sign">
        <small>{grp.status === "done" ? "TABLE FINISHED" : `CATEGORY ${grp.round}`}{grp.prompt?.cat ? ` · ${String(grp.prompt.cat).toUpperCase()}` : ""}</small>
        <b>{grp.status === "done" ? (grp.winner ? `🏆 ${members.find((m) => m.id === grp.winner)?.nickname} wins!` : "Nobody left standing!") : grp.prompt?.text}</b>
      </div>

      <div className={`pp-table ${grp.status === "pop" ? "popping" : ""}`} key={grp.status === "pop" ? `p${popFx}` : "t"}>
        {members.map((m, i) => {
          const p = seatPos(i, n);
          const isHolder = grp.status === "live" && m.id === grp.holder;
          const bubble = grp.lastAnswer && grp.lastAnswer.by === m.id && grp.status === "live";
          return (
            <div key={m.id} className={`pp-seat ${isHolder ? "hold" : ""} ${m.lives <= 0 ? "dead" : ""} ${m.id === meId ? "me" : ""} ${grp.status === "pop" && m.id === grp.victim ? "hit" : ""}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              {bubble && <span className={`pp-said ${p.x > 66 ? "edge-r" : p.x < 34 ? "edge-l" : ""}`} key={`${grp.round}-${grp.lastAnswer.n}`} style={{ borderColor: TIER_COLOR[grp.lastAnswer.tier] }}>{grp.lastAnswer.name}<em style={{ color: TIER_COLOR[grp.lastAnswer.tier] }}>+{grp.lastAnswer.points}</em></span>}
              <div className="pp-stone"><Avatar id={m.avatar} size={projector ? 64 : 44} /></div>
              <b className="pp-name">{m.id === meId ? "You" : m.nickname}</b>
              <span className="pp-hearts" aria-label={`${m.lives} lives`}>{Array.from({ length: grp.maxLives }, (_, k) => <i key={k} className={k < m.lives ? "on" : "off"}>♥</i>)}</span>
            </div>
          );
        })}
        {grp.status !== "done" && pufIdx >= 0 && (
          <div className={`pp-puffer ${grp.status === "pop" ? "pop" : ""}`} style={{ left: `${pos.x}%`, top: `${pos.y - 14}%`, ["--inflate" as any]: inflate }}>
            <div className="pp-puffer-in" key={grp.turn}><PufferSvg size={projector ? 110 : 76} mood={mood as any} /></div>
          </div>
        )}
        {grp.status === "pop" && <div className="pp-pop" style={{ left: `${pos.x}%`, top: `${pos.y - 10}%` }}><span>POP!</span></div>}
        {grp.status === "live" && holder && !canType && <div className="pp-up">{holder.nickname} is up…{grp.draft && <span className="pp-draft">{grp.draft}</span>}</div>}
      </div>

      <div className="pp-bottom">
        {grp.status === "live" && (
          <div className={`pp-clock ${frac < 0.35 ? "low" : ""}`} role="timer" aria-label={`${Math.ceil((left ?? 0) / 1000)} seconds left`}>
            <div className="pp-clockbar">{Array.from({ length: 20 }, (_, i) => <i key={i} className={i < Math.ceil(frac * 20) ? "on" : ""} />)}</div><b>{Math.ceil((left ?? 0) / 1000)}s</b>
          </div>
        )}
        {canType ? (
          <form onSubmit={submit} className={`pp-form ${err ? "shake" : ""}`} key={err?.n ?? 0}>
            <span className="pp-lives" title="Your lives">♥ {me?.lives ?? 0}</span>
            <input ref={input} className="pp-input" value={text} onChange={(e) => onType(e.target.value)} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="send" placeholder="Your turn - type an answer…" aria-label="Your answer" />
            <button className="pp-send" type="submit">SEND</button>
          </form>
        ) : (
          <div className="pp-wait">
            <span className="pp-lives">♥ {me?.lives ?? 0}</span>
            <span>{grp.status === "pop" ? "💥 The puffer popped! New category coming…" : grp.status === "done" ? "This table is finished." : me && me.lives <= 0 ? "You're out - cheer everyone on!" : "Wait for the puffer to reach you. Pass it fast!"}</span>
          </div>
        )}
        {err && canType && <p role="alert" className="pp-err">{err.msg}</p>}
        {!projector && grp.status !== "done" && (
          <div className="pp-react">{g.reactions.map((emo: string) => <button key={emo} onClick={() => { send({ type: "react", emoji: emo }).catch(() => undefined); sfx("pop"); }} aria-label={`React ${emo}`}>{emo}</button>)}{grp.reactions.map((r: any) => <span key={r.at + r.from} className="pop">{r.emoji}</span>)}</div>
        )}
      </div>

      {projector && (
        <div className="pp-groups">{g.groups.map((x: any) => <div key={x.id} className="pp-groupchip"><b>Table {x.id + 1} {x.status === "done" ? "🏆" : x.status === "pop" ? "💥" : "🐡"}</b><span>{x.status === "done" ? x.winner ?? "finished" : x.holder ?? "…"}</span><small>{x.alive}/{x.size} alive · R{x.round}</small></div>)}</div>
      )}
      {prefs.calm ? null : null}
    </div>
  );
}
