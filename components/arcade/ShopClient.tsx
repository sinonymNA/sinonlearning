"use client";

 

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import PackOpener from "./PackOpener";
import { RARITIES } from "@/lib/arcadeCatalog";
import { sfx } from "./prefs";
import { api } from "./useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ShopClient() {
  const [cat, setCat] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const pending = useRef<string | null>(null);
  const [packId, setPackId] = useState("basic");
  const [dailyMsg, setDailyMsg] = useState<string | null>(null);
  async function claimDaily() {
    try { const r = await api("/api/arcade/economy", { type: "claim_daily" }); setMe((m: any) => ({ ...m, coins: r.coins })); setDailyMsg(r.claimed ? `+${r.bonus} coins! See you tomorrow.` : "Already claimed today - come back tomorrow!"); sfx(r.claimed ? "good" : "pop"); }
    catch (e: any) { setDailyMsg(e.message); }
  }

  const refresh = () => api("/api/arcade/economy", { type: "me" }).then(setMe);
  useEffect(() => { api("/api/arcade/economy", { type: "catalog" }).then(setCat); refresh(); }, []);
  if (!cat || !me) return <p className="ar-h2">Loading…</p>;
  const packs: any[] = cat.packs;
  const sel = packs.find((p) => p.pack.id === packId) ?? packs[1];
  const shop = cat.shop;
  const priceOf = (id: string, base: number) => (shop?.deal?.packId === id ? shop.deal.price : base);
  const cost = priceOf(sel.pack.id, sel.pack.cost);

  // One id per click; a network retry reuses it, so a pack is never charged twice.
  async function open() {
    pending.current ??= crypto.randomUUID();
    try {
      const r = await api("/api/arcade/economy", { type: "open_pack", requestId: pending.current, packId });
      pending.current = null; setMe((m: any) => ({ ...m, coins: r.coins }));
      setTimeout(refresh, 2500);
      return r;
    } catch (e: any) { if (e.status && e.status < 500) pending.current = null; throw e; }
  }

  return (
    <div className="grid gap-6">
      <div className="ar-panel flex flex-wrap items-center justify-between gap-3"><div><p className="ar-h2">🪙 {me.signedIn ? me.coins : 0} coins</p><p className="ar-muted">Earn coins by playing in Arcade rooms while signed in. Coins and characters are cosmetic only - no real money, no trading.</p></div><Link className="ar-btn sm paper" href="/arcade/characters">My collection</Link></div>
      {shop && (
        <section className="ar-panel grid gap-3" aria-label="Daily shop">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="ar-h2">🛍️ Today&apos;s shop</h2><span className="ar-pill">Refreshes at midnight UTC</span></div>
          <div className="grid gap-3 md:grid-cols-3">
            {(() => { const dp = packs.find((p) => p.pack.id === shop.deal.packId); return dp && (
              <button className="ar-card text-left" style={{ background: dp.pack.color, padding: 12 }} onClick={() => setPackId(dp.pack.id)} aria-label={`Deal of the day: ${dp.pack.name}`}>
                <div className="text-xs font-bold uppercase">🔥 Deal of the day · {shop.deal.percent}% off</div>
                <div className="text-xl font-bold">{dp.pack.name}</div>
                <div className="text-lg font-bold"><s className="opacity-60">{shop.deal.was}</s> {shop.deal.price} 🪙</div>
              </button>); })()}
            <div className="ar-card" style={{ padding: 12 }}>
              <div className="text-xs font-bold uppercase">⭐ Spotlight · {shop.spotlight.boost}× chance</div>
              <div className="flex items-center gap-3"><Avatar id={shop.spotlight.characterId} size={56} /><div><div className="text-xl font-bold">{shop.spotlight.name}</div>
                <div className="text-sm font-bold" style={{ color: RARITIES[shop.spotlight.rarity].color }}>{RARITIES[shop.spotlight.rarity].label}</div></div></div>
              <div className="mt-1 text-xs font-medium">Boosted in: {shop.spotlight.packIds.map((id: string) => packs.find((p) => p.pack.id === id)?.pack.name).join(", ")}</div>
            </div>
            <div className="ar-card grid content-between gap-2" style={{ padding: 12 }}>
              <div><div className="text-xs font-bold uppercase">🎁 Daily check-in</div><div className="text-lg font-bold">+{shop.bonus} coins, once a day</div></div>
              <button className="ar-btn sm mint" onClick={claimDaily} disabled={!me.signedIn}>{me.signedIn ? "Claim today's coins" : "Sign in to claim"}</button>
              <p role="status" className="min-h-5 text-sm font-bold">{dailyMsg}</p>
            </div>
          </div>
        </section>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="ar-card text-center">
          <h2 className="text-2xl font-bold">{sel.pack.name} · {cost} 🪙{cost < sel.pack.cost && <span className="ml-2 text-base">({shop.deal.percent}% off today)</span>}</h2><p className="mb-2 min-h-12 font-medium">{sel.pack.blurb}</p>
          <PackOpener key={sel.pack.id} pack={sel.pack} onOpen={open} canOpen={me.signedIn && me.coins >= cost} label={`Open ${sel.pack.name} · ${cost} 🪙`}
            hint={!me.signedIn ? "Sign in to buy packs." : me.coins < cost ? `You need ${cost - me.coins} more coins. Play a game to earn them!` : undefined} />
          {!me.signedIn && <p className="font-bold"><Link className="underline" href="/arcade/account">Sign in</Link></p>}
          <p className="mt-3"><Link className="font-bold underline" href="/arcade/shop/demo">Try the free demo packs →</Link></p>
        </section>
        <section className="ar-panel grid content-start gap-4">
          <div><h2 className="ar-h2 mb-2">Choose a pack</h2>
            <div className="grid gap-2 sm:grid-cols-2">{packs.map((p) => (
              <button key={p.pack.id} aria-pressed={sel.pack.id === p.pack.id} onClick={() => setPackId(p.pack.id)} className="ar-card text-left" style={{ background: p.pack.color, padding: 12, outline: sel.pack.id === p.pack.id ? "5px solid #fff" : undefined, outlineOffset: 2, opacity: me.signedIn && me.coins < p.pack.cost ? 0.7 : 1 }}>
                <div className="font-bold">{p.pack.name}</div><div className="text-lg font-bold">{shop?.deal?.packId === p.pack.id ? <><s className="opacity-60">{p.pack.cost}</s> {shop.deal.price}</> : p.pack.cost} 🪙</div>
                <div className="text-xs font-semibold">{p.rarities.map((r: any) => `${r.label.slice(0, 3)} ${r.percent}%`).join(" · ")}</div></button>))}</div></div>
          <div><h3 className="mb-1 font-bold">{sel.pack.name} odds</h3>
            <table className="w-full text-left"><tbody>{sel.rarities.map((r: any) => <tr key={r.id}><td className="py-1 font-bold" style={{ color: RARITIES[r.id].color }}>{r.label}</td><td className="text-right tabular-nums">{r.percent}%</td></tr>)}</tbody></table>
            <details className="mt-2"><summary className="cursor-pointer font-bold">Chance for each character</summary><table className="mt-2 w-full text-left text-sm"><tbody>{sel.characters.map((c: any) => <tr key={c.id}><td className="py-1"><Avatar id={c.id} size={26} className="mr-2 inline" />{c.name}</td><td className="capitalize">{c.rarity}</td><td className="text-right tabular-nums">{c.percent}%</td></tr>)}</tbody></table></details>
            <p className="ar-muted mt-2 text-sm">Duplicates are possible. Odds are applied on the server when you open a pack.</p></div>
        </section>
      </div>
    </div>
  );
}
