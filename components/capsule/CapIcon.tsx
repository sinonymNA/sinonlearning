import { CAP_MAP, type Cap } from "@/lib/capsuleData";

const CAP_PORTRAITS: Record<string, string> = {
  // Classic set (original 10)
  "cap-fox":        "/assets/capsule/caps/cap-fox.png",
  "cap-cat":        "/assets/capsule/caps/cap-cat.png",
  "cap-dog":        "/assets/capsule/caps/cap-dog.png",
  "cap-frog":       "/assets/capsule/caps/cap-frog.png",
  "cap-fish":       "/assets/capsule/caps/cap-fish.png",
  "cap-duck":       "/assets/capsule/caps/cap-duck.png",
  "cap-owl":        "/assets/capsule/caps/cap-owl.png",
  "cap-bunny":      "/assets/capsule/caps/cap-bunny.png",
  "cap-bear":       "/assets/capsule/caps/cap-bear.png",
  "cap-hamster":    "/assets/capsule/caps/cap-hamster.png",
  // Classic Rare set (16 new)
  "cap-lion":       "/assets/capsule/caps/cap-lion.png",
  "cap-shark":      "/assets/capsule/caps/cap-shark.png",
  "cap-penguin":    "/assets/capsule/caps/cap-penguin.png",
  "cap-butterfly":  "/assets/capsule/caps/cap-butterfly.png",
  "cap-flamingo":   "/assets/capsule/caps/cap-flamingo.png",
  "cap-koala":      "/assets/capsule/caps/cap-koala.png",
  "cap-panda":      "/assets/capsule/caps/cap-panda.png",
  "cap-turtle":     "/assets/capsule/caps/cap-turtle.png",
  "cap-dragon":     "/assets/capsule/caps/cap-dragon.png",
  "cap-wolf":       "/assets/capsule/caps/cap-wolf.png",
  "cap-eagle":      "/assets/capsule/caps/cap-eagle.png",
  "cap-crystal":    "/assets/capsule/caps/cap-crystal.png",
  "cap-phoenix":    "/assets/capsule/caps/cap-phoenix.png",
  "cap-crown":      "/assets/capsule/caps/cap-crown.png",
  "cap-galaxy":     "/assets/capsule/caps/cap-galaxy.png",
  "cap-ghost":      "/assets/capsule/caps/cap-ghost.png",
  // Italian Brainrot set
  "cap-cappuccina":    "/assets/capsule/caps/cap-cappuccina.png",
  "cap-chimpanzini":   "/assets/capsule/caps/cap-chimpanzini.png",
  "cap-burbaloni":     "/assets/capsule/caps/cap-burbaloni.png",
  "cap-frigocamelo":   "/assets/capsule/caps/cap-frigocamelo.png",
  "cap-brrbrr":        "/assets/capsule/caps/cap-brrbrr.png",
  "cap-lirililala":    "/assets/capsule/caps/cap-lirililala.png",
  "cap-glorbo":        "/assets/capsule/caps/cap-glorbo.png",
  "cap-cappasino":     "/assets/capsule/caps/cap-cappasino.png",
  "cap-tungtungsahur": "/assets/capsule/caps/cap-tungtungsahur.png",
  // Space set
  "cap-astropup":   "/assets/capsule/caps/cap-astropup.png",
  "cap-moonbunny":  "/assets/capsule/caps/cap-moonbunny.png",
  "cap-robowl":     "/assets/capsule/caps/cap-robowl.png",
  "cap-zorp":       "/assets/capsule/caps/cap-zorp.png",
  "cap-cometfox":   "/assets/capsule/caps/cap-cometfox.png",
  "cap-nebulacat":  "/assets/capsule/caps/cap-nebulacat.png",
  "cap-orbitdrake": "/assets/capsule/caps/cap-orbitdrake.png",
  "cap-voidknight": "/assets/capsule/caps/cap-voidknight.png",
  // Caroline's Emotions set
  "cap-caroline-happy":     "/assets/capsule/caps/cap-caroline-happy.png",
  "cap-caroline-sassy":     "/assets/capsule/caps/cap-caroline-sassy.png",
  "cap-caroline-sad":       "/assets/capsule/caps/cap-caroline-sad.png",
  "cap-caroline-angry":     "/assets/capsule/caps/cap-caroline-angry.png",
  "cap-caroline-silly":     "/assets/capsule/caps/cap-caroline-silly.png",
  "cap-caroline-scared":    "/assets/capsule/caps/cap-caroline-scared.png",
  "cap-caroline-surprised": "/assets/capsule/caps/cap-caroline-surprised.png",
  "cap-caroline-tired":     "/assets/capsule/caps/cap-caroline-tired.png",
  "cap-caroline-confused":  "/assets/capsule/caps/cap-caroline-confused.png",
};

