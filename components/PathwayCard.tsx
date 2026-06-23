import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default function PathwayCard({
  href,
  title,
  description,
  icon: Icon,
  cta = "Get started",
  theme = "light",
}: {
  href: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  cta?: string;
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";

  return (
    <Link
      href={href}
      className={`group relative block h-full overflow-hidden rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
        isDark
          ? "border-white/10 bg-white/[0.03] hover:border-teal-300/30 hover:shadow-[0_25px_60px_-15px_rgba(94,234,212,0.2)]"
          : "border-navy-900/8 bg-white shadow-[0_1px_2px_rgba(13,27,46,0.04)] hover:border-navy-900/12 hover:shadow-[0_16px_40px_rgba(13,27,46,0.1)]"
      }`}
    >
      {!isDark && (
        <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400 transition-transform duration-300 group-hover:scale-x-100" />
      )}
      {Icon && (
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            isDark ? "bg-teal-400/10 text-teal-300" : "bg-teal-50 text-teal-700"
          }`}
        >
          <Icon size={20} strokeWidth={2} />
        </span>
      )}
      <h3 className={`mt-5 font-display text-xl font-medium ${isDark ? "text-white" : "text-navy-900"}`}>
        {title}
      </h3>
      <p className={`mt-2.5 text-sm leading-relaxed ${isDark ? "text-white/65" : "text-navy-700/80"}`}>
        {description}
      </p>
      <span
        className={`mt-6 flex items-center gap-1.5 text-sm font-medium ${
          isDark ? "text-teal-300" : "text-teal-700"
        }`}
      >
        {cta}
        <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
