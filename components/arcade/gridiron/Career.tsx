"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// Coaching Career hub: season schedule, standings, roster, free agents, history. All rules live in
// arcade-server/gridiron/career.mjs; this file only renders the state and calls its functions.
import { useState } from "react";
import { CAREER, SLOTS, newCareer, userFixture, simUserGame, nextSeason, standings, sign, train, canTrain, faCost, slotPlayer, rosterOvr, careerRecord } from "../../../arcade-server/gridiron/index.mjs";

type Tab = "season" | "roster" | "agents" | "league" | "history";
export const CAREER_KEY = "gridiron:career:v1";
const POS_COLOR: Record<string, string> = { QB: "#ffd23f", WR: "#4cc3ff", RB: "#86efac", OL: "#f9a8d4", DEF: "#fca5a5" };

export default function Career({ st, onChange, onPlay, onBack }: { st: any | null; onChange: (s: any | null) => void; onPlay: () => void; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("season");
  const [name, setName] = useState("Pixel Pros");
  const [msg, setMsg] = useState<string | null>(null);
  const [last, setLast] = useState<any>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  /** Apply a rule function to a copy of the state, then hand it back to be saved. */
  const run = (fn: (s: any) => any) => {
    const copy = structuredClone(st); setMsg(null);
    try { const out = fn(copy); onChange(copy); return out; } catch (e: any) { setMsg(e?.message || "Can't do that"); return null; }
  };

  if (!st) {
    return (
      <div className="gr-panel menu gc">
        <div className="gr-logo"><span>COACH</span><b>CAREER</b></div>
        <p className="gr-sub">Run a team through a 7-game season and the playoffs. Win to earn ⭐ credits, then sign free agents and train your stars. Your team starts as an underdog.</p>
        <label className="gc-name">TEAM NAME<input value={name} maxLength={18} onChange={(e) => setName(e.target.value)} aria-label="Team name" /></label>
        <div className="gr-col">
          <button className="gr-btn big go" onClick={() => onChange(newCareer({ seed: (Math.random() * 1e9) >>> 0, teamName: name.trim() || "Your Team" }))}>START CAREER</button>
          <button className="gr-btn" onClick={onBack}>← BACK</button>
        </div>
      </div>
    );
  }

  const fx = userFixture(st), mine = st.table[0];
  const ovr = rosterOvr(st.roster), opp = fx ? st.teams[fx.opp] : null;
  const rec = careerRecord(st);
  const tabs: [Tab, string][] = [["season", "SEASON"], ["roster", "ROSTER"], ["agents", "FREE AGENTS"], ["league", "LEAGUE"], ["history", "HISTORY"]];

  return (
    <div className="gr-panel gc" role="region" aria-label="Coaching career">
      <header className="gc-head">
        <div><b className="gc-team">{st.teamName.toUpperCase()}</b><small>SEASON {st.season} · {mine.w}-{mine.l}{mine.t ? `-${mine.t}` : ""} · OVR {ovr}</small></div>
        <div className="gc-credits" title="Win games to earn credits. Spend them on free agents and training.">⭐ {st.credits}</div>
      </header>
      <nav className="gc-tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`gr-chip ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); setMsg(null); }}>{l}{k === "agents" && st.credits >= 2 ? " •" : ""}</button>)}</nav>
      {msg && <div className="gc-msg" role="alert">{msg}</div>}

      <div className="gc-body">
        {tab === "season" && (<>
          {fx && opp && (
            <div className="gc-card">
              <small>{fx.label.toUpperCase()}</small>
              <div className="gc-vs"><span>{st.teamName}<i>OVR {ovr}</i></span><b>VS</b><span style={{ color: opp.color }}>{opp.name}<i>OVR {opp.ovr} · {opp.ovr > ovr ? "FAVOURED" : opp.ovr < ovr ? "UNDERDOG" : "EVEN"}</i></span></div>
              <div className="gr-row"><button className="gr-btn big go" onClick={onPlay}>PLAY GAME ▶</button><button className="gr-btn" onClick={() => setLast(run(simUserGame))} title="Let the computer play this one">SIM WEEK ⏩</button></div>
              {st.phase === "regular" && st.week > 1 && st.week <= CAREER.REG_WEEKS && <small className="gc-hint">Tip: free agents and training are free to try between games.</small>}
            </div>
          )}
          {st.phase === "playoffs" && !fx && <div className="gc-card"><small>PLAYOFFS</small><p>You&apos;re out. The league is finishing the bracket.</p></div>}
          {st.phase === "offseason" && (
            <div className="gc-card">
              <small>SEASON {st.season} COMPLETE</small>
              <b className="gc-big">{st.history[st.history.length - 1]?.outcome === "Champions" ? "🏆 CHAMPIONS!" : (st.history[st.history.length - 1]?.outcome || "").toUpperCase()}</b>
              <p>Champion: {st.teams[st.bracket.champion].name}. Players age: young ones grow, veterans fade, and +{CAREER.OFFSEASON_CREDITS}⭐ for the offseason.</p>
              <button className="gr-btn big go" onClick={() => { const out = run(nextSeason); setLast(null); if (out?.retired?.length) setMsg(`Retired: ${out.retired.join(", ")}. Rookies took their spots.`); }}>START SEASON {st.season + 1} ▶</button>
            </div>
          )}
          {last && (
            <div className="gc-card"><small>WEEK RESULT</small>
              <b className="gc-big">{last.summary.result === "W" ? "WIN" : last.summary.result === "L" ? "LOSS" : "TIE"} {last.summary.you}–{last.summary.them}</b>
              {last.others.map((o: any, i: number) => <div key={i} className="gc-line">{st.teams[o.a].short} {o.sa} – {o.sb} {st.teams[o.b].short}</div>)}
              {last.notes.map((n: string, i: number) => <div key={i} className="gc-note">{n}</div>)}
            </div>
          )}
          {st.phase === "playoffs" && st.bracket && <div className="gc-card"><small>PLAYOFF BRACKET</small>{st.bracket.rounds.map((rd: any, i: number) => <div key={i} className="gc-line">{i === 0 ? "Semis" : "Final"}: {rd.map(([a, b]: number[]) => `${st.teams[a].short} v ${st.teams[b].short}`).join(" · ")}</div>)}</div>}
          <div className="gc-card"><small>YOUR SCHEDULE</small>
            {st.schedule.map((pairs: any, w: number) => {
              const g = pairs.find((p: number[]) => p.includes(0)), o = st.teams[g[0] === 0 ? g[1] : g[0]], res = st.results.find((r: any) => !r.playoff && r.week === w + 1);
              return <div key={w} className={`gc-line ${w + 1 === st.week && st.phase === "regular" ? "now" : ""}`}><span>WK {w + 1}</span><span>{g[0] === 0 ? "vs" : "@"} {o.name}</span><b className={res ? (res.result === "W" ? "w" : res.result === "L" ? "l" : "") : ""}>{res ? `${res.result} ${res.you}-${res.them}` : "—"}</b></div>;
            })}
          </div>
        </>)}

        {tab === "roster" && (
          <div className="gc-card">
            <small>STARTERS · TRAIN COSTS {CAREER.TRAIN_COST}⭐ FOR +{CAREER.TRAIN_GAIN}</small>
            {SLOTS.map((s: any, i: number) => {
              const p = slotPlayer(st, s), why = canTrain(st, s.key, s.idx);
              return (
                <div key={i} className="gc-player">
                  <i className="gc-pos" style={{ background: POS_COLOR[p.pos] }}>{s.idx != null ? "ABCD"[s.idx] : p.pos}</i>
                  <span className="gc-pn"><b>{p.name}</b><small>{s.label} · age {p.age}</small></span>
                  <span className="gc-ovr"><b>{p.ovr}</b><u style={{ width: `${p.ovr}%`, background: p.ovr >= 80 ? "#86efac" : p.ovr >= 70 ? "#ffd23f" : "#fca5a5" }} /></span>
                  <button className="gr-btn" disabled={!!why} title={why || "Train"} onClick={() => run((x) => train(x, s.key, s.idx))}>TRAIN</button>
                </div>
              );
            })}
          </div>
        )}

        {tab === "agents" && (
          <div className="gc-card">
            <small>FREE AGENTS · THE POOL REFRESHES EVERY WEEK. A SIGNED PLAYER SENDS YOUR OLD STARTER BACK TO THE POOL</small>
            {st.freeAgents.map((p: any) => {
              const cost = faCost(p.ovr), slots = SLOTS.filter((s: any) => s.pos === p.pos);
              return (
                <div key={p.id} className="gc-player">
                  <i className="gc-pos" style={{ background: POS_COLOR[p.pos] }}>{p.pos}</i>
                  <span className="gc-pn"><b>{p.name}</b><small>age {p.age} · costs {cost}⭐</small></span>
                  <span className="gc-ovr"><b>{p.ovr}</b><u style={{ width: `${p.ovr}%`, background: p.ovr >= 80 ? "#86efac" : p.ovr >= 70 ? "#ffd23f" : "#fca5a5" }} /></span>
                  <span className="gc-sign">{slots.map((s: any, j: number) => {
                    const cur = slotPlayer(st, s), d = p.ovr - cur.ovr;
                    return <button key={j} className="gr-btn" disabled={st.credits < cost} title={`Replaces ${cur.name} (${cur.ovr})`} onClick={() => run((x) => sign(x, p.id, s.key, s.idx))}>{s.idx != null ? `→${"ABCD"[s.idx]}` : "SIGN"}<small className={d > 0 ? "up" : "down"}>{d > 0 ? "+" : ""}{d}</small></button>;
                  })}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === "league" && (
          <div className="gc-card"><small>STANDINGS · TOP {CAREER.PLAYOFF_TEAMS} MAKE THE PLAYOFFS</small>
            {standings(st).map((r: any, i: number) => (
              <div key={r.id} className={`gc-line row ${r.id === 0 ? "now" : ""} ${i === CAREER.PLAYOFF_TEAMS ? "cut" : ""}`}><span>{i + 1}</span><span style={{ color: r.team.color }}>{r.team.name}</span><span>{r.w}-{r.l}{r.t ? `-${r.t}` : ""}</span><span>{r.diff > 0 ? "+" : ""}{r.diff}</span><span>OVR {r.team.ovr}</span></div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div className="gc-card"><small>CAREER · {rec.seasons} SEASON{rec.seasons === 1 ? "" : "S"} · {rec.titles} TITLE{rec.titles === 1 ? "" : "S"} · {rec.w}-{rec.l}</small>
            {st.history.length === 0 && <p>Finish your first season to see it here.</p>}
            {[...st.history].reverse().map((h: any) => <div key={h.season} className="gc-line row"><span>S{h.season}</span><span>{h.w}-{h.l}{h.t ? `-${h.t}` : ""}</span><span>{h.outcome}</span><span>OVR {h.ovr}</span></div>)}
            <div className="gr-row" style={{ marginTop: 8 }}>
              {confirmReset ? <><button className="gr-btn" onClick={() => { setConfirmReset(false); onChange(null); }}>YES, DELETE CAREER</button><button className="gr-btn" onClick={() => setConfirmReset(false)}>CANCEL</button></> : <button className="gr-btn" onClick={() => setConfirmReset(true)}>NEW CAREER…</button>}
            </div>
          </div>
        )}
      </div>
      <button className="gr-btn" onClick={onBack}>← MENU</button>
    </div>
  );
}
