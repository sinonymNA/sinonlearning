"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CAPSULE_SETS, CAPS, type CapsuleSet } from "@/lib/capsuleData";

interface Me { id: string; username: string; coins: number; email: string; }

const RARITY_COLOR = { common: "#94a3b8", rare: "#60a5fa", epic: "#a78bfa", mythic: "#fde047" };

function rarityOdds(setId: string) {
  const pool = CAPS.filter(c => c.set === setId);
  if (!pool.length) return null;
  const counts: Record<string, number> = { common: 0, rare: 0, epic: 0, mythic: 0 };
  const weights: Record<string, number> = { common: 65, rare: 25, epic: 8, mythic: 2 };
  let total = 0;
  for (const c of pool) { counts[c.rarity] += weights[c.rarity]; total += weights[c.rarity]; }
  return Object.entries(counts)
    .filter(([, w]) => w > 0)
    .map(([r, w]) => ({ rarity: r, pct: Math.round((w / total) * 100) }));
}

export default function StorePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/capsule/auth/me").then(r => r.json()).then(d => {
      if (!d.user) { router.push("/capsule"); return; }
      setMe(d.user);
      setLoading(false);
    });
  }, [router]);

  if (loading) return <div style={{ minHeight: "100dvh", background: "#07183F" }} />;

  return (
    <div style={{ minHeight: "100dvh", background: "#07183F", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(7,24,63,0.80)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/capsule/store/icon-shop-sign.png" alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "0.04em" }}>Capsule Store</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {me && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,197,46,0.15)",
              border: "1px solid rgba(255,197,46,0.35)",
              borderRadius: 99, padding: "5px 12px",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 18, height: 18, objectFit: "contain" }} />
              <span style={{ fontSize: 13, fontWeight: 900, color: "#FFC52E" }}>{me.coins}</span>
            </div>
          )}
          <Link href="/capsule" style={{
            fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.40)",
            textDecoration: "none", padding: "5px 10px",
          }}>← Back</Link>
        </div>
      </div>

      {/* Set cards */}
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 500, margin: "0 auto" }}>
        {CAPSULE_SETS.map(set => (
          <SetCard key={set.id} set={set} coins={me?.coins ?? 0} isDemo={me?.email?.endsWith("@capsule.demo") ?? false} />
        ))}
      </div>
    </div>
  );
}

function SetCard({ set, coins, isDemo }: { set: CapsuleSet; coins: number; isDemo: boolean }) {
  const odds = rarityOdds(set.id);
  const capsCount = CAPS.filter(c => c.set === set.id).length;
  const canAfford = isDemo || coins >= set.cost;

  return (
    <div style={{
      borderRadius: 20,
      border: `1px solid ${set.available ? set.accentColor + "40" : "rgba(255,255,255,0.08)"}`,
      background: set.available
        ? `linear-gradient(135deg, rgba(7,24,63,0.95), ${set.glowColor.replace("0.55", "0.08")})`
        : "rgba(255,255,255,0.03)",
      overflow: "hidden",
      opacity: set.available ? 1 : 0.6,
    }}>
      <div style={{ display: "flex", gap: 0 }}>

        {/* Ball graphic */}
        <div style={{
          width: 130, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px 10px",
          background: `radial-gradient(circle at 50% 60%, ${set.glowColor.replace("0.55", "0.20")}, transparent 70%)`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={set.ballIcon}
            alt={set.name}
            style={{
              width: 90, height: 90, objectFit: "contain",
              filter: set.available ? `drop-shadow(0 0 14px ${set.glowColor})` : "none",
            }}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: "18px 16px 18px 4px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{set.name}</span>
              {!set.available && (
                <span style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: "0.08em",
                  background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)",
                  borderRadius: 99, padding: "2px 8px", textTransform: "uppercase",
                }}>Soon</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 10px", lineHeight: 1.4 }}>
              {set.description}
            </p>

            {/* Rarity odds */}
            {odds && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {odds.map(({ rarity, pct }) => (
                  <span key={rarity} style={{
                    fontSize: 10, fontWeight: 700,
                    color: RARITY_COLOR[rarity as keyof typeof RARITY_COLOR],
                  }}>
                    {pct}% {rarity}
                  </span>
                ))}
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}> · {capsCount} caps</span>
              </div>
            )}
          </div>

          {/* Cost + CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/capsule/coin.png" alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
              <span style={{ fontSize: 14, fontWeight: 900, color: "#FFC52E" }}>
                {isDemo ? "Free" : set.cost}
              </span>
            </div>

            {set.available ? (
              <Link
                href={`/capsule/open?set=${set.id}`}
                style={{
                  display: "inline-block",
                  padding: "9px 20px",
                  borderRadius: 99,
                  background: canAfford ? set.accentColor : "rgba(255,255,255,0.10)",
                  color: canAfford ? (set.id === "classic" ? "#fff" : "#06163E") : "rgba(255,255,255,0.35)",
                  fontSize: 12, fontWeight: 900,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  textDecoration: "none",
                  boxShadow: canAfford ? `0 3px 0 rgba(0,0,0,0.25)` : "none",
                  pointerEvents: canAfford ? "auto" : "none",
                }}
              >
                Open
              </Link>
            ) : (
              <span style={{
                padding: "9px 20px", borderRadius: 99,
                background: "rgba(255,255,255,0.06)",
                fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                Locked
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
