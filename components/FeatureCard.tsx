import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ComingSoonBadge from "./ComingSoonBadge";

export interface FeatureCardItem {
  title: string;
  description: string;
  status: "Available" | "Coming Soon";
  href?: string;
  icon?: LucideIcon;
}

export default function FeatureCard({
  item,
  theme = "light",
}: {
  item: FeatureCardItem;
  theme?: "light" | "dark";
}) {
  // Every catalog entry gets a real, reachable page (status-gated content inside
  // it), so the card itself is clickable whenever an href exists — status only
  // changes the badge and visual treatment, not whether the link works.
  const available = item.status === "Available";
  const linkable = !!item.href;
  const Icon = item.icon;
  const isDark = theme === "dark";

  const inner = (
    <div
      className={`group relative h-full overflow-hidden rounded-3xl border p-7 transition-all duration-300 ${
        isDark
          ? available
            ? "border-teal-300/20 bg-white/5 hover:-translate-y-1 hover:border-teal-300/40 hover:shadow-[0_25px_60px_-15px_rgba(94,234,212,0.25)]"
            : "border-white/10 bg-white/[0.02] hover:border-white/20"
          : available
            ? "border-navy-900/8 bg-white hover:-translate-y-1 hover:border-navy-900/12 hover:shadow-[0_16px_40px_rgba(13,27,46,0.1)]"
            : "border-navy-900/8 bg-cream-50/60 hover:border-navy-900/12"
      }`}
    >
      {available && isDark && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
      )}
      {available && !isDark && (
        <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400 transition-transform duration-300 group-hover:scale-x-100" />
      )}

      <div className="flex items-center justify-between gap-3">
        {Icon ? (
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isDark ? "bg-teal-400/10 text-teal-300" : "bg-teal-50 text-teal-700"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
          </span>
        ) : (
          <span />
        )}
        {available ? (
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
              isDark
                ? "border-teal-300/30 bg-teal-400/10 text-teal-200"
                : "border-teal-200/80 bg-teal-50 text-teal-700"
            }`}
          >
            <Sparkles size={11} />
            Available
          </span>
        ) : (
          <ComingSoonBadge theme={theme} />
        )}
      </div>

      <h3
        className={`mt-5 font-display text-xl font-medium leading-snug ${
          available ? (isDark ? "text-white" : "text-navy-900") : isDark ? "text-white/60" : "text-navy-900/65"
        }`}
      >
        {item.title}
      </h3>
      <p
        className={`mt-3 text-sm leading-relaxed ${
          available ? (isDark ? "text-white/70" : "text-navy-700/80") : isDark ? "text-white/40" : "text-navy-700/55"
        }`}
      >
        {item.description}
      </p>

      {linkable && (
        <span
          className={`mt-6 flex items-center gap-1.5 border-t pt-5 text-sm font-medium ${
            isDark
              ? available
                ? "border-white/10 text-teal-300"
                : "border-white/10 text-white/50"
              : available
                ? "border-navy-900/8 text-teal-700"
                : "border-navy-900/8 text-navy-700/60"
          }`}
        >
          {available ? "Learn more" : "See what's planned"}
          <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      )}
    </div>
  );

  if (!linkable) {
    return <div className="h-full cursor-default">{inner}</div>;
  }

  return (
    <Link href={item.href!} className="block h-full">
      {inner}
    </Link>
  );
}
