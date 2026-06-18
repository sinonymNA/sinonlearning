import type { LucideIcon } from "lucide-react";
import { ImageIcon } from "lucide-react";

type Variant = "teal" | "amber" | "navy";

const variantClasses: Record<Variant, string> = {
  teal: "from-teal-600 via-navy-800 to-navy-950",
  amber: "from-amber-500 via-navy-800 to-navy-950",
  navy: "from-navy-700 via-navy-800 to-navy-950",
};

/**
 * Renders a real photo when `src` is provided. Until then, shows a
 * tasteful gradient placeholder so the layout reads as finished.
 * Swap in a photo later by passing `src` (and ideally `alt`).
 */
export default function PhotoSlot({
  src,
  alt = "",
  variant = "teal",
  icon: Icon = ImageIcon,
  className = "",
}: {
  src?: string;
  alt?: string;
  variant?: Variant;
  icon?: LucideIcon;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`h-full w-full rounded-[28px] object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-br ${variantClasses[variant]} ${className}`}
    >
      <div className="bg-grain absolute inset-0 opacity-20" />
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-12 -right-8 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />
      <Icon size={28} className="relative text-cream-50/35" strokeWidth={1.5} />
    </div>
  );
}
