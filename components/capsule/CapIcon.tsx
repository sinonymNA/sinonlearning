import { CAP_MAP, type Cap } from "@/lib/capsuleData";

const RARITY_RING: Record<string, string> = {
  common: "2px solid rgba(255,255,255,0.15)",
  rare: "2px solid rgba(255,255,255,0.4)",
  epic: "3px solid rgba(196,181,253,0.7)",
  mythic: "3px solid rgba(253,224,71,0.9)",
};

const RARITY_SHADOW: Record<string, string> = {
  common: "none",
  rare: "0 0 10px rgba(255,255,255,0.1)",
  epic: "0 0 18px rgba(167,139,250,0.45)",
  mythic: "0 0 28px rgba(253,224,71,0.5)",
};

interface CapIconProps {
  capId: string;
  size?: number;
  showName?: boolean;
}

export default function CapIcon({ capId, size = 48, showName = false }: CapIconProps) {
  const cap: Cap = CAP_MAP[capId] ?? CAP_MAP["cap-fox"];
  const fontSize = Math.round(size * 0.46);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: cap.bg,
          border: RARITY_RING[cap.rarity],
          boxShadow: RARITY_SHADOW[cap.rarity],
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
      {showName && (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.2 }}>
          {cap.name}
        </span>
      )}
    </div>
  );
}
