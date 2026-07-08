"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { ArrowRight } from "lucide-react";

interface Props {
  title: string;
  body: string;
  ctaLabel?: string;
  onDismiss: () => void;
  /** Small preview element shown above the copy — e.g. a mock of the button being taught. */
  preview?: React.ReactNode;
}

// A one-time, must-acknowledge callout that teaches a specific UI feature —
// deliberately NOT dismissible by clicking the backdrop, only via the CTA,
// which is what makes it a "coach mark" rather than an ordinary modal.
// Generic and content-agnostic on purpose: reuse this for any future
// onboarding moment by passing different title/body/preview.
export default function CoachMark({ title, body, ctaLabel = "Got it", onDismiss, preview }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      animate(cardRef.current, {
        opacity: [0, 1],
        scale: [0.85, 1],
        translateY: [12, 0],
        duration: 420,
        easing: "outBack",
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/50 p-6">
      <div
        ref={cardRef}
        className="w-full max-w-sm rounded-2xl border border-teal-100 bg-white p-6 text-center shadow-xl"
        style={{ opacity: 0 }}
      >
        {preview && <div className="mb-4 flex justify-center">{preview}</div>}
        <p className="text-[16px] font-bold text-stone-900 mb-2">{title}</p>
        <p className="text-[13px] leading-relaxed text-stone-500 mb-5">{body}</p>
        <button
          onClick={onDismiss}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-200 hover:shadow-md transition-all"
        >
          {ctaLabel}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
