"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface StudioModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidthClassName?: string;
}

export default function StudioModal({
  open,
  onClose,
  title,
  children,
  maxWidthClassName = "max-w-lg",
}: StudioModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/55 p-4 print:static print:bg-transparent print:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`relative w-full ${maxWidthClassName} max-h-[88vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8 print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:shadow-none`}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl text-navy-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-navy-700/60 transition hover:bg-navy-900/5 hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
