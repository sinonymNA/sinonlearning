"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CapIcon from "@/components/capsule/CapIcon";
import { CAPS, CAP_MAP, RARITY_LABEL, type Cap } from "@/lib/capsuleData";

const RARITY_ORDER = ["mythic", "epic", "rare", "common"];
const RARITY_COLOR: Record<string, string> = {
  common: "#94a3b8",
  rare:   "#60a5fa",
  epic:   "#a78bfa",
  mythic: "#fde047",
};

interface Me {
  id: string; username: string; equippedCapId: string; coins: number; caps: string[];
}

export default function CollectionPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/capsule/auth/me")
      .then(r => r.json())
      .then(d => {
        if (!d.user) { router.push("/capsule"); return; }
        setMe(d.user);
      });
  }, [router]);

  async function equip(capId: string) {
    if (!me || equipping) return;
    setEquipping(capId);
    await fetch("/api/capsule/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capId }),
    });
    setMe(prev => prev ? { ...prev, equippedCapId: capId } : prev);
    setEquipping(null);
  }

  if (!me) return <div className="min-h-screen" style={{ background: "#06163E" }} />;

  const owned = new Set(me.caps);
  const byRarity = RARITY_ORDER.map(r => ({
    rarity: r,
    caps: CAPS.filter(c => c.rarity === r),
  }));

  return (
    <div className="min-h-screen" style={{ background: "#06163E" }}>
      {/* Header */}
      <div className="border-b border-white/8 px-5 py-4 flex items-center justify-between">
        <Link href="/capsule">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/capsule/logo.png" alt="Capsule" style={{ height: 36, objectFit: "contain" }} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-black text-yellow-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 18, height: 18, objectFit: "contain" }} />
            {me.coins}
          </div>
          <Link
            href="/capsule/open"
            className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest text-[#06163E]"
            style={{ background: "#19CDD2" }}
          >
            Open Capsule
          </Link>
        </div>
      </div>

      <div className="px-5 py-6 max-w-xl mx-auto">
        {/* Current cap */}
        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-white/8 bg-white/4 px-5 py-4">
          <CapIcon capId={me.equippedCapId} size={56} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Equipped</p>
            <p className="text-lg font-black text-white">{CAP_MAP[me.equippedCapId]?.name ?? me.equippedCapId}</p>
            <p className="text-xs capitalize" style={{ color: RARITY_COLOR[CAP_MAP[me.equippedCapId]?.rarity ?? "common"] }}>
              {RARITY_LABEL[CAP_MAP[me.equippedCapId]?.rarity ?? "common"]}
            </p>
          </div>
        </div>

        {/* Collection by rarity */}
        {byRarity.map(({ rarity, caps }) => {
          const ownedInTier = caps.filter(c => owned.has(c.id));
          return (
            <div key={rarity} className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: RARITY_COLOR[rarity] }}>
                  {RARITY_LABEL[rarity as keyof typeof RARITY_LABEL]}
                </span>
                <span className="text-[10px] text-white/20">{ownedInTier.length}/{caps.length}</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {caps.map(cap => {
                  const isOwned = owned.has(cap.id);
                  const isEquipped = me.equippedCapId === cap.id;
                  return (
                    <button
                      key={cap.id}
                      onClick={() => isOwned && !isEquipped ? equip(cap.id) : undefined}
                      disabled={!isOwned || equipping !== null}
                      title={isOwned ? cap.name : `${cap.name} (locked)`}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        opacity: isOwned ? 1 : 0.25,
                        filter: isOwned ? undefined : "grayscale(1)",
                        cursor: isOwned && !isEquipped ? "pointer" : "default",
                        background: "none", border: "none", padding: 0,
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <CapIcon capId={cap.id} size={52} />
                        {isEquipped && (
                          <div style={{
                            position: "absolute", inset: -3, borderRadius: "50%",
                            border: `2px solid ${RARITY_COLOR[rarity]}`,
                            boxShadow: `0 0 10px ${RARITY_COLOR[rarity]}`,
                          }} />
                        )}
                      </div>
                      <span style={{ fontSize: 9, color: isEquipped ? RARITY_COLOR[rarity] : "rgba(255,255,255,0.35)", textAlign: "center", lineHeight: 1.2 }}>
                        {isEquipped ? "Equipped" : cap.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <p className="text-center text-xs text-white/20 pb-4">
          {me.caps.length} / {CAPS.length} caps collected
        </p>
      </div>
    </div>
  );
}
