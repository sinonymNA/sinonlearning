"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/refs */
// PACK RUSH: an incremental card-collecting game. All rules live in arcade-server/packs (pure ESM, tested); this file draws the state.
// Save data lives in this browser only (localStorage). Cards and packs are drawn from seeds, so there are no art files.
import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  newState, mods, tick, offline, openPack, openMany, packCost, unlocked, ownedInSet, claimFree, freeReady, buyUpgrade, upgradeCost, tap, incomeRate, cardRate,
  levelOf, nextAt, odds, packsForRarity, simulate, rebootGain, reboot, buyNode, nodeAvailable, starsAvailable, CARDS, SETS, RARITIES, UPGRADES, TREE, SET_SIZE, REBOOT_DIVISOR,
} from "../../../arcade-server/packs/index.mjs";
import { PrefsProvider, PrefsButtons, sfx } from "../prefs";
import { creatureUrl, packUrl } from "./sprites";
import { fmt, fmtTime } from "./format";
import "./packs.css";

const KEY = "packrush:v1";
type Tab = "packs" | "upgrades" | "dex" | "reboot" | "odds";
const RCOLOR: Record<string, string> = Object.fromEntries(RARITIES.map((r: any) => [r.id, r.color]));
const RORDER: Record<string, number> = Object.fromEntries(RARITIES.map((r: any, i: number) => [r.id, i]));

export default function PackRush() { return <PrefsProvider><Inner /></PrefsProvider>; }

function load(): any {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s?.v === 1 && s.dex && s.up) return s; }
  } catch { /* blocked or corrupt: start fresh */ }
  return newState((now ^ 0x5bd1e995) >>> 0, now);
}

