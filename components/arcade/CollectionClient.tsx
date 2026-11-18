"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { api } from "./useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CollectionClient() {
  const [cat, setCat] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  useEffect(() => { api("/api/arcade/economy", { type: "catalog" }).then(setCat); api("/api/arcade/economy", { type: "me" }).then(setMe); }, []);
  if (!cat || !me) return <p className="ar-h2">Loading…</p>;
  const owned = new Map<string, number>((me.owned ?? []).map((o: any) => [o.id, o.count]));
  const rarity = (id: string) => cat.odds.rarities.find((r: any) => r.id === id);
  const RC: Record<string, string> = { common: "#7a8aa5", uncommon: "#2fbf9b", rare: "#4d8dff", epic: "#a35cff", legendary: "#ffb02e" };
  return (
    <div className="grid gap-6">
      <div className="ar-panel flex flex-wrap items-center justify-between gap-3">
        <div><p className="ar-h2">{owned.size} / {cat.characters.length} collected</p><p className="ar-muted">Characters are cosmetic only - they never change gameplay.</p></div>
        {me.signedIn ? <Link className="ar-btn" href="/arcade/shop">🪙 {me.coins} coins · Open a pack</Link> : <Link className="ar-btn" href="/margins/login">Sign in to collect</Link>}
      </div>
      {!me.signedIn && <div className="ar-card">Guests can play, but coins and collections are saved to your account. Sign in to start collecting.</div>}
      <section aria-label="Collectible characters" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cat.characters.map((c: any) => { const n = owned.get(c.id) ?? 0; return (
          <article key={c.id} className="ar-card text-center" style={{ borderColor: n ? "var(--ink)" : "#8a8fb8", opacity: n ? 1 : 0.85 }}>
            <div style={{ filter: n ? undefined : "brightness(0) opacity(.25)" }} className={n ? "float" : ""}><Avatar id={c.id} size={96} title={n ? c.name : "Locked character"} /></div>
            <h3 className="mt-1 text-xl font-bold">{n ? c.name : "???"}</h3>
            <span className="ar-chip" style={{ background: RC[c.rarity], color: "#fff" }}>{rarity(c.rarity)?.label}</span>
            <p className="mt-2 min-h-10 text-sm">{n ? c.tagline : "Open a pack to discover."}</p>{n > 1 && <p className="text-sm font-bold">×{n}</p>}
          </article>); })}
      </section>
      <section className="ar-panel"><h2 className="ar-h2 mb-3">Free starter avatars</h2><div className="flex flex-wrap gap-4">{cat.starters.map((s: any) => <div key={s.id} className="ar-av"><Avatar id={s.id} size={64} /><span>{s.name}</span></div>)}</div></section>
    </div>
  );
}
