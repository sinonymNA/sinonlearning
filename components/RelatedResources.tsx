import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FadeIn from "./FadeIn";

export interface RelatedResourceLink {
  label: string;
  href: string;
}

export default function RelatedResources({
  links,
  theme = "light",
  title = "Keep exploring",
}: {
  links: RelatedResourceLink[];
  theme?: "light" | "dark";
  title?: string;
}) {
  const isDark = theme === "dark";

  return (
    <FadeIn>
      <div
        className={`rounded-3xl border p-6 sm:p-8 ${
          isDark ? "border-white/10 bg-white/[0.02]" : "border-navy-900/8 bg-cream-100/60"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-[0.14em] ${
            isDark ? "text-teal-300/70" : "text-teal-700"
          }`}
        >
          {title}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                isDark
                  ? "border-white/10 bg-white/5 text-white/80 hover:border-teal-300/30 hover:text-teal-200"
                  : "border-navy-900/8 bg-white text-navy-800 hover:border-teal-600/30 hover:text-teal-700"
              }`}
            >
              {link.label}
              <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
