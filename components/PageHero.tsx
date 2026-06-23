import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import FadeIn from "./FadeIn";

export default function PageHero({
  eyebrow,
  title,
  description,
  theme = "light",
  backHref,
  backLabel = "Back",
  align = "left",
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  theme?: "light" | "dark";
  backHref?: string;
  backLabel?: string;
  align?: "left" | "center";
  children?: ReactNode;
}) {
  const isDark = theme === "dark";
  const alignClasses = align === "center" ? "mx-auto text-center" : "";

  return (
    <section
      className={`relative overflow-hidden px-6 pt-16 pb-16 lg:px-8 lg:pt-24 ${
        isDark ? "bg-circuit bg-navy-950" : "bg-grain bg-cream-50"
      }`}
    >
      <div
        className={`absolute left-1/3 top-0 -z-10 h-96 w-96 -translate-y-1/3 rounded-full bg-teal-400/15 blur-[120px]`}
      />
      <div
        className={`absolute -right-20 top-40 -z-10 h-72 w-72 rounded-full blur-[110px] ${
          isDark ? "bg-purple-500/15" : "bg-amber-400/10"
        }`}
      />

      <div className={`mx-auto max-w-4xl ${align === "center" ? "text-center" : ""}`}>
        {backHref && (
          <FadeIn>
            <Link
              href={backHref}
              className={`group inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                isDark ? "text-white/50 hover:text-teal-200" : "text-navy-700/60 hover:text-teal-700"
              } ${align === "center" ? "justify-center" : ""}`}
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              {backLabel}
            </Link>
          </FadeIn>
        )}

        <FadeIn delay={backHref ? 0.05 : 0} className={alignClasses}>
          {eyebrow && (
            <span
              className={`font-mono text-xs uppercase tracking-[0.2em] ${
                isDark ? "text-teal-300/70" : "text-teal-700"
              }`}
            >
              {eyebrow}
            </span>
          )}
          <h1
            className={`mt-4 font-display text-4xl font-medium leading-tight sm:text-5xl ${
              isDark ? "text-white" : "text-navy-900"
            }`}
          >
            {title}
          </h1>
          {description && (
            <p
              className={`mt-5 max-w-2xl text-lg leading-relaxed ${
                isDark ? "text-white/65" : "text-navy-700/80"
              } ${align === "center" ? "mx-auto" : ""}`}
            >
              {description}
            </p>
          )}
          {children}
        </FadeIn>
      </div>
    </section>
  );
}
