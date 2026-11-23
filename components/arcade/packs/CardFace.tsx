"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
// One full-art trading card: the artwork fills the whole card, the name and sell value float on top, a text panel sits at the bottom, and a foil layer,
// star sparkles and a pointer-driven sheen sit over everything. The finish (standard/chrome/holo/gold/negative/glitch) changes the foil. Size comes from --cw.
import { useRef } from "react";
import { CARDS, SETS, RARITIES, VARIANTS } from "../../../arcade-server/packs/index.mjs";
import { artUrl } from "./sprites";
import { fmt } from "./format";

type Props = { id: string; variant?: string; value?: number; locked?: boolean; tilt?: boolean; className?: string; style?: React.CSSProperties; onClick?: () => void };

export default function CardFace({ id, variant = "standard", value, locked, tilt, className = "", style, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const idx = CARDS.findIndex((c: any) => c.id === id), card: any = CARDS[idx], set: any = SETS[card.set], rar: any = RARITIES.find((r: any) => r.id === card.rarity), v: any = VARIANTS.find((x: any) => x.id === variant);
  const move = (e: React.PointerEvent) => {
    const el = ref.current; if (!el || !tilt) return; const b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
    el.style.setProperty("--ry", `${((x - 0.5) * 22).toFixed(1)}deg`); el.style.setProperty("--rx", `${((0.5 - y) * 22).toFixed(1)}deg`); el.style.setProperty("--mx", `${(x * 100).toFixed(0)}%`); el.style.setProperty("--my", `${(y * 100).toFixed(0)}%`); el.classList.add("tilting");
  };
  const rest = () => { const el = ref.current; if (!el) return; for (const k of ["--rx", "--ry"]) el.style.setProperty(k, "0deg"); el.style.setProperty("--mx", "50%"); el.style.setProperty("--my", "50%"); el.classList.remove("tilting"); };
  return (
    <div ref={ref} className={`cf r-${card.rarity} v-${variant} ${locked ? "locked" : ""} ${className}`} style={{ ["--h" as any]: set.hue, ["--rc" as any]: rar.color, ...style }} onClick={onClick} onPointerMove={tilt ? move : undefined} onPointerLeave={tilt ? rest : undefined} onPointerUp={tilt ? rest : undefined}
      role={onClick ? "button" : undefined} aria-label={locked ? "Undiscovered card" : `${card.name}, ${rar.name}, ${v.name}`}>
      <div className="cf-art"><img src={artUrl(card, set.hue)} alt="" draggable={false} /></div>
      <span className="cf-foil" aria-hidden /><span className="cf-stars" aria-hidden><i /><i /><i /><i /><i /><i /><b /><b /><b /></span><span className="cf-sheen" aria-hidden />
      <div className="cf-top"><b>{locked ? "???" : card.name}</b>{value !== undefined && !locked && <span className="cf-val">${fmt(value)}</span>}</div>
      <div className="cf-bot"><span className="cf-line"><i>{locked ? "?" : rar.name}</i>{variant !== "standard" && !locked && <em>{v.name}</em>}</span><small>{locked ? "not found yet" : `${set.name} · ${String(idx + 1).padStart(3, "0")}/${CARDS.length}`}</small></div>
    </div>
  );
}
