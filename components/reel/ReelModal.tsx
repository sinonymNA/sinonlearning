"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { X } from "lucide-react";

export default function ReelModal({
  title,
  onClose,
  children,
  maxWidthClassName = "max-w-lg",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (backdropRef.current) animate(backdropRef.current, { opacity: [0, 1], duration: 220, easing: "outQuart" });
    if (panelRef.current) animate(panelRef.current, { translateY: [30, 0], opacity: [0, 1], duration: 360, easing: "outQuart" });
  }, []);

  function close() {
    if (panelRef.current) {
      animate(panelRef.current, { translateY: [0, 24], opacity: [1, 0], duration: 200, easing: "inQuart", onComplete: onClose });
    } else {
      onClose();
    }
    if (backdropRef.current) animate(backdropRef.current, { opacity: [1, 0], duration: 180, easing: "inQuart" });
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] sm:items-center"
      style={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === backdropRef.current) close();
      }}
    >
      <div
        ref={panelRef}
        className={`flex w-full ${maxWidthClassName} max-h-[85vh] flex-col gap-5 overflow-y-auto rounded-2xl border border-sky-100 bg-white p-6 shadow-2xl`}
        style={{ opacity: 0 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
          <button
            onClick={close}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
