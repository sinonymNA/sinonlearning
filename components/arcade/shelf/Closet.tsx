"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
// The Shelf Stocker shop and closet: one tab per kind of thing, a live preview of YOUR shop that shows whatever you tap (try before you buy), and clear goals for the items you earn.
// Coins are fake and only buy cosmetics. No boxes, no odds, no timers.
import { useEffect, useMemo, useState } from "react";
import { DECOR, SLOTS, RARITY, itemsIn, isEquipped, progressOf, closetCount, freshIn, DEFAULTS } from "../../../arcade-server/shelf/index.mjs";
import { coinUrl, itemUrl, itemUrlIn, iconUrl, setItemSkin, padlockUrl } from "./sprites";
import { petArt, cornerArt, FX_LOOK } from "./closetArt";
import Room, { roomCss } from "./Room";
import Lights from "./Lights";

const val = (id: string) => id.split(":")[1];


/** A little shop with your choices in it: the room, lights, sign, awning, three shelves with goods and labels, a corner piece, a pet and a rug. */
function ShopPreview({ eq, dept }: { eq: Record<string, string>; dept: number }) {
  setItemSkin(eq.skin);   // the preview wears the previewed item look, then the game puts its own back on its next render
  const bays: { k: string; icon: string; text: string; items: [string, number][] }[] = [
    { k: "k-rack", icon: "hanger", text: "SHIRTS", items: [["shirt", 0], ["shirt", 0], ["shirt", 0]] }, { k: "k-shelf", icon: "books", text: "BOOKS", items: [["book", 2], ["book", 2], ["book", 0]] }, { k: "k-label", icon: "s0", text: "SCIENCE", items: [["book", 0], ["book", 0]] },
  ];
  return (
    <div className={`cs-prev fin-${eq.finish} tag-${eq.tag} v-preview`}>
      <Room id={eq.theme} dept={dept} />
      <Lights id={eq.lights === "scene" ? "none" : eq.lights} />
      {eq.awning !== "none" && <div className={`sh-awning ${eq.awning}`} style={{ height: 20, backgroundSize: "40px 100%", WebkitMask: "radial-gradient(circle at 10px 100%, transparent 9px, #000 10px) 0 0 / 20px 100%", mask: "radial-gradient(circle at 10px 100%, transparent 9px, #000 10px) 0 0 / 20px 100%" } as any} />}
      <div className="cs-signwrap"><div className={`sh-sign sign-${eq.sign}`}><h1>SHELF STOCKER</h1></div></div>
      {eq.rug !== "none" && <div className={`sh-rug ${eq.rug} cs-rug`} />}
      <div className="cs-bays">{bays.map((b, i) => (
        <div key={i} className={`cs-bay sh-bay ${b.k}`} style={{ position: "relative" }}>
          <div className="sh-tag" style={{ position: "absolute", top: -17, left: "50%", height: 15, fontSize: 8, minWidth: 56, padding: "0 4px", gap: 3 }}><img src={iconUrl(b.icon)} alt="" draggable={false} style={{ height: 11 }} /><span>{b.text}</span></div>
          <div className="cs-stack">{b.items.map(([kd, v], j) => <img key={j} src={itemUrl(kd as any, v, false, false)} alt="" draggable={false} />)}</div>
        </div>))}
      </div>
      {eq.plant !== "none" && <img className="cs-corner" src={cornerArt(eq.plant)} alt="" draggable={false} />}
      {eq.pet !== "none" && <img className="cs-pet" src={petArt(eq.pet)} alt="" draggable={false} />}
    </div>
  );
}

/** The picture on a card. */
function Art({ slot, id, eq }: { slot: string; id: string; eq: Record<string, string> }) {
  const v = val(id);
  if (slot === "theme") { const c = roomCss(v); return <div className="cs-room" style={{ background: c ? c.wall : "linear-gradient(#efe7ff,#bdacec)" }}><i style={{ background: c ? c.floor : "linear-gradient(#c9b8f0,#a898e0)" }} /></div>; }
  if (slot === "finish") return <div className={`fin-${v} cs-fin`}><i /></div>;
  if (slot === "skin") return <div className="cs-goods"><img src={itemUrlIn(v, "shirt", 6)} alt="" draggable={false} /><img src={itemUrlIn(v, "book", 0)} alt="" draggable={false} /></div>;
  if (slot === "tag") return <div className={`tag-${v} cs-tagwrap`}><div className="sh-tag" style={{ position: "static", transform: "none", height: 24, fontSize: 11, padding: "0 8px", minWidth: 0, ...(v === "sticker" ? { transform: "rotate(-2.5deg)" } : {}) }}><img src={iconUrl("books")} alt="" draggable={false} style={{ height: 16 }} /><span>BOOKS</span></div></div>;
  if (slot === "pet") return v === "none" ? <span className="cs-none">–</span> : <img className="px" src={petArt(v)} alt="" draggable={false} />;
  if (slot === "plant") return v === "none" ? <span className="cs-none">–</span> : <img className="px tall" src={cornerArt(v)} alt="" draggable={false} />;
  if (slot === "lights") return v === "none" || v === "scene" ? <span className="cs-none">{v === "none" ? "–" : "auto"}</span> : <div className="cs-lights"><Lights id={v} /></div>;
  if (slot === "sign") return <div className={`sh-sign sign-${v} cs-sign`}><h1>SHELF STOCKER</h1></div>;
  if (slot === "awning") return v === "none" ? <span className="cs-none">–</span> : <div className={`sh-awning ${v} cs-awn`} />;
  if (slot === "rug") return v === "none" ? <span className="cs-none">–</span> : <div className={`sh-rug ${v} cs-rg`} />;
  const f = FX_LOOK[v]; return <div className="cs-fxs">{f.colors.concat(f.colors).slice(0, 5).map((c, i) => <i key={i} style={{ color: c, transform: `translate(${(i - 2) * 9}px, ${[-4, 3, -7, 3, -4][i]}px) rotate(${i * 38}deg)` }}>{f.glyph}</i>)}</div>;
}

