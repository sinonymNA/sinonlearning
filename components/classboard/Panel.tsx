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
      className="overflow-hidden rounded-2xl border border-navy-900/10 bg-cream-50/95 shadow-[0_20px_45px_-15px_rgba(13,27,46,0.18)] backdrop-blur-xl"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex cursor-grab items-center justify-between gap-2 border-b border-navy-900/8 bg-navy-900/[0.03] px-4 py-2.5 active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-navy-900">
          <Icon size={15} className="text-teal-600" />
          {title}
        </div>
        <div className="flex items-center gap-2 text-navy-700/40">
          <GripHorizontal size={14} />
          <button
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="rounded-full p-1 transition-colors hover:bg-navy-900/5 hover:text-navy-900"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="p-4 text-navy-900">{children}</div>
    </motion.div>
  );
}