// Multi-layer box-shadows — richer and deeper than a single blur
const RARITY_SHADOW: Record<string, string> = {
  common: [
    "0 0 0 2px rgba(255,255,255,0.30)",
    "0 0 14px rgba(255,255,255,0.22)",
    "0 0 30px rgba(255,255,255,0.10)",
  ].join(", "),
  rare: [
    "0 0 0 2px rgba(96,165,250,0.75)",
    "0 0 0 5px rgba(96,165,250,0.14)",
    "0 0 16px rgba(59,130,246,0.62)",
    "0 0 34px rgba(59,130,246,0.34)",
    "0 0 60px rgba(59,130,246,0.14)",
  ].join(", "),
  epic: [
    "0 0 0 2px rgba(167,139,250,0.92)",
    "0 0 0 5px rgba(167,139,250,0.18)",
    "0 0 18px rgba(139,92,246,0.78)",
    "0 0 36px rgba(139,92,246,0.52)",
    "0 0 60px rgba(139,92,246,0.26)",
    "0 0 96px rgba(139,92,246,0.10)",
  ].join(", "),
  mythic: [
    "0 0 0 2px rgba(253,224,71,0.97)",
    "0 0 0 6px rgba(253,224,71,0.22)",
    "0 0 20px rgba(234,179,8,0.92)",
    "0 0 40px rgba(234,179,8,0.68)",
    "0 0 66px rgba(251,191,36,0.42)",
    "0 0 100px rgba(234,179,8,0.20)",
    "0 0 140px rgba(234,179,8,0.08)",
  ].join(", "),
};

// Conic gradient for the spinning halo ring (epic/mythic)
const RARITY_CONIC: Partial<Record<string, string>> = {
  epic: [
    "conic-gradient(from 0deg,",
    "rgba(167,139,250,0) 0%,",
    "rgba(167,139,250,0) 38%,",
    "rgba(167,139,250,0.85) 52%,",
    "rgba(255,255,255,0.95) 57%,",
    "rgba(167,139,250,0.85) 62%,",
    "rgba(167,139,250,0) 76%,",
    "rgba(167,139,250,0) 100%)",
  ].join(" "),
  mythic: [
    "conic-gradient(from 0deg,",
    "rgba(253,224,71,0) 0%,",
    "rgba(253,224,71,0) 32%,",
    "rgba(253,224,71,0.9) 45%,",
    "rgba(255,255,255,1) 50%,",
    "rgba(253,224,71,0.9) 55%,",
    "rgba(253,224,71,0) 68%,",
    "rgba(253,224,71,0) 82%,",
    "rgba(253,224,71,0.65) 90%,",
    "rgba(255,255,255,0.85) 93%,",
    "rgba(253,224,71,0.65) 96%,",
    "rgba(253,224,71,0) 100%)",
  ].join(" "),
};

// Pulsing bloom color per rarity
const BLOOM_COLOR: Record<string, string> = {
  common: "rgba(255,255,255,0.12)",
  rare:   "rgba(59,130,246,0.18)",
  epic:   "rgba(139,92,246,0.24)",
  mythic: "rgba(234,179,8,0.32)",
};
const BLOOM_DURATION: Record<string, string> = {
  common: "3s", rare: "2.5s", epic: "2s", mythic: "1.5s",
};
const RING_DURATION: Record<string, string> = {
  epic: "4s", mythic: "2.6s",
};

// Fallback ring color for emoji caps
const RARITY_RING_COLOR: Record<string, string> = {
  common: "rgba(255,255,255,0.28)",
  rare:   "rgba(96,165,250,0.70)",
  epic:   "rgba(167,139,250,0.85)",
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
  /** Enable animated glows, rotating ring, shimmer, orbit dots */
  animated?: boolean;
}

