"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
// The Meowdoku shop and closet. One tab per kind of thing (cats, hats, specs, colour sets, scenes, fish, poofs, marks, frames) plus the power-ups.
// Tap any card to see it on the live preview (try before you buy). Bought items cost yarn; earned items show exactly what to do to unlock them. No boxes, no odds.
import { useEffect, useMemo, useState } from "react";
import { SLOTS, RARITY, itemOf, itemsIn, owns, progressOf, closetCount, freshIn, DEFAULTS, ITEMS, MAX_POWERUPS, AREAS, areaIndex, LEVEL_COUNT } from "../../../arcade-server/meowdoku/index.mjs";
import { catUrlFor, fishSkinUrl, markUrl, type Equip } from "./closetArt";
import { yarnUrl, lockUrl } from "./mapArt";
import { itemIcon } from "./Sheets";

type Sel = { slot: string; id: string };
const PW_KEYS: Record<string, string> = { hint: "hints", helper: "winks", sweep: "sweeps", sardine: "sardines" };
// A small fixed 5x5 board for the preview (regions A-E), with a couple of cats and X marks.
const REG = ["00111", "02131", "02344", "22334", "23334"].map((r) => [...r].map(Number));
const CATS: [number, number][] = [[1, 3], [3, 1]], XS: [number, number][] = [[0, 0], [2, 2], [4, 3], [1, 0]];

function Preview({ eq, bd, hero }: { eq: Record<string, string>; bd: string; hero: boolean }) {
  const pal = (itemOf("palette", eq.palette) as any)?.colors || (itemOf("palette", DEFAULTS.palette) as any).colors;
  const e: Equip = { breed: eq.breed, hat: eq.hat, glasses: eq.glasses };
  return (
    <div className="cl-prev" style={{ background: bd }}>
      {hero && <div className="cl-hero"><img src={catUrlFor(e, "happy")} alt="" draggable={false} /><div className="cl-fishrow">{[false, false, true].map((lost, i) => <img key={i} src={fishSkinUrl(eq.fish, lost)} alt="" draggable={false} />)}</div></div>}
      <div className={`cg-board cl-board frame-${eq.frame}`} style={{ ["--n" as any]: 5 }} aria-hidden>
        {REG.map((row, r) => row.map((g, c) => {
          const isCat = CATS.some(([a, b]) => a === r && b === c), isX = XS.some(([a, b]) => a === r && b === c);
          const edge = (dr: number, dc: number) => (REG[r + dr]?.[c + dc] !== g ? "3px" : "1px");
          return (
            <div key={`${r},${c}`} className={`cg-cell cl-cell ${isCat ? "cat" : ""}`} style={{ background: pal[g], borderTopWidth: edge(-1, 0), borderBottomWidth: edge(1, 0), borderLeftWidth: edge(0, -1), borderRightWidth: edge(0, 1) }}>
              {isCat && <img src={catUrlFor(e, "normal")} alt="" draggable={false} />}
              {isCat && r === 1 && <span className={`puff cl-puff fx-${eq.fx}`}>{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ ["--a" as any]: `${i * 51}deg` }} />)}</span>}
              {isX && (eq.mark === "x" ? <span className="x" /> : <img className="mk" src={markUrl(eq.mark)} alt="" draggable={false} />)}
            </div>
          );
        }))}
      </div>
    </div>
  );
}
/** The picture on a card. */
function Art({ slot, item, eq, area }: { slot: string; item: any; eq: Record<string, string>; area: any }) {
  if (slot === "breed") return <img className="px" src={catUrlFor({ breed: item.id, hat: eq.hat, glasses: eq.glasses }, "normal")} alt="" draggable={false} />;
  if (slot === "hat") return <img className="px" src={catUrlFor({ breed: eq.breed, hat: item.id, glasses: "none" }, "normal")} alt="" draggable={false} />;
  if (slot === "glasses") return <img className="px" src={catUrlFor({ breed: eq.breed, hat: "none", glasses: item.id }, "normal")} alt="" draggable={false} />;
  if (slot === "palette") return <div className="cl-sw">{item.colors.map((c: string, i: number) => <i key={i} style={{ background: c }} />)}</div>;
  if (slot === "backdrop") return <div className="cl-bd" style={{ background: item.css || `linear-gradient(${area.bgA}, ${area.bgB})` }} />;
  if (slot === "fish") return <img className="px fish" src={fishSkinUrl(item.id)} alt="" draggable={false} />;
  if (slot === "fx") return <div className={`cl-fx puff fx-${item.id}`}>{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ ["--a" as any]: `${i * 51}deg` }} />)}</div>;
  if (slot === "mark") return item.id === "x" ? <div className="cl-x"><span className="x" /></div> : <img className="px mk" src={markUrl(item.id)} alt="" draggable={false} />;
  return <div className={`cl-fr frame-${item.id}`} />;
}

