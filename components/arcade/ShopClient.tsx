"use client";

 

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import PackOpener from "./PackOpener";
import { sfx } from "./prefs";
import { api } from "./useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ShopClient() {
  const [cat, setCat] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const pending = useRef<string | null>(null);

  const refresh = () => api("/api/arcade/economy", { type: "me" }).then(setMe);
  useEffect(() => { api("/api/arcade/economy", { type: "catalog" }).then(setCat); refresh(); }, []);
  if (!cat || !me) return <p className="ar-h2">Loading…</p>;
  const cost = cat.odds.pack.cost;

  // One id per click; a network retry reuses it, so a pack is never charged twice.
  async function open() {
    pending.current ??= crypto.randomUUID();
    try {
      const r = await api("/api/arcade/economy", { type: "open_pack", requestId: pending.current });
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
          <h2 className="text-2xl font-bold">{cat.odds.pack.name}</h2><p className="mb-2">One random character from the collection · {cost} 🪙</p>
          <PackOpener onOpen={open} canOpen={me.signedIn && me.coins >= cost} label={`Open pack · ${cost} 🪙`}
            hint={!me.signedIn ? "Sign in to buy packs." : me.coins < cost ? `You need ${cost - me.coins} more coins. Play a game to earn them!` : undefined} />
          {!me.signedIn && <p className="font-bold"><Link className="underline" href="/margins/login">Sign in</Link></p>}
          <p className="mt-3"><Link className="font-bold underline" href="/arcade/shop/demo">Try the free demo pack →</Link></p>
        </section>
        <section className="ar-panel"><h2 className="ar-h2 mb-2">Pack odds</h2>
          <table className="w-full text-left"><thead><tr className="ar-muted"><th>Rarity</th><th className="text-right">Chance</th></tr></thead><tbody>{cat.odds.rarities.map((r: any) => <tr key={r.id}><td className="py-1 font-bold">{r.label}</td><td className="text-right tabular-nums">{r.percent}%</td></tr>)}</tbody></table>
          <details className="mt-3"><summary className="cursor-pointer font-bold">Chance for each character</summary><table className="mt-2 w-full text-left text-sm"><tbody>{cat.odds.characters.map((c: any) => <tr key={c.id}><td className="py-1"><Avatar id={c.id} size={26} className="mr-2 inline" />{c.name}</td><td className="capitalize">{c.rarity}</td><td className="text-right tabular-nums">{c.percent}%</td></tr>)}</tbody></table></details>
          <p className="ar-muted mt-3 text-sm">Duplicates are possible. Odds are applied on the server when you open a pack.</p></section>
      </div>
    </div>
  );
}