function Inner() {
  const S = useRef<any>(null);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("packs");
  const [reveal, setReveal] = useState<any>(null);
  const [ticker, setTicker] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<any>(null);
  const [floats, setFloats] = useState<{ id: number; t: string }[]>([]);
  const [confirmReboot, setConfirmReboot] = useState(false);
  const keyN = useRef(0);

  const flash = useCallback((m: string) => { setMsg(m); window.setTimeout(() => setMsg((x) => (x === m ? null : x)), 2200); }, []);
  const save = useCallback(() => { try { if (S.current) localStorage.setItem(KEY, JSON.stringify(S.current)); } catch { /* storage blocked */ } }, []);
  const run = useCallback(<T,>(fn: (s: any) => T): T | null => { try { const r = fn(S.current); bump(); return r; } catch (e: any) { flash(e?.message || "Can't do that"); sfx("bad"); return null; } }, [flash]);

  // ---- boot: load the save, credit time away
  useEffect(() => {
    const st = load(), now = Date.now(), gap = (now - st.last) / 1000;
    if (gap > 30) { const r = offline(st, gap); if (r.coins > 0) setWelcome({ ...r, secs: Math.min(gap, mods(st).offlineHours * 3600) }); }
    st.last = now; st.autoAt = now; S.current = st; bump();
  }, []);

  // ---- loop: passive income + Auto-Ripper, plus autosave. Handles tabs that were throttled in the background.
  useEffect(() => {
    const id = window.setInterval(() => {
      const st = S.current; if (!st) return; const now = Date.now(), gap = now - st.last;
      if (gap > 15000) { const r = offline(st, gap / 1000); st.last = now; st.autoAt = now; if (r.coins > 0) setWelcome({ ...r, secs: Math.min(gap / 1000, mods(st).offlineHours * 3600) }); }
      else { const out = tick(st, now); if (out.length) setTicker((t) => [...out.flatMap((p: any) => p.cards).slice(-6).map((c: any) => ({ ...c, k: ++keyN.current })), ...t].slice(0, 10)); }
      bump();
    }, 250);
    const sv = window.setInterval(save, 4000);
    const hide = () => { if (document.hidden) save(); };
    document.addEventListener("visibilitychange", hide); window.addEventListener("pagehide", save);
    return () => { clearInterval(id); clearInterval(sv); document.removeEventListener("visibilitychange", hide); window.removeEventListener("pagehide", save); save(); };
  }, [save]);

  const st = S.current;
  if (!st) return <div className="pk-root"><div className="pk-loading">LOADING…</div></div>;
  const m = mods(st), rate = incomeRate(st), now = st.last;   // st.last is refreshed every 250ms by the loop
  const tier = st.tier, cost = packCost(st, tier), set = SETS[tier];

  // ---- actions
  const open = (n: number) => {
    const rs = run((s) => (n === 1 ? [openPack(s, s.tier)] : openMany(s, s.tier, n)));
    if (!rs) return; if (!rs.length) { flash(`Need ${fmt(cost)} coins`); sfx("bad"); return; }
    const cards = rs.flatMap((r: any) => r.cards), best = cards.reduce((a: any, c: any) => (RORDER[c.rarity] > RORDER[a.rarity] ? c : a), cards[0]);
    setReveal({ key: ++keyN.current, cards: cards.sort((a: any, b: any) => RORDER[b.rarity] - RORDER[a.rarity]), packs: rs.length, newN: cards.filter((c: any) => c.isNew).length, best });
    sfx(best.rarity === "legendary" ? "win" : best.rarity === "epic" ? "boom" : best.rarity === "rare" || cards.some((c: any) => c.isNew) ? "reveal" : "pop");
  };
  const gift = () => {
    const r = run((s) => claimFree(s, Date.now())); if (!r) return;
    setReveal({ key: ++keyN.current, cards: r.cards, packs: 1, newN: r.cards.filter((c: any) => c.isNew).length, best: r.cards[0], gift: true }); sfx("reveal");
  };
  const doTap = () => { const g = run((s) => tap(s)); if (g) { const id = ++keyN.current; setFloats((f) => [...f.slice(-5), { id, t: "+" + fmt(g) }]); window.setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 800); sfx("tick"); } };
  const pickTier = (t: number) => { if (!unlocked(st, t)) { flash(`Complete the ${SETS[t - 1].name} set to unlock`); return; } st.tier = t; bump(); sfx("pop"); };
  const buy = (id: string) => { if (run((s) => buyUpgrade(s, id)) !== null) sfx("good"); };
  const gain = rebootGain(st), avail = starsAvailable(st);
  const doReboot = () => { if (!confirmReboot) { setConfirmReboot(true); return; } const g = run((s) => reboot(s, Date.now())); setConfirmReboot(false); if (g) { setReveal(null); setTicker([]); setTab("packs"); flash(`REBOOT! +${g} ⭐`); sfx("win"); save(); } };

  const freeIn = Math.max(0, (st.freeAt - now) / 1000), free = freeReady(st, now);
  const canAfford = (id: string) => { const l = st.up[id] || 0, u: any = UPGRADES.find((x: any) => x.id === id); return l < u.max && st.coins >= upgradeCost(id, l); };
  const badge = UPGRADES.some((u: any) => canAfford(u.id));
  const tabs: [Tab, string, string][] = [["packs", "🎴", "PACKS"], ["upgrades", "⬆️", "UPGRADES"], ["dex", "📖", "COLLECTION"], ["reboot", "⭐", "REBOOT"], ["odds", "🎲", "ODDS"]];

  return (
    <div className="pk-root" data-tab={tab}>
      <header className="pk-top">
        <Link href="/arcade/solo" className="pk-btn sm" aria-label="Back to arcade">←</Link>
        <div className="pk-coins" aria-live="off"><span className="pk-coin" aria-hidden>🪙</span><b>{fmt(st.coins)}</b><small>+{fmt(rate)}/s</small></div>
        {st.stars > 0 && <div className="pk-stars" title="Reboot stars: +5% income each">⭐ {st.stars}</div>}
        <PrefsButtons />
      </header>
      <nav className="pk-tabs" role="tablist" aria-label="Sections">
        {tabs.map(([k, ic, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`pk-tab ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); setConfirmReboot(false); }}><span aria-hidden>{ic}</span><i>{l}</i>{k === "upgrades" && badge && <u />}{k === "reboot" && gain >= 1 && <u />}</button>)}
      </nav>
      {msg && <div className="pk-msg" role="alert">{msg}</div>}

      <main className="pk-main">
        {tab === "packs" && (
          <section className="pk-stage">
            <div className="pk-tiers" role="radiogroup" aria-label="Pack type">
              {SETS.map((s: any, t: number) => {
                const ok = unlocked(st, t), own = ownedInSet(st, t);
                return <button key={s.id} role="radio" aria-checked={tier === t} className={`pk-tier ${tier === t ? "on" : ""} ${ok ? "" : "lock"}`} style={{ ["--h" as any]: s.hue }} onClick={() => pickTier(t)}><span>{ok ? "" : "🔒 "}{s.name}</span><small>{own}/{SET_SIZE}</small></button>;
              })}
            </div>
            <div className="pk-table" style={{ ["--h" as any]: set.hue }}>
              <div className="pk-reveal" aria-live="polite">
                {reveal ? (
                  <>
                    <div className="pk-cards" key={reveal.key} data-n={Math.min(reveal.cards.length, 8)}>
                      {reveal.cards.slice(0, 8).map((c: any, i: number) => <CardView key={i} c={c} i={i} />)}
                    </div>
                    <div className="pk-sum">{reveal.gift ? "FREE GIFT · " : ""}{reveal.packs > 1 ? `${reveal.packs} packs · ${reveal.cards.length} cards · ` : ""}{reveal.newN ? `${reveal.newN} NEW` : "no new cards, but duplicates level cards up"}{reveal.cards.length > 8 ? " · best 8 shown" : ""}</div>
                  </>
                ) : <div className="pk-hint">Tap the pack. New cards pay coins every second. Duplicates level them up.</div>}
              </div>
              <button className="pk-pack" onClick={() => open(1)} aria-label={`Open ${set.name} pack for ${fmt(cost)} coins`}>
                <img src={packUrl(tier, set.hue)} alt="" draggable={false} />
                <span className="pk-open">OPEN</span><span className="pk-cost">🪙 {fmt(cost)}</span>
              </button>
            </div>
            <div className="pk-actions">
              {m.multi.filter((n: number) => n > 1).map((n: number) => <button key={n} className="pk-btn" disabled={st.coins < cost} onClick={() => open(n)}>OPEN ×{n}</button>)}
              <button className={`pk-btn gift ${free ? "go" : ""}`} disabled={!free} onClick={gift}>🎁 {free ? "FREE PACK" : fmtTime(freeIn)}</button>
              <button className="pk-btn tap" onClick={doTap}>👆 TAP <small>+{fmt(Math.max(1, rate * 0.6))}</small>{floats.map((f) => <em key={f.id} className="pk-float">{f.t}</em>)}</button>
            </div>
            {m.autoEvery > 0 && <div className="pk-auto">🤖 Auto-Ripper opening {set.name} packs every {m.autoEvery.toFixed(1)}s{st.coins < cost ? " (waiting for coins)" : ""}</div>}
            {ticker.length > 0 && <div className="pk-ticker" aria-label="Recent auto pulls">{ticker.map((c: any) => <span key={c.k} className={`r-${c.rarity}`} style={{ borderColor: RCOLOR[c.rarity] }}>{CARDS.find((x: any) => x.id === c.id).name}{c.isNew ? " ✨" : ""}</span>)}</div>}
          </section>
        )}

        {tab === "upgrades" && (
          <section className="pk-list">
            <h2>UPGRADES <small>cost coins, reset when you reboot</small></h2>
            {UPGRADES.map((u: any) => {
              const l = st.up[u.id] || 0, maxed = l >= u.max, c = upgradeCost(u.id, l);
              return (
                <div key={u.id} className="pk-row">
                  <i className="pk-ic" aria-hidden>{u.icon}</i>
                  <span className="pk-rt"><b>{u.name} <em>{l}/{u.max}</em></b><small>{u.desc}</small><span className="pk-bar"><u style={{ width: `${(l / u.max) * 100}%` }} /></span></span>
                  <button className={`pk-btn ${!maxed && st.coins >= c ? "go" : ""}`} disabled={maxed || st.coins < c} onClick={() => buy(u.id)}>{maxed ? "MAX" : `🪙 ${fmt(c)}`}</button>
                </div>
              );
            })}
          </section>
        )}

        {tab === "dex" && (
          <section className="pk-list">
            <h2>COLLECTION <small>{m.owned}/{CARDS.length} · +{(m.coll * 100 - 100).toFixed(0)}% income from collecting</small></h2>
            {SETS.map((s: any, k: number) => {
              const own = ownedInSet(st, k), cards = CARDS.filter((c: any) => c.set === k);
              return (
                <div key={s.id} className="pk-set" style={{ ["--h" as any]: s.hue }}>
                  <h3>{s.name} <small>{own}/{SET_SIZE}{own === SET_SIZE ? " · COMPLETE +50% income" : ""}</small></h3>
                  <div className="pk-grid">
                    {cards.map((c: any) => {
                      const d = st.dex[c.id], v = d?.holo ? "holo" : d?.foil ? "foil" : "normal", lv = d ? levelOf(d.n) : 0, nx = d ? nextAt(d.n) : null;
                      return (
                        <div key={c.id} className={`pk-mini ${d ? "" : "unk"} r-${c.rarity} v-${v}`} style={{ borderColor: d ? RCOLOR[c.rarity] : undefined }} title={d ? `${c.name} · ${fmt(cardRate(c, d) * m.income)}/s` : "Not found yet"}>
                          {d ? <img src={creatureUrl(c, s.hue, v)} alt={c.name} draggable={false} /> : <span aria-hidden>?</span>}
                          <b>{d ? c.name : "???"}</b>
                          <small>{d ? (nx ? `${d.n}/${nx} · LV${lv}` : `LV${lv} MAX`) : c.rarity}</small>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {tab === "reboot" && (
          <section className="pk-list">
            <h2>REBOOT <small>reset coins and upgrades, keep every card, earn permanent ⭐</small></h2>
            <div className="pk-rebox">
              <div><b>{gain >= 1 ? `+${gain} ⭐` : "Not yet"}</b><small>{gain >= 1 ? `from ${fmt(st.run.earned)} coins earned this run` : `Earn ${fmt(REBOOT_DIVISOR)} coins this run for your first ⭐ (you have ${fmt(st.run.earned)})`}</small></div>
              <button className={`pk-btn ${gain >= 1 ? "go" : ""}`} disabled={gain < 1} onClick={doReboot}>{confirmReboot ? "TAP AGAIN TO CONFIRM" : "REBOOT"}</button>
            </div>
            <div className="pk-avail">⭐ {avail} to spend · each ⭐ also gives +5% income</div>
            <div className="pk-tree">
              <svg viewBox="0 0 3 5" preserveAspectRatio="none" aria-hidden>
                {TREE.flatMap((n: any) => n.req.map((r: string) => { const p: any = TREE.find((x: any) => x.id === r); return <line key={n.id + r} x1={p.x + 0.5} y1={p.y + 0.5} x2={n.x + 0.5} y2={n.y + 0.5} className={(st.tree[r] || 0) > 0 ? "on" : ""} vectorEffect="non-scaling-stroke" />; }))}
              </svg>
              {TREE.map((n: any) => {
                const l = st.tree[n.id] || 0, ok = nodeAvailable(st, n.id), maxed = l >= n.max;
                return (
                  <button key={n.id} className={`pk-node ${l ? "has" : ""} ${ok ? "" : "off"} ${maxed ? "max" : ""}`} style={{ gridColumn: n.x + 1, gridRow: n.y + 1 }} disabled={!ok || maxed || avail < n.cost}
                    onClick={() => { if (run((s) => buyNode(s, n.id)) !== null) sfx("good"); }} title={n.desc} aria-label={`${n.name}: ${n.desc}. Level ${l} of ${n.max}. Costs ${n.cost} stars.`}>
                    <i aria-hidden>{n.icon}</i><b>{n.name}</b><small>{maxed ? "MAX" : `${l}/${n.max} · ⭐${n.cost}`}</small>
                  </button>
                );
              })}
            </div>
            <ul className="pk-legend">{TREE.map((n: any) => <li key={n.id}><b>{n.icon} {n.name}</b> {n.desc}</li>)}</ul>
          </section>
        )}

        {tab === "odds" && <OddsLab st={st} tier={tier} />}
      </main>

      {welcome && (
        <div className="pk-modal" role="dialog" aria-label="Welcome back">
          <div className="pk-card-modal"><h2>WELCOME BACK</h2><p>You were away {fmtTime(welcome.secs)}.</p><p>Your cards earned <b>🪙 {fmt(welcome.coins)}</b>{welcome.packs ? <> and the Auto-Ripper opened <b>{welcome.packs}</b> packs</> : null}.</p><button className="pk-btn go big" onClick={() => setWelcome(null)}>COLLECT</button></div>
        </div>
      )}
    </div>
  );
}

function CardView({ c, i }: { c: any; i: number }) {
  const card = CARDS.find((x: any) => x.id === c.id), set = SETS[card.set];
  return (
    <div className={`pk-card r-${c.rarity} v-${c.variant}`} style={{ ["--d" as any]: `${i * 140}ms`, borderColor: RCOLOR[c.rarity] }}>
      <img src={creatureUrl(card, set.hue, c.variant)} alt="" draggable={false} />
      <b>{card.name}</b><i style={{ color: RCOLOR[c.rarity] }}>{c.variant !== "normal" ? c.variant.toUpperCase() + " " : ""}{c.rarity}</i>
      {c.isNew && <em className="new">NEW</em>}{c.leveled && <em className="lvl">LVL {c.level}</em>}
    </div>
  );
}

/** The Odds lab: shows the real chances, how long a chase takes on average, and lets you test it. */
function OddsLab({ st, tier }: { st: any; tier: number }) {
  const [lab, setLab] = useState<any>(null);
  const o = odds(st), m = mods(st);
  return (
    <section className="pk-list">
      <h2>ODDS LAB <small>the real chances behind every pack</small></h2>
      <div className="pk-odds">
        {o.map((r: any) => {
          const need = packsForRarity(st, r.id), miss = (1 - r.p) ** (m.cards * Math.round(need));
          return (
            <div key={r.id} className="pk-orow"><span style={{ color: r.color }}><b>{r.name}</b></span><span>{(r.p * 100).toFixed(2)}% per card</span><span>~{need < 10 ? need.toFixed(1) : Math.round(need)} packs</span><span title="Chance you still haven't seen one after that many packs">{(miss * 100).toFixed(0)}% unlucky</span></div>
          );
        })}
      </div>
      <p className="pk-note">Packs have {m.cards} cards each. &ldquo;Packs&rdquo; is the average number of packs it takes to see that rarity at least once. Even after that many packs, the last column says how often you&apos;d <i>still</i> be waiting. The game does not make you &ldquo;due&rdquo;: every card is rolled fresh.</p>
      <div className="pk-row lab">
        <span className="pk-rt"><b>Run 1,000 packs ({SETS[tier].name}) without spending anything</b><small>Compare what actually came out with the odds above. More packs, closer to the odds.</small></span>
        <button className="pk-btn go" onClick={() => setLab(simulate(st, tier, 1000, ((Date.now() / 1000) | 0) + st.ops))}>RUN</button>
      </div>
      {lab && (
        <div className="pk-odds">
          {RARITIES.map((r: any, i: number) => { const exp = o[i].p * lab.cards, act = lab.counts[r.id]; return <div key={r.id} className="pk-orow"><span style={{ color: r.color }}><b>{r.name}</b></span><span>expected {Math.round(exp)}</span><span>got {act}</span><span>{act >= exp ? "+" : ""}{Math.round(((act - exp) / Math.max(1, exp)) * 100)}%</span></div>; })}
        </div>
      )}
    </section>
  );
}
