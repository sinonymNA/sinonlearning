import { CAP_MAP, type Cap } from "@/lib/capsuleData";

// Maps cap IDs to their generated portrait PNGs under /assets/capsule/caps/
const CAP_PORTRAITS: Record<string, string> = {
  "cap-fox": "/assets/capsule/caps/cap-fox.png",
};

// Ring width scales with icon size, min 2px
function ringWidth(size: number): number {
  return Math.max(2, Math.round(size * 0.055));
}

const RARITY_RING_COLOR: Record<string, string> = {
  common:  "rgba(255,255,255,0.18)",
  rare:    "rgba(255,255,255,0.45)",
  epic:    "rgba(167,139,250,0.75)",
  mythic:  "rgba(253,224,71,0.95)",
};

const RARITY_SHADOW: Record<string, string> = {
  common: "none",
  rare:   "0 0 10px rgba(255,255,255,0.12)",
  epic:   "0 0 18px rgba(167,139,250,0.5)",
  mythic: "0 0 28px rgba(253,224,71,0.55)",
};

interface CapIconProps {
  capId: string;
  size?: number;
  showName?: boolean;
  /** Pass the path to a portrait PNG once assets land, e.g. "/assets/capsule/caps/cap-fox.png" */
  portraitSrc?: string;
}

export default function CapIcon({ capId, size = 48, showName = false, portraitSrc }: CapIconProps) {
  const cap: Cap = CAP_MAP[capId] ?? CAP_MAP["cap-fox"];
  const portrait = portraitSrc ?? CAP_PORTRAITS[capId];
  const fontSize = Math.round(size * 0.46);
  const rw = ringWidth(size);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: cap.bg,
          border: `${rw}px solid ${RARITY_RING_COLOR[cap.rarity]}`,
          boxShadow: RARITY_SHADOW[cap.rarity],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          flexShrink: 0,
          userSelect: "none",
          overflow: "hidden",
          position: "relative",
        }}
        title={cap.name}
      >
        {portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portrait}
            alt={cap.name}
            style={{ width: "92%", height: "92%", objectFit: "contain", display: "block" }}
          />
        ) : (
          cap.emoji
        )}
      </div>
      {showName && (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.2 }}>
          {cap.name}
        </span>
      )}
    </div>
  );
}
