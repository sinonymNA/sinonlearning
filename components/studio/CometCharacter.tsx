"use client";

import { motion } from "framer-motion";

export type CometMood = "happy" | "thinking" | "excited";

interface CometCharacterProps {
  size?: number;
  mood?: CometMood;
  className?: string;
}

/**
 * Lightweight CSS/SVG placeholder for the Comet character — no image asset.
 */
export default function CometCharacter({ size = 72, mood = "happy", className = "" }: CometCharacterProps) {
  const eyeSize = size * 0.11;
  return (
    <motion.div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <span
        className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-amber-300/50 blur-[2px]"
        style={{ left: -size * 0.18, width: size * 0.42 }}
      />
      <span
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-amber-200/35 blur-[2px]"
        style={{ left: -size * 0.34, width: size * 0.28 }}
      />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-300 via-teal-400 to-purple-400 shadow-lg shadow-teal-900/20" />
      <div className="absolute inset-[14%] rounded-full bg-white/15" />
      <div className="absolute left-[28%] top-[36%] flex" style={{ gap: size * 0.14 }}>
        <span className="block rounded-full bg-navy-900" style={{ width: eyeSize, height: eyeSize }} />
        <span className="block rounded-full bg-navy-900" style={{ width: eyeSize, height: eyeSize }} />
      </div>
      {mood === "excited" && (
        <div
          className="absolute left-1/2 top-[58%] -translate-x-1/2 rounded-full border-navy-900"
          style={{
            width: size * 0.22,
            height: size * 0.16,
            borderWidth: size * 0.03,
            borderTopColor: "transparent",
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            transform: "translateX(-50%) rotate(180deg)",
          }}
        />
      )}
      {mood === "thinking" && (
        <div
          className="absolute left-1/2 top-[60%] -translate-x-1/2 rounded-full bg-navy-900"
          style={{ width: size * 0.18, height: size * 0.025 }}
        />
      )}
      {mood === "happy" && (
        <div
          className="absolute left-1/2 top-[55%] -translate-x-1/2 rounded-full border-navy-900"
          style={{
            width: size * 0.26,
            height: size * 0.16,
            borderWidth: size * 0.025,
            borderTopColor: "transparent",
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
          }}
        />
      )}
    </motion.div>
  );
}
