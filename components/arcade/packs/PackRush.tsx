"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/refs */
// PACK RUSH: buy packs, tap them open on your table, file the cards in your album, sell the duplicates, hire staff.
// All rules are in arcade-server/packs (pure ESM, tested). This file only draws the state. Saves live in this browser (localStorage).
import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  newState, mods, hit, buyPack, unlockTier, sellAll, storedValue, buyUpgrade, hire, upgradeCost, advance, offline, rarityOdds, variantOdds, simulate, expectedValue, cardValue,
  freeSlot, dupeCount, albumCount, packsFor, ownedInSet, ALBUM_TOTAL, CARDS, SETS, VARIANTS, RARITIES, UPGRADES, STAFF, MAX_SLOTS, SET_SIZE,
} from "../../../arcade-server/packs/index.mjs";
import { PrefsProvider, PrefsButtons, sfx } from "../prefs";
import { packUrl } from "./sprites";
import CardFace from "./CardFace";
import { fmt, fmtTime } from "./format";
import "./packs.css";

const KEY = "packrush:v2";
type Tab = "table" | "shop" | "upgrades" | "staff" | "album" | "odds";
const ROR: Record<string, number> = Object.fromEntries(RARITIES.map((r: any, i: number) => [r.id, i]));
const TABS: [Tab, string, string][] = [["table", "🎴", "TABLE"], ["shop", "🏪", "SHOP"], ["upgrades", "⬆️", "UPGRADES"], ["staff", "🧑‍💼", "STAFF"], ["album", "📖", "ALBUM"], ["odds", "🎲", "ODDS"]];

export default function PackRush() { return <PrefsProvider><Inner /></PrefsProvider>; }

function load(): { st: any; at: number } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const j = JSON.parse(raw); if (j?.st?.v === 2) return { st: j.st, at: j.at || Date.now() }; }
  } catch { /* blocked or corrupt: start fresh */ }
  return { st: newState((Date.now() ^ 0x5bd1e995) >>> 0), at: Date.now() };
}

