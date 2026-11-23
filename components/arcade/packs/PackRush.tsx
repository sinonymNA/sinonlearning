"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/refs */
// PACK RUSH: buy packs, tap them open on your table, file the cards in your album, sell or fuse the duplicates, hire staff, fill orders.
// All rules are in arcade-server/packs (pure ESM, tested). This file draws the state and adds the juice (shake, particles, sound, flips).
import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  newState, mods, hit, buyPack, unlockTier, sellAll, sellOne, storedValue, buyUpgrade, hire, upgradeCost, advance, offline, rarityOdds, variantOdds, simulate, expectedValue, cardValue,
  freeSlot, dupeCount, albumCount, packsFor, ownedInSet, fuse, claimMission, missionReward, missionText, comboAlive, comboMul, ALBUM_TOTAL, CARDS, SETS, VARIANTS, RARITIES, UPGRADES, STAFF,
  MAX_SLOTS, SET_SIZE, COMBO_WINDOW, FUSE_COST, GOLDEN,
} from "../../../arcade-server/packs/index.mjs";
import { PrefsProvider, PrefsButtons, sfx, tone } from "../prefs";
import { packArt, loadArt, makeTemplates } from "./sprites";
import CardFace from "./CardFace";
import { fmt, fmtTime } from "./format";
import "./packs.css";

const KEY = "packrush:v2";
const rand = () => Math.random();   // visual-only randomness (particles); game randomness is seeded in the engine
type Tab = "table" | "shop" | "upgrades" | "lab" | "album" | "odds";
const ROR: Record<string, number> = Object.fromEntries(RARITIES.map((r: any, i: number) => [r.id, i]));
const TABS: [Tab, string, string][] = [["table", "🎴", "TABLE"], ["shop", "🏪", "SHOP"], ["upgrades", "⬆️", "UPGRADES"], ["lab", "🧪", "LAB"], ["album", "📖", "ALBUM"], ["odds", "🎲", "ODDS"]];

export default function PackRush() { return <PrefsProvider><Inner /></PrefsProvider>; }

function load(): { st: any; at: number } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const j = JSON.parse(raw); if (j?.st?.v === 2 && j.st.missions && j.st.combo) return { st: j.st, at: j.at || Date.now() }; }
  } catch { /* blocked or corrupt: start fresh */ }
  return { st: newState((Date.now() ^ 0x5bd1e995) >>> 0), at: Date.now() };
}

/** A number that counts up or down to its target instead of jumping. */
function Count({ value, prefix = "$" }: { value: number; prefix?: string }) {
  const [shown, setShown] = useState(value), raf = useRef(0), cur = useRef(value);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const step = () => { const d = value - cur.current; if (Math.abs(d) < Math.max(0.5, Math.abs(value) * 0.002)) { cur.current = value; setShown(value); return; } cur.current += d * 0.22; setShown(cur.current); raf.current = requestAnimationFrame(step); };
    raf.current = requestAnimationFrame(step); return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{prefix}{fmt(Math.max(0, shown))}</>;
}

