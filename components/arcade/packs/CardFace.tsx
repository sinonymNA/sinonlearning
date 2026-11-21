"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
// One trading card: name banner, set-themed scene with the creature, rarity gem, finish effects and sell value. Size comes from --cw.
import { CARDS, SETS, RARITIES, VARIANTS } from "../../../arcade-server/packs/index.mjs";
import { artUrl } from "./sprites";
import { fmt } from "./format";

type Props = { id: string; variant?: string; value?: number; locked?: boolean; className?: string; style?: React.CSSProperties; onClick?: () => void };

export default function CardFace({ id, variant = "standard", value, locked, className = "", style, onClick }: Props) {
  const card: any = CARDS.find((c: any) => c.id === id), set: any = SETS[card.set], rar: any = RARITIES.find((r: any) => r.id === card.rarity), v: any = VARIANTS.find((x: any) => x.id === variant);
  return (
    <div className={`cf r-${card.rarity} v-${variant} ${locked ? "locked" : ""} ${className}`} style={{ ["--h" as any]: set.hue, ["--rc" as any]: rar.color, ...style }} onClick={onClick} role={onClick ? "button" : undefined} aria-label={locked ? "Undiscovered card" : `${card.name}, ${rar.name}, ${v.name}`}>
      <div className="cf-top"><b>{locked ? "???" : card.name}</b><span className="cf-gem" aria-hidden /></div>
      <div className="cf-art"><img src={artUrl(card, set.hue)} alt="" draggable={false} /><span className="cf-fx" aria-hidden /></div>
      <div className="cf-bot"><i>{locked ? "?" : rar.name}</i>{variant !== "standard" && !locked && <em>{v.name}</em>}{value !== undefined && !locked && <span>${fmt(value)}</span>}</div>
    </div>
  );
}
