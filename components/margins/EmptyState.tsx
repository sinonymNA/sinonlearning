import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { MarginsAccent } from "./moduleThemes";

// Shared empty state for Margins.
//
// The previous pattern — a grey 26px icon and one flat line — was doing no
// work at the exact moment a new teacher or student is deciding whether the
// product is worth their time. This version answers three questions instead of
// none: what goes here, why it's worth doing, and what to press.

interface Props {
  icon: LucideIcon;
  title: string;
  /** One or two sentences on why this is worth doing — not just what's absent. */
  body: string;
  accent: MarginsAccent;
  /** Optional link CTA. For a button that opens a modal, pass `action` instead. */
  href?: string;
  cta?: string;
  /** Rendered in the CTA slot — for client components like NewClassButton. */
  action?: React.ReactNode;
  /** Short reassurances shown as a row beneath the CTA. */
  hints?: string[];
}

export default function EmptyState({
  icon: Icon,
  title,
  body,
  accent,
  href,
  cta,
  action,
  hints,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center">
      {/* Faint dot field so the panel reads as intentional space rather than a
          rendering gap. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: "radial-gradient(circle, rgb(214 211 209 / 0.7) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black, transparent 72%)",
        }}
      />

      <div className="relative mx-auto flex max-w-md flex-col items-center gap-3">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${accent.iconBg} ${accent.iconText} rotate-[-6deg] ring-1 ring-inset ${accent.ring}`}
        >
          <Icon size={24} strokeWidth={1.9} />
        </span>

        <h3 className="mt-1 text-[16px] font-bold text-stone-900">{title}</h3>
        <p className="text-[13.5px] leading-relaxed text-stone-500">{body}</p>

        {action ? (
          <div className="mt-2">{action}</div>
        ) : href && cta ? (
          <Link
            href={href}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
          >
            {cta} <span aria-hidden>→</span>
          </Link>
        ) : null}

        {hints && hints.length > 0 && (
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {hints.map((h) => (
              <span key={h} className="text-[11px] text-stone-400">
                {h}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
