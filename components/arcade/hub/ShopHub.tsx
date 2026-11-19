"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AbyssFish } from "../AbyssClient";
import ShopClient from "../ShopClient";
import { PrefsProvider } from "../prefs";
import { HubTitle } from "./Hub";

/** One shop, two currencies: characters (coins) and Abyss fish (pearls). */
export default function ShopHub() {
  const [tab, setTab] = useState<"characters" | "fish">("characters");
  useEffect(() => { try { if (new URLSearchParams(window.location.search).get("tab") === "fish") setTab("fish"); } catch { /* ignore */ } }, []);
  const pick = (t: "characters" | "fish") => { setTab(t); try { window.history.replaceState(null, "", t === "fish" ? "?tab=fish" : window.location.pathname); } catch { /* ignore */ } };
  return (
    <PrefsProvider>
      <main className="hb">
        <HubTitle kicker="SPEND WHAT YOU EARN" title="SHOP" sub="Cosmetic only. No real money, no trading." />
        <div className="hb-tabs" role="tablist" aria-label="Shop sections">
          <button role="tab" aria-selected={tab === "characters"} className={tab === "characters" ? "on" : ""} onClick={() => pick("characters")}>🥔 CHARACTERS <small>coins</small></button>
          <button role="tab" aria-selected={tab === "fish"} className={tab === "fish" ? "on" : ""} onClick={() => pick("fish")}>🐠 ABYSS FISH <small>pearls</small></button>
          <Link href="/arcade/characters" className="hb-tabs-link">MY COLLECTION ▶</Link>
        </div>
        <div className="hb-shopbody" key={tab}>{tab === "characters" ? <ShopClient /> : <AbyssFish />}</div>
      </main>
    </PrefsProvider>
  );
}
