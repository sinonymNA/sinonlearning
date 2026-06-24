"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export type CometMood = "happy" | "thinking" | "excited";

interface CometCharacterProps {
  size?: number;
  mood?: CometMood;
  className?: string;
}

export default function CometCharacter({ size = 72, mood = "happy", className = "" }: CometCharacterProps) {
  return (
    <motion.div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      animate={
        mood === "excited"
          ? { y: [0, -8, 0], rotate: [0, -4, 4, 0] }
          : { y: [0, -6, 0] }
      }
      transition={{
        duration: mood === "excited" ? 1.4 : 2.6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      aria-hidden="true"
    >
      <Image
        src="/studio/comet.png"
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-contain"
        priority={size >= 56}
      />
      {mood === "thinking" && (
        <motion.span
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-teal-300"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
