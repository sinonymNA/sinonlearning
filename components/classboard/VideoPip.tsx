"use client";

import { useRef, useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { GripHorizontal, X } from "lucide-react";

export default function VideoPip({
  videoId,
  zIndex,
  onFocus,
  onClose,
}: {
  videoId: string;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
}) {
  const dragControls = useDragControls();
  const [size, setSize] = useState({ width: 384, height: 216 });
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const onResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeStart.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
  };

  const onResizePointerMove = (e: React.PointerEvent) => {
    if (!resizeStart.current) return;
    const dx = e.clientX - resizeStart.current.x;
    const dy = e.clientY - resizeStart.current.y;
    const width = Math.max(220, resizeStart.current.width + dx);
    const height = Math.max(124, resizeStart.current.height + dy);
    setSize({ width, height });
  };

  const onResizePointerUp = () => {
    resizeStart.current = null;
  };

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      onPointerDown={onFocus}
      initial={{ x: 24, y: 24, opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{ position: "absolute", top: 0, left: 0, zIndex, width: size.width }}
      className="overflow-hidden rounded-2xl border border-navy-900/10 bg-cream-50/95 shadow-[0_20px_45px_-15px_rgba(13,27,46,0.2)]"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex cursor-grab items-center justify-between gap-2 border-b border-navy-900/8 bg-navy-900/[0.03] px-3 py-1.5 active:cursor-grabbing"
      >
        <span className="text-xs font-medium text-navy-800">Video</span>
        <div className="flex items-center gap-2 text-navy-700/40">
          <GripHorizontal size={12} />
          <button
            onClick={onClose}
            aria-label="Close video"
            className="rounded-full p-0.5 transition-colors hover:bg-navy-900/5 hover:text-navy-900"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div style={{ height: size.height }} className="relative bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
          title="Picture-in-picture video"
          allow="accelerate-content; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
        <div
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          className="absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize touch-none"
        >
          <svg viewBox="0 0 16 16" className="h-full w-full text-cream-50/70">
            <path d="M14 2L2 14M14 8L8 14M14 14L14 14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
