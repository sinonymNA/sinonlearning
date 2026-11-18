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

  const refresh = () => api("/api/arcade/economy", { type: "me" }).then(setMe);
  useEffect(() => { api("/api/arcade/economy", { type: "catalog" }).then(setCat); refresh(); }, []);
  if (!cat || !me) return <p className="ar-h2">Loading…</p>;
  const packs: any[] = cat.packs;
  const sel = packs.find((p) => p.pack.id === packId) ?? packs[1];
  const cost = sel.pack.cost;

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
      <div className="grid gap-6 md:grid-cols-2">
        <section className="ar-card text-center">
          <h2 className="text-2xl font-bold">{sel.pack.name} · {cost} 🪙</h2><p className="mb-2 min-h-12 font-medium">{sel.pack.blurb}</p>
          <PackOpener key={sel.pack.id} pack={sel.pack} onOpen={open} canOpen={me.signedIn && me.coins >= cost} label={`Open ${sel.pack.name} · ${cost} 🪙`}
            hint={!me.signedIn ? "Sign in to buy packs." : me.coins < cost ? `You need ${cost - me.coins} more coins. Play a game to earn them!` : undefined} />
          {!me.signedIn && <p className="font-bold"><Link className="underline" href="/arcade/account">Sign in</Link></p>}
          <p className="mt-3"><Link className="font-bold underline" href="/arcade/shop/demo">Try the free demo packs →</Link></p>
        </section>
        <section className="ar-panel grid content-start gap-4">
          <div><h2 className="ar-h2 mb-2">Choose a pack</h2>
            <div className="grid gap-2 sm:grid-cols-2">{packs.map((p) => (
              <button key={p.pack.id} aria-pressed={sel.pack.id === p.pack.id} onClick={() => setPackId(p.pack.id)} className="ar-card text-left" style={{ background: p.pack.color, padding: 12, outline: sel.pack.id === p.pack.id ? "5px solid #fff" : undefined, outlineOffset: 2, opacity: me.signedIn && me.coins < p.pack.cost ? 0.7 : 1 }}>
                <div className="font-bold">{p.pack.name}</div><div className="text-lg font-bold">{p.pack.cost} 🪙</div>
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