export default function Closet({ profile, level, startSlot, onBuy, onBuyPower, onEquip, onVisit, onClose }: { profile: any; level: number; startSlot?: string; onBuy: (slot: string, id: string) => void; onBuyPower: (item: string) => void; onEquip: (slot: string, id: string) => void; onVisit: (slot: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<string>(startSlot || "power"), [sel, setSel] = useState<Sel | null>(null);
  const area = AREAS[areaIndex(Math.min(level, LEVEL_COUNT))], equip: Record<string, string> = profile.closet.equip, count = closetCount(profile);
  useEffect(() => { if (tab !== "power") onVisit(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps
  const slot = SLOTS.find((s: any) => s.id === tab), items = useMemo(() => (slot ? itemsIn(tab) : []), [tab, slot]);
  const eq = { ...equip, ...(sel ? { [sel.slot]: sel.id } : {}) };
  const bdItem: any = itemOf("backdrop", eq.backdrop), bd = bdItem?.css || `linear-gradient(${area.bgA}, ${area.bgB})`;
  const cur: any = sel ? itemOf(sel.slot, sel.id) : null, curOwned = cur && owns(profile, cur.slot, cur.id), worn = cur && equip[cur.slot] === cur.id;
  const pick = (it: any) => setSel({ slot: it.slot, id: it.id });
  const status = (it: any) => { if (owns(profile, it.slot, it.id)) return equip[it.slot] === it.id ? "worn" : "owned"; if (it.unlock) return "earn"; return profile.yarn >= it.price ? "buy" : "poor"; };
  const selSlotName = (s: string) => (SLOTS.find((x: any) => x.id === s) as any)?.one;
  return (
    <div className="cl-sheet" role="dialog" aria-label="Shop and closet">
      <header className="cl-top">
        <button className="cg-btn round" onClick={onClose} aria-label="Close">✕</button>
        <div className="cl-title"><b>SHOP &amp; CLOSET</b><small>{count.owned} of {count.total} collected</small></div>
        <div className="cl-yarn" aria-label={`${profile.yarn} yarn`}><img src={yarnUrl()} alt="" draggable={false} /><b>{profile.yarn}</b></div>
      </header>
      <div className="cl-body">
        <section className="cl-left">
          <Preview eq={eq} bd={bd} hero />
          <div className="cl-detail" role="status" aria-live="polite">
            {cur ? (<>
              <div className="cl-dname"><b>{cur.name}</b><i style={{ color: (RARITY as any)[cur.rarity].color }}>{(RARITY as any)[cur.rarity].name.toUpperCase()}</i></div>
              <p>{cur.text}</p>
              {cur.unlock && !curOwned && (() => { const pr = progressOf(profile, cur.unlock); return <p className="cl-req"><img src={lockUrl()} alt="" draggable={false} />{pr.text}{cur.unlock.t !== "world" ? ` (${pr.have}/${pr.need})` : ""}</p>; })()}
              <div className="cl-act">
                {curOwned ? <button className="cg-btn go" disabled={worn} onClick={() => onEquip(cur.slot, cur.id)}>{worn ? `✓ WEARING` : cur.slot === "breed" ? "BE THIS CAT" : "USE IT"}</button>
                  : cur.unlock ? <button className="cg-btn" disabled>LOCKED</button>
                  : <button className="cg-btn go" disabled={profile.yarn < cur.price} onClick={() => onBuy(cur.slot, cur.id)}><img src={yarnUrl()} alt="" draggable={false} /> BUY {cur.price}</button>}
                {!curOwned && !cur.unlock && profile.yarn < cur.price && <small>{cur.price - profile.yarn} more yarn to go</small>}
              </div>
            </>) : <p className="mute">{tab === "power" ? "Power-ups help on tricky levels." : `Tap a ${selSlotName(tab) || "thing"} to try it on. Nothing is spent until you press BUY.`}</p>}
          </div>
        </section>
        <section className="cl-right">
          <nav className="cl-tabs" role="tablist" aria-label="Categories">
            <button role="tab" aria-selected={tab === "power"} className={tab === "power" ? "on" : ""} onClick={() => { setTab("power"); setSel(null); }}>POWER-UPS</button>
            {SLOTS.map((s: any) => { const c = closetCount(profile, s.id), fr = freshIn(profile, s.id); return <button key={s.id} role="tab" aria-selected={tab === s.id} className={tab === s.id ? "on" : ""} onClick={() => { setTab(s.id); setSel(null); }}>{s.name}<small>{c.owned}/{c.total}</small>{fr > 0 && <em aria-label={`${fr} new`}>{fr}</em>}</button>; })}
          </nav>
          {tab === "power" ? (
            <ul className="cl-power">
              {Object.entries(ITEMS).map(([k, it]: [string, any]) => { const have = profile[PW_KEYS[k]], full = have >= MAX_POWERUPS, poor = profile.yarn < it.price; return (
                <li key={k}><img src={itemIcon(k)} alt="" draggable={false} /><div><b>{it.name}</b> <span className="mute">×{have}</span><small>{it.text}</small></div><button className="cg-btn go" disabled={full || poor} onClick={() => onBuyPower(k)} aria-label={`Buy ${it.name} for ${it.price} yarn`}>{full ? "FULL" : <><img src={yarnUrl()} alt="" draggable={false} /> {it.price}</>}</button></li>); })}
            </ul>
          ) : (
            <ul className="cl-grid">
              {items.map((it: any) => { const st = status(it), isSel = !!sel && sel.slot === it.slot && sel.id === it.id, fresh = profile.closet.fresh.includes(`${it.slot}:${it.id}`); return (
                <li key={it.id}>
                  <button className={`cl-card ${st} ${isSel ? "sel" : ""} r-${it.rarity}`} data-slot={it.slot} data-id={it.id} onClick={() => pick(it)} aria-label={`${it.name}, ${(RARITY as any)[it.rarity].name}, ${st === "worn" ? "wearing" : st === "owned" ? "owned" : st === "earn" ? "locked, earn it" : `${it.price} yarn`}`}>
                    <span className="cl-art"><Art slot={it.slot} item={it} eq={equip} area={area} /></span>
                    <b>{it.name}</b>
                    <span className="cl-tag">{st === "worn" ? "✓ WEARING" : st === "owned" ? "OWNED" : st === "earn" ? <><img src={lockUrl()} alt="" draggable={false} />EARN</> : <><img src={yarnUrl()} alt="" draggable={false} />{it.price}</>}</span>
                    {fresh && <em className="cl-new">NEW</em>}
                  </button>
                </li>); })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
