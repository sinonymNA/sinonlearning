"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Avatar from "./Avatar";
import PackOpener from "./PackOpener";
import { CHARACTERS, RARITIES, allPackOdds } from "@/lib/arcadeCatalog";
// @ts-ignore - plain ESM, browser-safe
import { rollPack } from "../../arcade-server/characters.mjs";

/** Free practice packs: same odds and animation as the real shop, but nothing is charged or saved. */
export default function PackDemo() {
  const [found, setFound] = useState<Record<string, number>>({});
  const [peek, setPeek] = useState(false);
  const seen = useRef<Record<string, number>>({});
  const [packId, setPackId] = useState("basic");
  const packs = allPackOdds();
  const odds = packs.find((p) => p.pack.id === packId) ?? packs[1];
  const open = async () => {
    const character = rollPack(packId) as { id: string; name: string; rarity: string; tagline: string };
    const duplicate = (seen.current[character.id] ?? 0) > 0;
    seen.current[character.id] = (seen.current[character.id] ?? 0) + 1;
    setFound({ ...seen.current });
    return { character, duplicate };
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="ar-panel grid justify-items-center gap-3 text-center">
        <span className="ar-pill" style={{ background: "var(--sun)", color: "var(--ink)" }}>DEMO · free practice pack</span>
        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Pick a demo pack">{packs.map((p) => <button key={p.pack.id} role="tab" aria-selected={packId === p.pack.id} className={`ar-btn sm ${packId === p.pack.id ? "" : "paper"}`} onClick={() => setPackId(p.pack.id)}>{p.pack.name.replace(" Pack", "")} · {p.pack.cost}🪙</button>)}</div>
        <PackOpener key={packId} pack={odds.pack} onOpen={open} label={`Open a demo ${odds.pack.name}`} hint={`Nothing is charged or saved. The real ${odds.pack.name} costs ${odds.pack.cost} coins.`} />
        <Link className="ar-btn sm paper" href="/arcade/shop">Go to the real shop</Link>
      </section>
      <section className="grid content-start gap-4">
        <div className="ar-panel"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="ar-h2">Found in this demo: {Object.keys(found).filter((id) => CHARACTERS.find((c) => c.id === id && (odds.pack.id === "snack" ? c.set === "snack" : !c.set))).length} / {CHARACTERS.filter((c) => (odds.pack.id === "snack" ? c.set === "snack" : !c.set)).length}</h2><button className="ar-btn sm paper" onClick={() => setPeek(!peek)}>{peek ? "Hide" : "Peek at everyone"}</button></div>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8">
            {CHARACTERS.filter((c) => (odds.pack.id === "snack" ? c.set === "snack" : !c.set)).map((c) => <div key={c.id} title={found[c.id] ? c.name : "???"} style={{ filter: found[c.id] || peek ? undefined : "brightness(0) opacity(.22)", position: "relative" }}><Avatar id={c.id} size={peek ? 56 : 44} />{found[c.id] > 1 && <span className="absolute -right-1 -top-1 rounded-full bg-[var(--sun)] px-1 text-[10px] font-bold text-[var(--ink)]">×{found[c.id]}</span>}</div>)}
          </div></div>
        <div className="ar-panel"><h3 className="mb-2 font-bold">{odds.pack.name} odds</h3>
          <ul className="grid gap-1">{odds.rarities.map((r) => <li key={r.id} className="flex justify-between"><span className="font-bold" style={{ color: RARITIES[r.id].color }}>{r.label}</span><span className="tabular-nums">{r.percent}%</span></li>)}</ul></div>
      </section>
    </div>
  );
}
