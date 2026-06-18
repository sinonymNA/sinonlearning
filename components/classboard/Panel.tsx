"use client";

import { motion, useDragControls } from "framer-motion";
import { GripHorizontal, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function Panel({
  title,
  icon: Icon,
  initialX,
  initialY,
  width = 320,
  zIndex,
  onFocus,
  onClose,
  children,
}: {
  title: string;
  icon: LucideIcon;
  initialX: number;
  initialY: number;
  width?: number;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const dragControls = useDragControls();

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      initial={{ x: initialX, y: initialY, opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onPointerDown={onFocus}
      style={{ width, zIndex, position: "absolute", top: 0, left: 0 }}
      className="overflow-hidden rounded-2xl border border-cream-50/15 bg-navy-950/90 shadow-2xl backdrop-blur-xl"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex cursor-grab items-center justify-between gap-2 border-b border-cream-50/10 bg-cream-50/5 px-4 py-2.5 active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-cream-50">
          <Icon size={15} className="text-teal-300" />
          {title}
        </div>
        <div className="flex items-center gap-2 text-cream-50/40">
          <GripHorizontal size={14} />
          <button
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="rounded-full p-1 transition-colors hover:bg-cream-50/10 hover:text-cream-50"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="p-4 text-cream-50">{children}</div>
    </motion.div>
  );
}