export default function Closet({ profile, dept, startSlot, onBuy, onEquip, onVisit, onClose }: { profile: any; dept: number; startSlot?: string; onBuy: (id: string) => void; onEquip: (id: string) => void; onVisit: (slot: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<string>(startSlot || "theme"), [sel, setSel] = useState<string | null>(null);
  const equip: Record<string, string> = { ...DEFAULTS, ...profile.decor.equipped }, count = closetCount(profile);
  useEffect(() => { onVisit(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps
  const items = useMemo(() => itemsIn(tab), [tab]);
  const cur: any = sel ? DECOR.find((d: any) => d.id === sel) : null, eq = { ...equip, ...(cur ? { [cur.slot]: val(cur.id) } : {}) };
  const owned = (id: string) => profile.decor.owned.includes(id), worn = cur && isEquipped(profile, cur.id), curOwned = cur && owned(cur.id), one = (SLOTS.find((s: any) => s.id === tab) as any)?.one;
  const status = (d: any) => (owned(d.id) ? (isEquipped(profile, d.id) ? "worn" : "owned") : d.unlock ? "earn" : profile.coins >= d.price ? "buy" : "poor");
  return (
    <div className="cs-sheet" role="dialog" aria-label="Shop and closet">
      <header className="cs-top">
        <button className="sh-btn round" onClick={onClose} aria-label="Close">✕</button>
        <div className="cs-title"><b>SHOP &amp; CLOSET</b><small>{count.owned} of {count.total} collected</small></div>
        <div className="cs-coins" aria-label={`${profile.coins} coins`}><img src={coinUrl()} alt="" draggable={false} /><b>{profile.coins}</b></div>
      </header>
      <div className="cs-body">
        <section className="cs-left">
          <ShopPreview eq={eq} dept={dept} />
          <div className="cs-detail" role="status" aria-live="polite">
            {cur ? (<>
              <div className="cs-dname"><b>{cur.name}</b><i style={{ color: (RARITY as any)[cur.rarity].color }}>{(RARITY as any)[cur.rarity].name.toUpperCase()}</i></div>
              <p>{cur.text}</p>
              {cur.unlock && !curOwned && (() => { const pr = progressOf(profile, cur.unlock); return <p className="cs-req"><img src={padlockUrl()} alt="" draggable={false} />{pr.text}{cur.unlock.t !== "dept" ? ` (${pr.have}/${pr.need})` : ` (${pr.have}/10)`}</p>; })()}
              <div className="cs-act">
                {curOwned ? <button className="sh-btn go" disabled={worn} onClick={() => onEquip(cur.id)}>{worn ? "✓ IN USE" : "USE IT"}</button>
                  : cur.unlock ? <button className="sh-btn" disabled>LOCKED</button>
                  : <button className="sh-btn go" disabled={profile.coins < cur.price} onClick={() => onBuy(cur.id)}><img src={coinUrl()} alt="" draggable={false} /> BUY {cur.price}</button>}
                {!curOwned && !cur.unlock && profile.coins < cur.price && <small>{cur.price - profile.coins} more coins to go</small>}
              </div>
            </>) : <p className="mute">Tap a {one || "thing"} to see it in your shop. Nothing is spent until you press BUY.</p>}
          </div>
        </section>
        <section className="cs-right">
          <nav className="cs-tabs" role="tablist" aria-label="Categories">
            {SLOTS.map((s: any) => { const c = closetCount(profile, s.id), fr = freshIn(profile, s.id); return <button key={s.id} role="tab" aria-selected={tab === s.id} className={tab === s.id ? "on" : ""} onClick={() => { setTab(s.id); setSel(null); }}>{s.name}<small>{c.owned}/{c.total}</small>{fr > 0 && <em aria-label={`${fr} new`}>{fr}</em>}</button>; })}
          </nav>
          <ul className="cs-grid">
            {items.map((d: any) => { const st = status(d), isSel = sel === d.id, fresh = profile.decor.fresh.includes(d.id); return (
              <li key={d.id}>
                <button className={`cs-card ${st} ${isSel ? "sel" : ""} r-${d.rarity}`} data-id={d.id} onClick={() => setSel(d.id)} aria-label={`${d.name}, ${(RARITY as any)[d.rarity].name}, ${st === "worn" ? "in use" : st === "owned" ? "owned" : st === "earn" ? "locked, earn it" : `${d.price} coins`}`}>
                  <span className="cs-art"><Art slot={d.slot} id={d.id} eq={equip} /></span>
                  <b>{d.name}</b>
                  <span className="cs-tag">{st === "worn" ? "✓ IN USE" : st === "owned" ? "OWNED" : st === "earn" ? <><img src={padlockUrl()} alt="" draggable={false} />EARN</> : <><img src={coinUrl()} alt="" draggable={false} />{d.price}</>}</span>
                  {fresh && <em className="cs-new">NEW</em>}
                </button>
              </li>); })}
          </ul>
        </section>
      </div>
    </div>
  );
}
