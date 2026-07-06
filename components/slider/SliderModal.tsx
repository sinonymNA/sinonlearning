"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { X } from "lucide-react";

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

export default function SliderModal({ title, onClose, children, maxWidthClassName = "max-w-lg" }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (backdropRef.current) {
      animate(backdropRef.current, { opacity: [0, 1], duration: 220, easing: "outQuart" });
    }
    if (panelRef.current) {
      animate(panelRef.current, { translateY: [30, 0], opacity: [0, 1], duration: 360, easing: "outQuart" });
    }
  }, []);

  function close() {
    if (panelRef.current) {
      animate(panelRef.current, { translateY: [0, 24], opacity: [1, 0], duration: 200, easing: "inQuart", onComplete: onClose });
    } else {
      onClose();
    }
    if (backdropRef.current) {
      animate(backdropRef.current, { opacity: [1, 0], duration: 180, easing: "inQuart" });
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slider-950/50 backdrop-blur-[2px]"
      style={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === backdropRef.current) close();
      }}
    >
      <div
        ref={panelRef}
        className={`w-full ${maxWidthClassName} rounded-2xl border border-slider-100 bg-white p-6 shadow-2xl flex flex-col gap-5 max-h-[85vh] overflow-y-auto`}
        style={{ opacity: 0 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-stone-900">{title}</h2>
          <button
            onClick={close}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
