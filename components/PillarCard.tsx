import type { LucideIcon } from "lucide-react";

type Tint = "teal" | "rose" | "amber";

const tintClasses: Record<Tint, string> = {
  teal: "bg-teal-50 text-teal-700",
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
};

const tintClassesDark: Record<Tint, string> = {
  teal: "bg-teal-400/10 text-teal-300",
  rose: "bg-rose-400/10 text-rose-300",
  amber: "bg-amber-400/10 text-amber-300",
};

export default function PillarCard({
  icon: Icon,
  title,
  description,
  tint = "teal",
  theme = "light",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tint?: Tint;
  theme?: "light" | "dark";
}) {
  if (theme === "dark") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tintClassesDark[tint]}`}>
          <Icon size={17} />
        </span>
        <p className="mt-4 text-sm font-semibold text-white">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-white/60">{description}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-navy-900/8 bg-white p-6 text-left shadow-[0_1px_2px_rgba(13,27,46,0.04)]">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tintClasses[tint]}`}>
        <Icon size={17} />
      </span>
      <p className="mt-4 text-sm font-semibold text-navy-900">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-navy-700/70">{description}</p>
    </div>
  );
}