function Inner() {
  const S = useRef<any>(null), last = useRef(0), nid = useRef(0), storeRef = useRef<HTMLButtonElement>(null), cashRef = useRef<HTMLDivElement>(null), flyRef = useRef<HTMLDivElement>(null);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab>("table");
  const [reveal, setReveal] = useState<any>(null);
  const [hits, setHits] = useState<number[]>(Array(MAX_SLOTS).fill(0));
  const [fx, setFx] = useState<any[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<any>(null);
  const [ticker, setTicker] = useState<any[]>([]);
  const [view, setView] = useState<{ id: string; v: string } | null>(null);
  const [fused, setFused] = useState<any>(null);
  const [art, setArt] = useState(0);
  const [tools, setTools] = useState(false);

  const toast = useCallback((m: string) => { setMsg(m); window.setTimeout(() => setMsg((x) => (x === m ? null : x)), 2400); }, []);
  const save = useCallback(() => { try { if (S.current) localStorage.setItem(KEY, JSON.stringify({ st: S.current, at: Date.now() })); } catch { /* storage blocked */ } }, []);
  const run = useCallback(<T,>(fn: (s: any) => T): T | null => { try { const r = fn(S.current); bump(); return r; } catch (e: any) { toast(e?.message || "Can't do that"); sfx("bad"); return null; } }, [toast]);

  // ---- boot: load the save, credit time away, look for custom sprite sheets
  useEffect(() => {
    const { st, at } = load(), now = Date.now(), gap = (now - at) / 1000;
    if (gap > 30) { const r = offline(st, gap); if (r.packs > 0 || r.cash > 1) setWelcome(r); }
    S.current = st; last.current = now; bump();
    setTools(new URLSearchParams(location.search).has("art"));
    void loadArt(CARDS as any, SETS as any).then((ok) => { if (ok) setArt((a) => a + 1); });
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

  // ---- juice helpers
  const addFx = (items: any[], ms = 900) => { const ids = items.map((x) => ({ ...x, id: ++nid.current })); setFx((f) => [...f.slice(-60), ...ids]); window.setTimeout(() => setFx((f) => f.filter((x) => !ids.some((a) => a.id === x.id))), ms); };
  const doShake = (n: number) => { setShake(n); window.setTimeout(() => setShake(0), 420); };
  const flyCoins = (n: number) => {
    const a = storeRef.current?.getBoundingClientRect(), b = cashRef.current?.getBoundingClientRect(), box = flyRef.current; if (!a || !b || !box) return;
    for (let i = 0; i < Math.min(12, n); i++) {
      const el = document.createElement("i"); el.className = "coin"; el.textContent = "🪙";
      el.style.cssText = `left:${a.left + a.width / 2}px;top:${a.top + a.height / 2}px;--dx:${b.left + b.width / 2 - (a.left + a.width / 2)}px;--dy:${b.top + b.height / 2 - (a.top + a.height / 2)}px;animation-delay:${i * 45}ms`;
      box.appendChild(el); window.setTimeout(() => el.remove(), 1100 + i * 45);
    }
  };

  // ---- actions
  const tap = (slot: number) => {
    const s = S.current; if (!s) return;
    if (!s.table[slot]) { buy(); return; }
    const r = run((x) => hit(x, slot)); if (!r) return;
    setHits((h) => { const n = [...h]; n[slot]++; return n; });
    const bits = r.burst ? 18 : r.crit ? 9 : 3;
    addFx([...Array.from({ length: bits }, () => ({ t: "bit", slot, x: Math.round((rand() - 0.5) * (r.burst ? 260 : 100)), y: Math.round(-30 - rand() * (r.burst ? 170 : 70)), r: Math.round(rand() * 360), big: r.burst })), { t: "num", slot, text: r.crit ? `CRIT ${fmt(r.dmg)}!` : fmt(r.dmg), crit: r.crit, dx: Math.round((rand() - 0.5) * 30) }, ...(r.burst ? [{ t: "ring", slot }] : [])], r.burst ? 1000 : 700);
    tone(200 + Math.min(r.combo || 1, 25) * 18 + (r.crit ? 140 : 0), r.burst ? 0.12 : 0.05, r.crit ? "sawtooth" : "square", r.burst ? 0.14 : 0.09);
    if (r.burst) {
      const cards = (r as any).result.cards, best = cards.reduce((a: any, c: any) => (ROR[c.rarity] + c.vIdx * 0.5 > ROR[a.rarity] + a.vIdx * 0.5 ? c : a), cards[0]);
      const big = best.rarity === "legendary" || best.vIdx >= 4 ? 3 : best.rarity === "epic" || best.vIdx >= 3 ? 2 : best.rarity === "rare" || best.vIdx >= 1 ? 1 : 0;
      setReveal({ key: ++nid.current, cards, big, gold: (r as any).result.gold }); doShake(big + 1); sfx("boom");
      if (big >= 2) { setFlash(best.vIdx >= 3 ? "gold" : best.rarity); window.setTimeout(() => setFlash(null), 1100); }
      const delay = [340, 560, 900, 1250][big];
      window.setTimeout(() => { if (big >= 3) sfx("win"); else if (big >= 2) { tone(523, 0.1, "triangle"); window.setTimeout(() => tone(784, 0.2, "triangle"), 90); } else sfx(best.isNewCard || best.isNewVariant ? "reveal" : "pop"); }, delay);
    }
  };
  const buy = () => {
    const slot = run((s) => buyPack(s, s.tier)); if (slot === null) return;
    sfx("pop"); if (S.current.table[slot]?.gold) { toast("✨ GOLDEN PACK! Tougher, but it holds better cards"); window.setTimeout(() => tone(988, 0.15, "triangle"), 80); }
  };
  const doSell = () => { const r = run((s) => sellAll(s)); if (r) { if (r.n) { toast(`Sold ${r.n} card${r.n === 1 ? "" : "s"} for $${fmt(r.cash)}`); sfx("good"); flyCoins(r.n); } else toast("Nothing to sell yet"); } };
  const pickTier = (t: number) => { const s = S.current; if (!s.unlocked[t]) { toast(`Unlock ${SETS[t].name} packs in the Shop ($${fmt(SETS[t].unlock)})`); return; } s.tier = t; bump(); sfx("pop"); };

  // keyboard: 1-8 tap a slot, Space taps the weakest, B buys, S sells
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = S.current; if (!s || tab !== "table" || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (/^Digit[1-8]$/.test(e.code)) { e.preventDefault(); tap(+e.code.slice(5) - 1); }
      else if (e.code === "Space") { e.preventDefault(); let b = -1; for (let i = 0; i < MAX_SLOTS; i++) if (s.table[i] && (b < 0 || s.table[i].hp < s.table[b].hp)) b = i; if (b >= 0) tap(b); else buy(); }
      else if (e.code === "KeyB") buy(); else if (e.code === "KeyS") doSell();
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  });

  if (!st) return <div className="pk-root"><div className="pk-loading">LOADING…</div></div>;
  void art;
  const m = mods(st), tier = st.tier, set = SETS[tier], stored = dupeCount(st), sv = storedValue(st), album = albumCount(st);
  const affordable = (cost: number) => st.cash >= cost;
  const comboOn = comboAlive(st), comboLeft = comboOn ? Math.max(0, 1 - (st.t - st.combo.t) / COMBO_WINDOW) : 0;
  const claimable = st.missions.some((x: any) => x.p >= x.n);
  const nextOrder = st.missions.find((x: any) => x.p >= x.n) || [...st.missions].sort((a: any, b: any) => b.p / b.n - a.p / a.n)[0];

  return (
    <div className="pk-root" data-tab={tab}>
      <header className="pk-top">
        <Link href="/arcade/solo" className="pk-btn sm" aria-label="Back to arcade">←</Link>
        <div className="pk-cash" ref={cashRef}><b><Count value={st.cash} /></b><small>{album}/{ALBUM_TOTAL} album</small></div>
        <button ref={storeRef} className={`pk-btn sm store ${stored >= m.cap ? "full" : ""}`} onClick={doSell} title="Sell all stored duplicates (S)">📦 {stored}/{m.cap}<small>SELL ${fmt(sv)}</small></button>
        <PrefsButtons />
      </header>
      <nav className="pk-tabs" role="tablist" aria-label="Sections">
        {TABS.map(([k, ic, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`pk-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><span aria-hidden>{ic}</span><i>{l}</i>
          {k === "upgrades" && [...UPGRADES.map((u: any) => [u, st.up]), ...STAFF.map((u: any) => [u, st.staff])].some(([u, o]: any) => (o[u.id] || 0) < u.max && affordable(upgradeCost(UPGRADES.includes(u) ? UPGRADES : STAFF, u.id, o[u.id] || 0))) && <u />}
          {k === "shop" && (claimable || SETS.some((_: any, t: number) => !st.unlocked[t] && t > 0 && st.unlocked[t - 1] && affordable(SETS[t].unlock))) && <u />}
          {k === "lab" && Object.entries(st.dupes).some(([key, c]: any) => c >= FUSE_COST && +key.split("|")[1] < VARIANTS.length - 1) && <u />}</button>)}
      </nav>
      {msg && <div className="pk-msg" role="alert">{msg}</div>}
      {flash && <div className={`pk-flash f-${flash}`} aria-hidden />}
      <div className="pk-fly" ref={flyRef} aria-hidden />

      <main className={`pk-main ${shake ? `shake-${shake}` : ""}`}>
        {tab === "table" && (
          <section className="pk-play">
            <div className="pk-show" style={{ ["--n" as any]: reveal?.cards.length ?? 1 }}>
              {reveal ? <Reveal key={reveal.key} data={reveal} /> : <div className="pk-hint"><b>TAP A PACK</b> to tear it open. Tap fast for a combo bonus.<small>New cards go in your album, duplicates to storage. Keys: 1–8 tap · Space taps the weakest · B buys · S sells</small></div>}
            </div>
            <div className="pk-wood" style={{ ["--h" as any]: set.hue }}>
              <div className="pk-slots" data-n={m.slots}>
                {Array.from({ length: m.slots }, (_, i) => {
                  const p = st.table[i];
                  return (
                    <div key={i} className="slot">
                      {p ? <TablePack i={i} p={p} hits={hits[i]} onTap={tap} /> : <button className="tp-empty" onPointerDown={(e) => { e.preventDefault(); buy(); }} aria-label="Empty slot: buy a pack"><span>＋</span><small>${fmt(set.cost)}</small></button>}
                      {fx.filter((b) => b.slot === i).map((b) => b.t === "bit" ? <i key={b.id} className={`bit ${b.big ? "big" : ""}`} style={{ ["--x" as any]: `${b.x}px`, ["--y" as any]: `${b.y}px`, ["--r" as any]: `${b.r}deg`, background: `hsl(${(SETS[p?.tier ?? tier] as any).hue + (b.r % 40)} 85% ${55 + (b.r % 30)}%)` }} />
                        : b.t === "num" ? <i key={b.id} className={`num ${b.crit ? "crit" : ""}`} style={{ ["--dx" as any]: `${b.dx}px` }}>{b.text}</i> : <i key={b.id} className="ring" />)}
                    </div>
                  );
                })}
              </div>
              {ticker.length > 0 && <div className="pk-ticker" aria-label="Pulled by staff">{ticker.map((c: any) => <span key={c.k} className={`r-${c.rarity}`}>{(CARDS.find((x: any) => x.id === c.id) as any).name}{c.isNewVariant ? " ✨" : ""}</span>)}</div>}
            </div>
            <div className="pk-bar">
              <div className="pk-meters">
                <div className={`pk-combo ${comboOn ? "on" : ""}`} aria-label="Tap combo"><span>{comboOn ? `COMBO ×${st.combo.n}  +${Math.round((comboMul(st.combo.n) - 1) * 100)}% dmg` : "TAP FAST FOR COMBOS"}</span><u style={{ width: `${comboLeft * 100}%` }} /></div>
                {nextOrder && <button className={`pk-order ${nextOrder.p >= nextOrder.n ? "done" : ""}`} onClick={() => { if (nextOrder.p >= nextOrder.n) { const r = run((s) => claimMission(s, s.missions.indexOf(nextOrder))); if (r) { toast(`Order complete! +$${fmt(r)}`); sfx("win"); } } else setTab("shop"); }}>
                  <span>📋 {missionText(nextOrder)}</span><b>{nextOrder.p >= nextOrder.n ? `CLAIM $${fmt(missionReward(st, nextOrder))}` : `${nextOrder.p}/${nextOrder.n}`}</b></button>}
              </div>
              <div className="pk-tiers" role="radiogroup" aria-label="Pack type">
                {SETS.map((s: any, t: number) => <button key={s.id} role="radio" aria-checked={tier === t} className={`pk-tier ${tier === t ? "on" : ""} ${st.unlocked[t] ? "" : "lock"}`} style={{ ["--h" as any]: s.hue }} onClick={() => pickTier(t)}>{st.unlocked[t] ? "" : "🔒"}{s.name}</button>)}
              </div>
              <button className={`pk-btn big ${affordable(set.cost) && st.stock[tier] >= 1 && freeSlot(st) >= 0 ? "go" : ""}`} onClick={buy}>BUY {set.name.toUpperCase()} <small>${fmt(set.cost)} · {Math.floor(st.stock[tier])}/{m.stockMax} in stock · {(m.goldenChance * 100).toFixed(1)}% golden</small></button>
            </div>
          </section>
        )}

        {tab === "shop" && (
          <section className="pk-list">
            <h2>ORDERS <small>the shop asks, you deliver. Rewards grow with your best pack.</small></h2>
            {st.missions.map((o: any, i: number) => (
              <div key={o.id} className={`pk-row order ${o.p >= o.n ? "done" : ""}`}>
                <i className="pk-ic" aria-hidden>📋</i>
                <span className="pk-rt"><b>{missionText(o)} <em>{o.p}/{o.n}</em></b><span className="pk-bar2"><u style={{ width: `${(o.p / o.n) * 100}%` }} /></span></span>
                <button className={`pk-btn ${o.p >= o.n ? "go" : ""}`} disabled={o.p < o.n} onClick={() => { const r = run((s) => claimMission(s, i)); if (r) { toast(`Order complete! +$${fmt(r)}`); sfx("win"); flyCoins(8); } }}>{o.p >= o.n ? `CLAIM $${fmt(missionReward(st, o))}` : `$${fmt(missionReward(st, o))}`}</button>
              </div>
            ))}
            <h2>SHOP <small>stock restocks every {m.restockEvery.toFixed(1)}s. Packs land on your table. Any pack can turn out golden.</small></h2>
            {SETS.map((s: any, t: number) => {
              const ok = st.unlocked[t], ev = expectedValue(st, t), canUnlock = t > 0 && st.unlocked[t - 1], pa = packArt(t, s.hue);
              return (
                <div key={s.id} className={`pk-row shop ${ok ? "" : "lock"}`} style={{ ["--h" as any]: s.hue }}>
                  <img className="pk-thumb" src={pa.full} alt="" draggable={false} />
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

        {tab === "upgrades" && (
          <section className="pk-list">
            {([["UPGRADES", "make every tap and every card count for more", UPGRADES, st.up], ["STAFF", "they work even while you are away (up to 2 hours)", STAFF, st.staff]] as any[]).map(([title, sub, list, own]) => (
              <div key={title} className="pk-sec">
                <h2>{title} <small>{sub}</small></h2>
                {list.map((u: any) => {
                  const l = own[u.id] || 0, maxed = l >= u.max, c = upgradeCost(list, u.id, l), isStaff = title === "STAFF";
                  return (
                    <div key={u.id} className="pk-row">
                      <i className="pk-ic" aria-hidden>{u.icon}</i>
                      <span className="pk-rt"><b>{u.name} <em>{isStaff && l === 0 ? "not hired" : `Lv ${l}/${u.max}`}</em></b><small>{u.desc}</small><span className="pk-bar2"><u style={{ width: `${(l / u.max) * 100}%` }} /></span></span>
                      <button className={`pk-btn ${!maxed && affordable(c) ? "go" : ""}`} disabled={maxed || !affordable(c)} onClick={() => { if (run((s) => (isStaff ? hire(s, u.id) : buyUpgrade(s, u.id))) !== null) { sfx("good"); tone(660 + l * 20, 0.1, "triangle"); } }}>{maxed ? "MAX" : `${isStaff && l === 0 ? "HIRE" : "BUY"} $${fmt(c)}`}</button>
                    </div>
                  );
                })}
              </div>
            ))}
          </section>
        )}

        {tab === "lab" && (
          <section className="pk-list">
            <h2>FUSION LAB <small>{FUSE_COST} copies of a finish fuse into 1 of the next finish: no luck involved. Or sell them.</small></h2>
            <div className="pk-row"><span className="pk-rt"><b>Storage {stored}/{m.cap}</b><small>Worth ${fmt(sv)}. Full storage sells new duplicates at half price.</small></span><button className="pk-btn go" disabled={!stored} onClick={doSell}>SELL ALL ${fmt(sv)}</button></div>
            {Object.keys(st.dupes).length === 0 && <p className="pk-note">Nothing stored yet. Duplicate cards land here after you tear open packs.</p>}
            {Object.entries(st.dupes).sort((a: any, b: any) => { const [ia, va] = a[0].split("|"), [ib, vb] = b[0].split("|"); return cardValue(st, CARDS.find((c: any) => c.id === ib), +vb) - cardValue(st, CARDS.find((c: any) => c.id === ia), +va); }).map(([key, count]: any) => {
              const [id, vs] = key.split("|"), v = +vs, card: any = CARDS.find((c: any) => c.id === id), val = cardValue(st, card, v), can = count >= FUSE_COST && v < VARIANTS.length - 1;
              return (
                <div key={key} className="pk-row lab">
                  <div className="pk-mini-card"><CardFace id={id} variant={VARIANTS[v].id} /></div>
                  <span className="pk-rt"><b>{card.name} <em>{VARIANTS[v].name} ×{count}</em></b><small>${fmt(val)} each · ${fmt(val * count)} total</small>
                    <small className={can ? "up" : ""}>{v >= VARIANTS.length - 1 ? "Best finish already" : can ? `Fuse ${FUSE_COST} → ${VARIANTS[v + 1].name}` : `Need ${FUSE_COST - count} more to fuse into ${VARIANTS[v + 1].name}`}</small></span>
                  <span className="pk-acts">
                    <button className={`pk-btn sm ${can ? "go" : ""}`} disabled={!can} onClick={() => { const r = run((s) => fuse(s, id, v)); if (r) { setFused(r); sfx(r.isNewVariant ? "win" : "reveal"); doShake(2); } }}>FUSE</button>
                    <button className="pk-btn sm" onClick={() => { if (run((s) => sellOne(s, key)) !== null) { sfx("good"); flyCoins(1); } }}>SELL 1</button>
                  </span>
                </div>
              );
            })}
          </section>
        )}

        {tab === "album" && (
          <section className="pk-list wide">
            <h2>ALBUM <small>{album}/{ALBUM_TOTAL} finishes found · +{album}% sell price from your collection. Tap a card to look closer.</small></h2>
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

        {tab === "odds" && <OddsLab st={st} tier={tier} tools={tools} />}
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
      {fused && (
        <div className="pk-modal" role="dialog" aria-label="Fusion result" onClick={() => setFused(null)}>
          <div className="pk-viewer" onClick={(e) => e.stopPropagation()}>
            <h2>FUSED!</h2><div className="rv-rays on" aria-hidden />
            <CardFace id={fused.id} variant={fused.variant} value={fused.value} className="big" />
            <p>{fused.isNewVariant ? `New finish for your album! +$${fmt(fused.value * 2)}` : "Added to storage."}</p>
            <button className="pk-btn go" onClick={() => setFused(null)}>NICE</button>
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

/** A pack on the table. The flap peels off as it takes damage, light leaks out, and each tap re-keys the inner element so the shake restarts. */
function TablePack({ i, p, hits, onTap }: { i: number; p: any; hits: number; onTap: (i: number) => void }) {
  const s: any = SETS[p.tier], dmg = 1 - p.hp / p.max, pa = packArt(p.tier, s.hue);
  return (
    <button className={`tp ${p.gold ? "gold" : ""}`} style={{ ["--dmg" as any]: dmg.toFixed(3), ["--h" as any]: s.hue, ["--rot" as any]: `${((i * 37) % 9) - 4}deg` }} onPointerDown={(e) => { e.preventDefault(); onTap(i); }} aria-label={`${p.gold ? "Golden " : ""}${s.name} pack, ${Math.ceil(p.hp)} damage left. Tap to tear it open`}>
      <span className={`tp-in ${hits ? "hit" : ""}`} key={hits}>
        <span className="tp-glow" aria-hidden />
        <img className="tp-body" src={pa.body} alt="" draggable={false} />
        <img className="tp-flap" src={pa.flap} alt="" draggable={false} />
        <span className="tp-name">{s.name}</span>
        {p.gold && <span className="tp-sparkle" aria-hidden />}
      </span>
      <span className="tp-hp" aria-hidden><u style={{ width: `${Math.max(0, 100 - dmg * 100)}%` }} /></span>
      {p.free && <span className="tp-free">FREE</span>}
    </button>
  );
}

/** The cards that popped out of the pack: face down (rarer ones glow through the back), a suspense beat, then a flip. Tap to flip early. */
function Reveal({ data }: { data: any }) {
  const [flip, setFlip] = useState(false), delay = [340, 560, 900, 1250][data.big];
  useEffect(() => { const t = window.setTimeout(() => setFlip(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className="rv-wrap" onPointerDown={() => setFlip(true)}>
      {data.big >= 2 && <div className={`rv-rays ${flip ? "on" : "warm"}`} aria-hidden />}
      <div className="rv-cards">
        {data.cards.map((c: any, i: number) => {
          const card: any = CARDS.find((x: any) => x.id === c.id), hot = ROR[c.rarity] >= 2 || c.vIdx >= 1;
          return (
            <div key={i} className="rv-col" style={{ ["--d" as any]: `${i * 120}ms` }}>
              <div className={`rv ${flip ? "flip" : ""}`}>
                <div className={`rv-back ${hot && !flip ? `hot r-${c.rarity}` : ""}`} style={{ ["--h" as any]: (SETS[card.set] as any).hue, ["--rc" as any]: (RARITIES[ROR[c.rarity]] as any).color }}><span>?</span></div>
                <div className="rv-front"><CardFace id={c.id} variant={c.variant} value={c.value} /></div>
              </div>
              <div className={`rv-tag ${flip ? "on" : ""} ${c.isNewVariant ? "new" : ""}`}>
                {c.isNewCard ? `NEW CARD! +$${fmt(c.value * 2)}` : c.isNewVariant ? `NEW FINISH! +$${fmt(c.value * 2)}` : c.fate === "stored" ? "Stored for sale" : `Storage full: sold $${fmt(c.value / 2)}`}
              </div>
            </div>
          );
        })}
      </div>
      {data.gold && <div className="rv-gold">GOLDEN PACK</div>}
      <span className="rv-sr" aria-live="polite">{flip ? data.cards.map((c: any) => (CARDS.find((x: any) => x.id === c.id) as any).name + " " + c.rarity + " " + c.variant).join(", ") : ""}</span>
    </div>
  );
}

/** The Odds Lab: real chances, how long a chase takes on average, and a 1,000-pack test. */
function OddsLab({ st, tier, tools }: { st: any; tier: number; tools: boolean }) {
  const [lab, setLab] = useState<any>(null), [sheets, setSheets] = useState<{ cards: string; packs: string } | null>(null);
  const ro = rarityOdds(st), vo = variantOdds(st), m = mods(st);
  const row = (label: string, color: string, p: number, key: string) => { const need = packsFor(st, p), miss = (1 - p) ** (Math.round(need) * (1 + m.extra)); return <div key={key} className="pk-orow"><span style={{ color }}><b>{label}</b></span><span>{(p * 100).toFixed(p < 0.01 ? 2 : 1)}%</span><span>~{need < 10 ? need.toFixed(1) : Math.round(need)} packs</span><span title="Chance you still have not seen one after that many packs">{(miss * 100).toFixed(0)}% still waiting</span></div>; };
  return (
    <section className="pk-list">
      <h2>ODDS LAB <small>the real chances behind every pack</small></h2>
      <div className="pk-odds"><div className="pk-orow head"><span>Rarity</span><span>Chance per card</span><span>Avg packs to see one</span><span>Unlucky</span></div>{ro.map((r: any) => row(r.name, r.color, r.p, r.id))}</div>
      <div className="pk-odds"><div className="pk-orow head"><span>Finish</span><span>Chance per card</span><span>Avg packs to see one</span><span>Unlucky</span></div>{vo.map((v: any) => row(v.name, "#cfe3ff", v.p, v.id))}</div>
      <p className="pk-note">&ldquo;Avg packs&rdquo; is how many packs it takes on average to see that at least once. Even after that many, the last column shows how often you would <i>still</i> be waiting. The game never makes you &ldquo;due&rdquo;: every card is rolled fresh. Golden packs ({(m.goldenChance * 100).toFixed(1)}% of packs) multiply the rare and finish odds by {GOLDEN.rarity}× and {GOLDEN.shine}×.</p>
      <div className="pk-row"><span className="pk-rt"><b>Run 1,000 {SETS[tier].name} packs for free</b><small>Compare what comes out with the table. More packs, closer to the odds.</small></span><button className="pk-btn go" onClick={() => setLab(simulate(st, tier, 1000, ((Date.now() / 1000) | 0) + st.ops))}>RUN</button></div>
      {lab && <div className="pk-odds">{RARITIES.map((r: any, i: number) => { const e = ro[i].p * lab.n, a = lab.rarity[r.id]; return <div key={r.id} className="pk-orow"><span style={{ color: r.color }}><b>{r.name}</b></span><span>expected {Math.round(e)}</span><span>got {a}</span><span>{a >= e ? "+" : ""}{Math.round(((a - e) / Math.max(1, e)) * 100)}%</span></div>; })}{VARIANTS.map((v: any, i: number) => { const e = vo[i].p * lab.n, a = lab.variant[v.id]; return <div key={v.id} className="pk-orow"><span><b>{v.name}</b></span><span>expected {Math.round(e)}</span><span>got {a}</span><span>{a >= e ? "+" : ""}{Math.round(((a - e) / Math.max(1, e)) * 100)}%</span></div>; })}</div>}
      {tools && (
        <div className="pk-row"><span className="pk-rt"><b>Artist tools</b><small>Download the current art as sheets in the exact layout the game loads. Replace them with your own and drop them in public/arcade/packs (see ARCADE_PACKS_ART.md).</small></span>
          {sheets ? <span className="pk-acts"><a className="pk-btn sm" href={sheets.cards} download="cards.png">cards.png</a><a className="pk-btn sm" href={sheets.packs} download="packs.png">packs.png</a></span> : <button className="pk-btn" onClick={() => void makeTemplates(CARDS as any, SETS as any).then(setSheets)}>MAKE SHEETS</button>}</div>
      )}
    </section>
  );
}
