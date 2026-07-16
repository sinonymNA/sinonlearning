import { CAP_MAP, type Cap } from "@/lib/capsuleData";

// Maps cap IDs to their portrait PNGs — pre-cropped circles, no background needed
const CAP_PORTRAITS: Record<string, string> = {
  "cap-fox": "/assets/capsule/caps/cap-fox.png",
};

// Rarity glow applied as box-shadow on the circular portrait wrapper
const RARITY_GLOW: Record<string, string> = {
  common: "0 0 0 2px rgba(255,255,255,0.20), 0 0 12px rgba(255,255,255,0.18)",
  rare:   "0 0 0 2px rgba(147,197,253,0.55), 0 0 16px rgba(59,130,246,0.40), 0 0 32px rgba(59,130,246,0.15)",
  epic:   "0 0 0 2px rgba(167,139,250,0.80), 0 0 20px rgba(139,92,246,0.60), 0 0 40px rgba(139,92,246,0.25)",
  mythic: "0 0 0 2px rgba(253,224,71,0.95),  0 0 24px rgba(234,179,8,0.80),  0 0 48px rgba(234,179,8,0.35)",
};

// Fallback emoji circle — used when no portrait PNG exists yet
const RARITY_RING_COLOR: Record<string, string> = {
  common: "rgba(255,255,255,0.18)",
  rare:   "rgba(255,255,255,0.45)",
  epic:   "rgba(167,139,250,0.75)",
  mythic: "rgba(253,224,71,0.95)",
};

function ringWidth(size: number): number {
  return Math.max(2, Math.round(size * 0.055));
}

interface CapIconProps {
  capId: string;
  size?: number;
  showName?: boolean;
  /** Override the auto-resolved portrait path */
  portraitSrc?: string;
}

export default function CapIcon({ capId, size = 48, showName = false, portraitSrc }: CapIconProps) {
  const cap: Cap = CAP_MAP[capId] ?? CAP_MAP["cap-fox"];
  const portrait = portraitSrc ?? CAP_PORTRAITS[capId];
  const fontSize = Math.round(size * 0.46);
  const rw = ringWidth(size);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {portrait ? (
        // Portrait mode: circular image + rarity glow, no background
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            boxShadow: RARITY_GLOW[cap.rarity],
            flexShrink: 0,
            overflow: "hidden",
          }}
          title={cap.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portrait}
            alt={cap.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      ) : (
        // Emoji fallback: colored gradient circle for caps without a portrait yet
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: cap.bg,
            border: `${rw}px solid ${RARITY_RING_COLOR[cap.rarity]}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize,
            flexShrink: 0,
            userSelect: "none",
          }}
          title={cap.name}
        >
          {cap.emoji}
        </div>
      )}
      {showName && (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.2 }}>
          {cap.name}
        </span>
      )}
    </div>
  );
}
