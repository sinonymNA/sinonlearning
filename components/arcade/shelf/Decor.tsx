"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
// The decor shop: spend coins on cosmetic upgrades for your shop. Everything here is cosmetic and bought with coins you earn by playing.
import { DECOR, SLOTS, isEquipped } from "../../../arcade-server/shelf/index.mjs";
import { coinUrl, plantUrl, petUrl } from "./sprites";

export default function Decor({ profile, onBuy, onEquip, onClose }: { profile: any; onBuy: (id: string) => void; onEquip: (id: string) => void; onClose: () => void }) {
  return (
    <div className="sh-modal" role="dialog" aria-label="Decorate your shop" onClick={onClose}>
      <div className="sh-card wide decor" onClick={(e) => e.stopPropagation()}>
        <h2>DECORATE YOUR SHOP</h2>
        <p className="sh-bank"><img src={coinUrl()} alt="" draggable={false} /> <b>{profile.coins}</b> coins</p>
        <p className="mute">Levels and the Daily Delivery pay coins. Everything here is just for fun.</p>
        <div className="sh-decor">
          {SLOTS.map((sl: any) => (
            <section key={sl.id}><h3>{sl.name}</h3>
              <div className="sh-dopts">{DECOR.filter((d: any) => d.slot === sl.id).map((d: any) => {
                const owned = profile.decor.owned.includes(d.id), on = isEquipped(profile, d.id), poor = !owned && profile.coins < d.price, val = d.id.split(":")[1];
                return (
                  <button key={d.id} className={`sh-dopt ${on ? "on" : ""}`} disabled={poor} onClick={() => (owned ? onEquip(d.id) : onBuy(d.id))} aria-label={`${sl.name}: ${d.name}. ${on ? "On display" : owned ? "Owned, tap to use" : `${d.price} coins`}`}>
                    <span className={`pv pv-${sl.id} ${val}`}>{sl.id === "plant" && val !== "none" && <img src={plantUrl()} alt="" draggable={false} />}{sl.id === "pet" && val !== "none" && <img src={petUrl(val as "cat" | "dog")} alt="" draggable={false} />}{val === "none" && "–"}</span>
                    <b>{d.name}</b><small>{on ? "✓ on display" : owned ? "owned" : <><img src={coinUrl()} alt="" draggable={false} /> {d.price}</>}</small>
                  </button>
                );
              })}</div>
            </section>
          ))}
        </div>
        <button className="sh-btn go big" onClick={onClose}>DONE</button>
      </div>
    </div>
  );
}