export default function CapIcon({
  capId, size = 48, showName = false, portraitSrc, animated = false,
}: CapIconProps) {
  const cap: Cap = CAP_MAP[capId] ?? CAP_MAP["cap-fox"];
  const portrait = portraitSrc ?? CAP_PORTRAITS[capId];
  const rarity = cap.rarity;
  const fontSize = Math.round(size * 0.46);
  const rw = ringWidth(size);

  // Computed sizing for animated effects
  const ringPad   = Math.max(3, Math.round(size * 0.08));   // halo ring extends this many px outside portrait
  const bloomInset = -Math.round(size * 0.28);              // bloom div extends this far outside
  const orbitGap  = Math.max(2, Math.round(size * 0.05));   // gap between portrait edge and orbit dot center
  const dotSize   = Math.max(4, Math.round(size * 0.09));   // orbit dot diameter

  const hasConic  = animated && (rarity === "epic" || rarity === "mythic");
  const hasShimmer = animated && rarity !== "common";
  const hasOrbit  = animated && rarity === "mythic";

  // Orbit dot configs — 3 dots with slightly varied speeds for organic feel
  const orbitDots = hasOrbit ? [
    { delay: "0s",     duration: "3.0s" },
    { delay: "-1.0s",  duration: "3.4s" },
    { delay: "-2.1s",  duration: "2.7s" },
  ] : [];

  const circleStyle: React.CSSProperties = {
    position: "relative",
    width: size, height: size,
    borderRadius: "50%",
    boxShadow: RARITY_SHADOW[rarity],
    zIndex: 1,
    overflow: "hidden",
    flexShrink: 0,
  };

  const emojiCircleStyle: React.CSSProperties = {
    ...circleStyle,
    background: cap.bg,
    border: `${rw}px solid ${RARITY_RING_COLOR[rarity]}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize,
    userSelect: "none",
  };

  // Shimmer sweep rendered inside the portrait/emoji circle (clips to circle shape)
  const shimmerEl = hasShimmer ? (
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden", pointerEvents: "none", zIndex: 2 }}>
      <div style={{
        position: "absolute", top: 0, bottom: 0,
        left: "-65%", width: "55%",
        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)",
        transform: "skewX(-12deg)",
        animation: "cap-shimmer 3.5s ease-in-out infinite",
        animationDelay: rarity === "rare" ? "0.5s" : rarity === "epic" ? "0.2s" : "0s",
      }} />
    </div>
  ) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {/* Outer positioning context — does NOT clip overflow so ring/bloom can extend out */}
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>

        {/* Pulsing bloom — large soft glow behind the portrait */}
        {animated && (
          <div style={{
            position: "absolute",
            top: bloomInset, left: bloomInset,
            right: bloomInset, bottom: bloomInset,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${BLOOM_COLOR[rarity]} 0%, transparent 70%)`,
            animation: `cap-pulse ${BLOOM_DURATION[rarity]} ease-in-out infinite`,
            zIndex: 0,
            pointerEvents: "none",
          }} />
        )}

        {/* Rotating halo ring — conic gradient disc that extends ringPad px outside portrait */}
        {hasConic && (
          <div style={{
            position: "absolute",
            top: -ringPad, left: -ringPad, right: -ringPad, bottom: -ringPad,
            borderRadius: "50%",
            background: RARITY_CONIC[rarity],
            animation: `cap-ring-rotate ${RING_DURATION[rarity]} linear infinite`,
            zIndex: 0,
            pointerEvents: "none",
          }} />
        )}

        {/* Portrait or emoji */}
        {portrait ? (
          <div style={circleStyle} title={cap.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portrait} alt={cap.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {shimmerEl}
          </div>
        ) : (
          <div style={emojiCircleStyle} title={cap.name}>
            {cap.emoji}
            {shimmerEl}
          </div>
        )}

        {/* Orbiting sparkle dots — mythic only */}
        {orbitDots.map(({ delay, duration }, i) => (
          <div key={i} style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 0, height: 0,
            animation: `cap-orbit ${duration} linear infinite`,
            animationDelay: delay,
            zIndex: 3,
            pointerEvents: "none",
          }}>
            <div style={{
              position: "absolute",
              top: -(size / 2 + orbitGap + dotSize / 2),
              left: -(dotSize / 2),
              width: dotSize, height: dotSize,
              borderRadius: "50%",
              background: "radial-gradient(circle, #fff 0%, #fde047 55%, #fbbf24 100%)",
              boxShadow: `0 0 ${dotSize}px ${Math.round(dotSize * 0.6)}px rgba(253,224,71,0.88)`,
            }} />
          </div>
        ))}
      </div>

      {showName && (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.2 }}>
          {cap.name}
        </span>
      )}
    </div>
  );
}