function Inner() {
  const S = useRef<any>(null), last = useRef(0), nid = useRef(0);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("table");
  const [reveal, setReveal] = useState<any>(null);
  const [hits, setHits] = useState<number[]>(Array(MAX_SLOTS).fill(0));
  const [bits, setBits] = useState<any[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<any>(null);
  const [ticker, setTicker] = useState<any[]>([]);
  const [view, setView] = useState<{ id: string; v: string } | null>(null);

  const toast = useCallback((m: string) => { setMsg(m); window.setTimeout(() => setMsg((x) => (x === m ? null : x)), 2200); }, []);
  const save = useCallback(() => { try { if (S.current) localStorage.setItem(KEY, JSON.stringify({ st: S.current, at: Date.now() })); } catch { /* storage blocked */ } }, []);
  const run = useCallback(<T,>(fn: (s: any) => T): T | null => { try { const r = fn(S.current); bump(); return r; } catch (e: any) { toast(e?.message || "Can't do that"); sfx("bad"); return null; } }, [toast]);

  // ---- boot: load the save, credit time away
  useEffect(() => {
    const { st, at } = load(), now = Date.now(), gap = (now - at) / 1000;
    if (gap > 30) { const r = offline(st, gap); if (r.packs > 0 || r.cash > 1) setWelcome(r); }
    S.current = st; last.current = now; bump();
  }, []);

  // ---- loop: restock + staff. Handles throttled background tabs by treating a long gap as time away.
  useEffect(() => {
    const id = window.setInterval(() => {
      const st = S.current; if (!st) return; const now = Date.now(), dt = (now - last.current) / 1000; last.current = now;
      if (dt > 15) { const r = offline(st, dt); if (r.packs > 0 || r.cash > 1) setWelcome(r); }
      else { const out = advance(st, dt); if (out.length) setTicker((t) => [...out.flatMap((p: any) => p.cards).slice(-5).map((c: any) => ({ ...c, k: ++nid.current })), ...t].slice(0, 8)); }
      bump();
    }, 100);
    const sv = window.setInterval(save, 4000);
    const hide = () => { if (document.hidden) save(); };
    document.addEventListener("visibilitychange", hide); window.addEventListener("pagehide", save);
    return () => { clearInterval(id); clearInterval(sv); document.removeEventListener("visibilitychange", hide); window.removeEventListener("pagehide", save); save(); };
  }, [save]);

  const st = S.current;

  // ---- actions
  const spawnBits = (slot: number, n: number, big: boolean) => {
    const add = Array.from({ length: n }, () => ({ id: ++nid.current, slot, x: Math.round((Math.random() - 0.5) * (big ? 220 : 90)), y: Math.round(-30 - Math.random() * (big ? 150 : 60)), r: Math.round(Math.random() * 360), s: big ? 1 : 0 }));
    setBits((b) => [...b.slice(-40), ...add]); window.setTimeout(() => setBits((b) => b.filter((x) => !add.some((a) => a.id === x.id))), 800);
  };
  const tap = (slot: number) => {
    const s = S.current; if (!s) return;
    if (!s.table[slot]) { buy(); return; }
    const r = run((x) => hit(x, slot)); if (!r) return;
    setHits((h) => { const n = [...h]; n[slot]++; return n; }); spawnBits(slot, r.burst ? 14 : r.crit ? 8 : 3, r.burst); sfx(r.burst ? "boom" : "tick");
    if (r.burst) {
      const cards = (r as any).result.cards, best = cards.reduce((a: any, c: any) => (ROR[c.rarity] + c.vIdx * 0.5 > ROR[a.rarity] + a.vIdx * 0.5 ? c : a), cards[0]);
      setReveal({ key: ++nid.current, cards }); const big = best.rarity === "legendary" || best.rarity === "epic" || best.vIdx >= 3;
      if (big) { setFlash(best.vIdx >= 3 ? "gold" : best.rarity); window.setTimeout(() => setFlash(null), 900); }
      window.setTimeout(() => sfx(best.rarity === "legendary" || best.vIdx >= 3 ? "win" : best.isNewCard || best.isNewVariant ? "reveal" : "pop"), 260);
    }
  };
  const buy = () => { if (run((s) => buyPack(s, s.tier)) !== null) sfx("pop"); };
  const doSell = () => { const r = run((s) => sellAll(s)); if (r) { if (r.n) { toast(`Sold ${r.n} card${r.n === 1 ? "" : "s"} for $${fmt(r.cash)}`); sfx("good"); } else toast("Nothing to sell yet"); } };
  const pickTier = (t: number) => { const s = S.current; if (!s.unlocked[t]) { toast(`Unlock ${SETS[t].name} packs in the Shop ($${fmt(SETS[t].unlock)})`); return; } s.tier = t; bump(); sfx("pop"); };

  // keyboard: 1-8 tap a slot, Space taps the weakest pack, B buys, S sells
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = S.current; if (!s || tab !== "table" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^Digit[1-8]$/.test(e.code)) { e.preventDefault(); tap(+e.code.slice(5) - 1); }
      else if (e.code === "Space") { e.preventDefault(); let b = -1; for (let i = 0; i < MAX_SLOTS; i++) if (s.table[i] && (b < 0 || s.table[i].hp < s.table[b].hp)) b = i; if (b >= 0) tap(b); else buy(); }
      else if (e.code === "KeyB") buy(); else if (e.code === "KeyS") doSell();
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  });

  if (!st) return <div className="pk-root"><div className="pk-loading">LOADING…</div></div>;
  const m = mods(st), tier = st.tier, set = SETS[tier], stored = dupeCount(st), sv = storedValue(st), album = albumCount(st);
  const affordable = (cost: number) => st.cash >= cost;

  return (
    <div className="pk-root" data-tab={tab}>
      <header className="pk-top">
        <Link href="/arcade/solo" className="pk-btn sm" aria-label="Back to arcade">←</Link>
        <div className="pk-cash"><b>${fmt(st.cash)}</b><small>{album}/{ALBUM_TOTAL} album</small></div>
        <button className={`pk-btn sm store ${stored >= m.cap ? "full" : ""}`} onClick={doSell} title="Sell all stored duplicates (S)">📦 {stored}/{m.cap}<small>SELL ${fmt(sv)}</small></button>
        <PrefsButtons />
      </header>
      <nav className="pk-tabs" role="tablist" aria-label="Sections">
        {TABS.map(([k, ic, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`pk-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><span aria-hidden>{ic}</span><i>{l}</i>
          {k === "upgrades" && UPGRADES.some((u: any) => (st.up[u.id] || 0) < u.max && affordable(upgradeCost(UPGRADES, u.id, st.up[u.id] || 0))) && <u />}
          {k === "staff" && STAFF.some((u: any) => (st.staff[u.id] || 0) < u.max && affordable(upgradeCost(STAFF, u.id, st.staff[u.id] || 0))) && <u />}
          {k === "shop" && SETS.some((_: any, t: number) => !st.unlocked[t] && t > 0 && st.unlocked[t - 1] && affordable(SETS[t].unlock)) && <u />}</button>)}
      </nav>
      {msg && <div className="pk-msg" role="alert">{msg}</div>}
      {flash && <div className={`pk-flash f-${flash}`} aria-hidden />}

      <main className="pk-main">
        {tab === "table" && (
          <section className="pk-play">
            <div className="pk-show">
              {reveal ? <Reveal key={reveal.key} data={reveal} /> : <div className="pk-hint"><b>TAP A PACK</b> to tear it open. New cards go to your album, duplicates to storage.<small>Keys: 1–8 tap · Space taps the weakest · B buys · S sells</small></div>}
            </div>
            <div className="pk-wood" style={{ ["--h" as any]: set.hue }}>
              <div className="pk-slots" data-n={m.slots}>
                {Array.from({ length: m.slots }, (_, i) => {
                  const p = st.table[i];
                  return p ? <TablePack key={i} i={i} p={p} hits={hits[i]} bits={bits.filter((b) => b.slot === i)} onTap={tap} /> :
                    <button key={i} className="tp-empty" onPointerDown={(e) => { e.preventDefault(); buy(); }} aria-label="Empty slot: buy a pack"><span>＋</span><small>${fmt(set.cost)}</small></button>;
                })}
              </div>
              {ticker.length > 0 && <div className="pk-ticker" aria-label="Pulled by staff">{ticker.map((c: any) => <span key={c.k} className={`r-${c.rarity}`}>{(CARDS.find((x: any) => x.id === c.id) as any).name}{c.isNewVariant ? " ✨" : ""}</span>)}</div>}
            </div>
            <div className="pk-bar">
              <div className="pk-tiers" role="radiogroup" aria-label="Pack type">
                {SETS.map((s: any, t: number) => <button key={s.id} role="radio" aria-checked={tier === t} className={`pk-tier ${tier === t ? "on" : ""} ${st.unlocked[t] ? "" : "lock"}`} style={{ ["--h" as any]: s.hue }} onClick={() => pickTier(t)}>{st.unlocked[t] ? "" : "🔒"}{s.name}</button>)}
              </div>
              <button className={`pk-btn big ${affordable(set.cost) && st.stock[tier] >= 1 && freeSlot(st) >= 0 ? "go" : ""}`} onClick={buy}>BUY {set.name.toUpperCase()} <small>${fmt(set.cost)} · {Math.floor(st.stock[tier])}/{m.stockMax} in stock</small></button>
            </div>
          </section>
        )}

        {tab === "shop" && (
          <section className="pk-list">
            <h2>SHOP <small>stock restocks every {m.restockEvery.toFixed(1)}s. Packs land on your table.</small></h2>
            {SETS.map((s: any, t: number) => {
              const ok = st.unlocked[t], ev = expectedValue(st, t), canUnlock = t > 0 && st.unlocked[t - 1];
              return (
                <div key={s.id} className={`pk-row shop ${ok ? "" : "lock"}`} style={{ ["--h" as any]: s.hue }}>
                  <img className="pk-thumb" src={packUrl(t, s.hue)} alt="" draggable={false} />
                  <span className="pk-rt"><b>{s.name} Pack <em>{ownedInSet(st, t)}/{SET_SIZE} cards</em></b>
                    <small>${fmt(s.cost)} · {s.hp} taps to open{ok ? ` · ${Math.floor(st.stock[t])}/${m.stockMax} in stock${st.stock[t] < m.stockMax ? ` (+1 in ${fmtTime((1 - (st.stock[t] % 1)) * m.restockEvery)})` : ""}` : ""}</small>
                    <small className={ev >= s.cost ? "up" : "down"}>Average card sells for ${fmt(ev)} {ev >= s.cost ? "(you profit on average)" : "(you lose on average)"}</small></span>
                  {ok ? <button className={`pk-btn ${affordable(s.cost) ? "go" : ""}`} onClick={() => { st.tier = t; if (run((x) => buyPack(x, t)) !== null) { sfx("pop"); setTab("table"); } }}>BUY ${fmt(s.cost)}</button>
                    : <button className={`pk-btn ${affordable(s.unlock) && canUnlock ? "go" : ""}`} disabled={!canUnlock || !affordable(s.unlock)} onClick={() => { if (run((x) => unlockTier(x, t)) !== null) { st.tier = t; sfx("win"); toast(`${s.name} packs unlocked!`); } }}>{canUnlock ? `UNLOCK $${fmt(s.unlock)}` : "LOCKED"}</button>}
                </div>
              );
            })}
          </section>
        )}

        {(tab === "upgrades" || tab === "staff") && (
          <section className="pk-list">
            <h2>{tab === "upgrades" ? "UPGRADES" : "STAFF"} <small>{tab === "upgrades" ? "cash upgrades make every tap and every card count for more" : "they work even while you are away (up to 2 hours)"}</small></h2>
            {(tab === "upgrades" ? UPGRADES : STAFF).map((u: any) => {
              const l = (tab === "upgrades" ? st.up : st.staff)[u.id] || 0, maxed = l >= u.max, c = upgradeCost(tab === "upgrades" ? UPGRADES : STAFF, u.id, l);
              return (
                <div key={u.id} className="pk-row">
                  <i className="pk-ic" aria-hidden>{u.icon}</i>
                  <span className="pk-rt"><b>{u.name} <em>{tab === "staff" && l === 0 ? "not hired" : `Lv ${l}/${u.max}`}</em></b><small>{u.desc}</small><span className="pk-bar2"><u style={{ width: `${(l / u.max) * 100}%` }} /></span></span>
                  <button className={`pk-btn ${!maxed && affordable(c) ? "go" : ""}`} disabled={maxed || !affordable(c)} onClick={() => { if (run((s) => (tab === "upgrades" ? buyUpgrade(s, u.id) : hire(s, u.id))) !== null) sfx("good"); }}>{maxed ? "MAX" : `${tab === "staff" && l === 0 ? "HIRE" : "BUY"} $${fmt(c)}`}</button>
                </div>
              );
            })}
          </section>
        )}

        {tab === "album" && (
          <section className="pk-list wide">
            <h2>ALBUM <small>{album}/{ALBUM_TOTAL} finishes found · +{(album).toFixed(0)}% sell price from your collection. Tap a card to look closer.</small></h2>
            {SETS.map((s: any, k: number) => (
              <div key={s.id} className="pk-set" style={{ ["--h" as any]: s.hue }}>
                <h3>{s.name} <small>{ownedInSet(st, k)}/{SET_SIZE} cards</small></h3>
                <div className="pk-grid">
                  {CARDS.filter((c: any) => c.set === k).map((c: any) => {
                    const d = st.dex[c.id], best = d ? d.vars.reduce((b: number, n: number, i: number) => (n > 0 ? i : b), 0) : 0;
                    return (
                      <div key={c.id} className="pk-slot">
                        <CardFace id={c.id} variant={VARIANTS[best].id} locked={!d} onClick={d ? () => setView({ id: c.id, v: VARIANTS[best].id }) : undefined} />
                        <span className="pk-dots" aria-label={d ? `${d.vars.filter((n: number) => n > 0).length} of 6 finishes` : "not found"}>{VARIANTS.map((v: any, i: number) => <u key={v.id} className={d && d.vars[i] > 0 ? `on d-${v.id}` : ""} />)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === "odds" && <OddsLab st={st} tier={tier} />}
      </main>

      {view && (
        <div className="pk-modal" role="dialog" aria-label="Card close-up" onClick={() => setView(null)}>
          <div className="pk-viewer" onClick={(e) => e.stopPropagation()}>
            <CardFace id={view.id} variant={view.v} value={cardValue(st, CARDS.find((c: any) => c.id === view.id), VARIANTS.findIndex((v: any) => v.id === view.v))} className="big" />
            <div className="pk-vtabs">{VARIANTS.map((v: any, i: number) => { const have = st.dex[view.id]?.vars[i] > 0; return <button key={v.id} className={`pk-btn sm ${view.v === v.id ? "go" : ""}`} disabled={!have} onClick={() => setView({ id: view.id, v: v.id })}>{have ? v.name : "🔒"}</button>; })}</div>
            <button className="pk-btn" onClick={() => setView(null)}>CLOSE</button>
          </div>
        </div>
      )}
      {welcome && (
        <div className="pk-modal" role="dialog" aria-label="Welcome back">
          <div className="pk-viewer"><h2>WELCOME BACK</h2><p>Your staff worked {fmtTime(welcome.secs || 0)} while you were away.</p><p>They opened <b>{welcome.packs}</b> packs and made <b>${fmt(Math.max(0, welcome.earned || welcome.cash || 0))}</b>.</p><button className="pk-btn go big" onClick={() => setWelcome(null)}>NICE</button></div>
        </div>
      )}
    </div>
  );
}

/** A pack lying on the table. Each tap re-keys the inner element so the shake animation restarts. */
function TablePack({ i, p, hits, bits, onTap }: { i: number; p: any; hits: number; bits: any[]; onTap: (i: number) => void }) {
  const s: any = SETS[p.tier], dmg = 1 - p.hp / p.max;
  return (
    <button className="tp" style={{ ["--dmg" as any]: dmg.toFixed(3), ["--h" as any]: s.hue, ["--rot" as any]: `${((i * 37) % 9) - 4}deg` }} onPointerDown={(e) => { e.preventDefault(); onTap(i); }} aria-label={`${s.name} pack, ${Math.ceil(p.hp)} taps left. Tap to tear it open`}>
      <span className={`tp-in ${hits ? "hit" : ""}`} key={hits}>
        <img className="tp-img" src={packUrl(p.tier, s.hue)} alt="" draggable={false} />
        <span className="tp-name">{s.name}</span>
        <span className="tp-tear" aria-hidden />
      </span>
      <span className="tp-hp" aria-hidden><u style={{ width: `${Math.max(0, 100 - dmg * 100)}%` }} /></span>
      {p.free && <span className="tp-free">FREE</span>}
      {bits.map((b) => <i key={b.id} className={`bit ${b.s ? "big" : ""}`} style={{ ["--x" as any]: `${b.x}px`, ["--y" as any]: `${b.y}px`, ["--r" as any]: `${b.r}deg`, background: `hsl(${s.hue + (b.r % 40)} 80% ${55 + (b.r % 25)}%)` }} />)}
    </button>
  );
}

/** The card(s) that popped out of the pack: face down, then a flip. Tap to flip early. */
function Reveal({ data }: { data: any }) {
  const [flip, setFlip] = useState(false);
  useEffect(() => { const t = window.setTimeout(() => setFlip(true), 320); return () => clearTimeout(t); }, []);
  return (
    <div className="rv-wrap" onPointerDown={() => setFlip(true)}>
      <div className="rv-cards">
        {data.cards.map((c: any, i: number) => {
          const card: any = CARDS.find((x: any) => x.id === c.id);
          return (
            <div key={i} className="rv-col" style={{ ["--d" as any]: `${i * 120}ms` }}>
              <div className={`rv ${flip ? "flip" : ""}`}>
                <div className="rv-back" style={{ ["--h" as any]: (SETS[card.set] as any).hue }}><span>?</span></div>
                <div className="rv-front"><CardFace id={c.id} variant={c.variant} value={c.value} /></div>
              </div>
              <div className={`rv-tag ${flip ? "on" : ""} ${c.isNewVariant ? "new" : ""}`}>
                {c.isNewCard ? `NEW CARD! +$${fmt(c.value * 2)}` : c.isNewVariant ? `NEW FINISH! +$${fmt(c.value * 2)}` : c.fate === "stored" ? "Stored for sale" : `Storage full: sold $${fmt(c.value / 2)}`}
              </div>
            </div>
          );
        })}
      </div>
      <span className="rv-sr" aria-live="polite">{flip ? data.cards.map((c: any) => (CARDS.find((x: any) => x.id === c.id) as any).name + " " + c.rarity + " " + c.variant).join(", ") : ""}</span>
    </div>
  );
}

/** The Odds Lab: real chances, how long a chase takes on average, and a 1,000-pack test. */
function OddsLab({ st, tier }: { st: any; tier: number }) {
  const [lab, setLab] = useState<any>(null);
  const ro = rarityOdds(st), vo = variantOdds(st), m = mods(st);
  const row = (label: string, color: string, p: number, key: string) => { const need = packsFor(st, p), miss = (1 - p) ** (Math.round(need) * (1 + m.extra)); return <div key={key} className="pk-orow"><span style={{ color }}><b>{label}</b></span><span>{(p * 100).toFixed(p < 0.01 ? 2 : 1)}%</span><span>~{need < 10 ? need.toFixed(1) : Math.round(need)} packs</span><span title="Chance you still have not seen one after that many packs">{(miss * 100).toFixed(0)}% still waiting</span></div>; };
  return (
    <section className="pk-list">
      <h2>ODDS LAB <small>the real chances behind every pack</small></h2>
      <div className="pk-odds"><div className="pk-orow head"><span>Rarity</span><span>Chance per card</span><span>Avg packs to see one</span><span>Unlucky</span></div>{ro.map((r: any) => row(r.name, r.color, r.p, r.id))}</div>
      <div className="pk-odds"><div className="pk-orow head"><span>Finish</span><span>Chance per card</span><span>Avg packs to see one</span><span>Unlucky</span></div>{vo.map((v: any) => row(v.name, "#cfe3ff", v.p, v.id))}</div>
      <p className="pk-note">&ldquo;Avg packs&rdquo; is how many packs it takes on average to see that at least once. Even after that many, the last column shows how often you would <i>still</i> be waiting. The game never makes you &ldquo;due&rdquo;: every card is rolled fresh.</p>
      <div className="pk-row"><span className="pk-rt"><b>Run 1,000 {SETS[tier].name} packs for free</b><small>Compare what comes out with the table. More packs, closer to the odds.</small></span><button className="pk-btn go" onClick={() => setLab(simulate(st, tier, 1000, ((Date.now() / 1000) | 0) + st.ops))}>RUN</button></div>
      {lab && <div className="pk-odds">{RARITIES.map((r: any, i: number) => { const e = ro[i].p * lab.n, a = lab.rarity[r.id]; return <div key={r.id} className="pk-orow"><span style={{ color: r.color }}><b>{r.name}</b></span><span>expected {Math.round(e)}</span><span>got {a}</span><span>{a >= e ? "+" : ""}{Math.round(((a - e) / Math.max(1, e)) * 100)}%</span></div>; })}{VARIANTS.map((v: any, i: number) => { const e = vo[i].p * lab.n, a = lab.variant[v.id]; return <div key={v.id} className="pk-orow"><span><b>{v.name}</b></span><span>expected {Math.round(e)}</span><span>got {a}</span><span>{a >= e ? "+" : ""}{Math.round(((a - e) / Math.max(1, e)) * 100)}%</span></div>; })}</div>}
    </section>
  );
}
