"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import { sfx } from "./prefs";
import { api } from "./useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ShopClient() {
  const [cat, setCat] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pending = useRef<string | null>(null);

  const refresh = () => api("/api/arcade/economy", { type: "me" }).then(setMe);
  useEffect(() => { api("/api/arcade/economy", { type: "catalog" }).then(setCat); refresh(); }, []);
  if (!cat || !me) return <p className="ar-h2">Loading…</p>;
  const cost = cat.odds.pack.cost;

  async function open() {
    if (busy) return;
    setBusy(true); setErr(null); setResult(null);
    // One id per click; a network retry reuses it, so a pack is never charged twice.
    pending.current ??= crypto.randomUUID();
    try {
      const r = await api("/api/arcade/economy", { type: "open_pack", requestId: pending.current });
      pending.current = null; sfx("win"); setResult(r); setMe((m: any) => ({ ...m, coins: r.coins }));
      await refresh();
    } catch (e: any) { setErr(e.message); if (e.status && e.status < 500) pending.current = null; }
    finally { setBusy(false); }
  }

  return (
    <div className="grid gap-6">
      <div className="ar-panel flex flex-wrap items-center justify-between gap-3"><div><p className="ar-h2">🪙 {me.signedIn ? me.coins : 0} coins</p><p className="ar-muted">Earn coins by playing in Arcade rooms while signed in. Coins and characters are cosmetic only - no real money, no trading.</p></div><Link className="ar-btn sm paper" href="/arcade/characters">My collection</Link></div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="ar-card text-center">
          <div className="text-7xl float" aria-hidden>🎁</div><h2 className="text-2xl font-bold">{cat.odds.pack.name}</h2><p className="mt-1">One random character from the collection.</p>
          <button className="ar-btn coral xl mt-4" disabled={busy || !me.signedIn || me.coins < cost} onClick={open}>{busy ? "Opening…" : `Open pack · ${cost} 🪙`}</button>
          {!me.signedIn && <p className="mt-3 font-bold">Sign in to buy packs. <Link className="underline" href="/margins/login">Sign in</Link></p>}
          {me.signedIn && me.coins < cost && <p className="mt-3 font-bold">You need {cost - me.coins} more coins. Play a game to earn them!</p>}
          <p role="alert" className="mt-2 min-h-6 font-bold text-[var(--coral)]">{err}</p>
          {result && <div className="pop mt-2 grid place-items-center gap-1" role="status"><Avatar id={result.character.id} size={140} /><p className="ar-h2">{result.character.name}!</p><p className="font-bold">{result.duplicate ? "Duplicate - you already had this one." : "NEW character unlocked! 🎉"}</p><p className="text-sm">{result.character.tagline}</p></div>}
        </section>
        <section className="ar-panel"><h2 className="ar-h2 mb-2">Pack odds</h2>
          <table className="w-full text-left"><thead><tr className="ar-muted"><th>Rarity</th><th className="text-right">Chance</th></tr></thead><tbody>{cat.odds.rarities.map((r: any) => <tr key={r.id}><td className="py-1 font-bold">{r.label}</td><td className="text-right tabular-nums">{r.percent}%</td></tr>)}</tbody></table>
          <details className="mt-3"><summary className="cursor-pointer font-bold">Chance for each character</summary><table className="mt-2 w-full text-left text-sm"><tbody>{cat.odds.characters.map((c: any) => <tr key={c.id}><td className="py-1"><Avatar id={c.id} size={26} className="mr-2 inline" />{c.name}</td><td className="capitalize">{c.rarity}</td><td className="text-right tabular-nums">{c.percent}%</td></tr>)}</tbody></table></details>
          <p className="ar-muted mt-3 text-sm">Duplicates are possible. Odds are applied on the server when you open a pack.</p></section>
      </div>
    </div>
  );
}
