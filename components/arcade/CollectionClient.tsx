"use client";

 

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { api } from "./useRoom";
import { RARITIES, SETS } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CollectionClient() {
  const [cat, setCat] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  useEffect(() => { api("/api/arcade/economy", { type: "catalog" }).then(setCat); api("/api/arcade/economy", { type: "me" }).then(setMe); }, []);
  if (!cat || !me) return <p className="ar-h2">Loading…</p>;
  const owned = new Map<string, number>((me.owned ?? []).map((o: any) => [o.id, o.count]));
  const rarity = (id: string) => ({ label: RARITIES[id]?.label ?? id });
  const RC: Record<string, string> = { common: "#7a8aa5", uncommon: "#2fbf9b", rare: "#4d8dff", epic: "#a35cff", legendary: "#ffb02e" };
  return (
    <div className="grid gap-6">
      <div className="ar-panel flex flex-wrap items-center justify-between gap-3">
        <div><p className="ar-h2">{owned.size} / {cat.characters.length} collected</p><p className="ar-muted">Characters are cosmetic only - they never change gameplay.</p></div>
        {me.signedIn ? <Link className="ar-btn" href="/arcade/shop">🪙 {me.coins} coins · Open a pack</Link> : <Link className="ar-btn" href="/arcade/account">Sign in to collect</Link>}
      </div>
      {!me.signedIn && <div className="ar-card">Guests can play, but coins and collections are saved to your account. Sign in to start collecting.</div>}
      {Object.values(SETS).map((set) => { const list = cat.characters.filter((c: any) => (c.set ?? "original") === set.id); const have = list.filter((c: any) => owned.get(c.id)).length; return (
        <section key={set.id} aria-label={`${set.name} characters`} className="grid gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="ar-h2">{set.name} <span className="ar-muted text-base">{have} / {list.length}</span></h2><p className="ar-muted text-sm">{set.blurb}</p></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((c: any) => { const n = owned.get(c.id) ?? 0; return (
              <article key={c.id} className="ar-card text-center" style={{ borderColor: n ? "var(--ink)" : "#8a8fb8", opacity: n ? 1 : 0.85 }}>
                <div style={{ filter: n ? undefined : "brightness(0) opacity(.25)" }} className={n ? "float" : ""}><Avatar id={c.id} size={96} title={n ? c.name : "Locked character"} /></div>
                <h3 className="mt-1 text-xl font-bold">{n ? c.name : "???"}</h3>
                <span className="ar-chip" style={{ background: RC[c.rarity], color: "#fff" }}>{rarity(c.rarity)?.label}</span>
                <p className="mt-2 min-h-10 text-sm">{n ? c.tagline : set.id === "snack" ? "Found only in the Snack Pack." : "Open a pack to discover."}</p>{n > 1 && <p className="text-sm font-bold">×{n}</p>}
              </article>); })}
          </div>
        </section>); })}
      {me.signedIn && (
        <section className="ar-panel flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Your data</h2><p className="ar-muted text-sm">The arcade stores only your coins and collection (linked to your account). Nicknames in game rooms are never saved after the session.</p></div>
          <button className="ar-btn sm coral" onClick={async () => { if (confirm("Delete all your arcade coins, characters and content sets? This cannot be undone.")) { await api("/api/arcade/economy", { type: "delete_my_data" }); setMe(await api("/api/arcade/economy", { type: "me" })); } }}>Delete my arcade data</button></section>
      )}
      <section className="ar-panel"><h2 className="ar-h2 mb-3">Free starter avatars</h2><div className="flex flex-wrap gap-4">{cat.starters.map((s: any) => <div key={s.id} className="ar-av"><Avatar id={s.id} size={64} /><span>{s.name}</span></div>)}</div></section>
    </div>
  );
}
