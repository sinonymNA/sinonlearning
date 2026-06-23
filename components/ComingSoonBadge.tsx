import { Lock } from "lucide-react";

export default function ComingSoonBadge({
  theme = "light",
  className = "",
}: {
  theme?: "light" | "dark";
  className?: string;
}) {
  const classes =
    theme === "dark"
      ? "border-white/10 bg-white/5 text-white/40"
      : "border-navy-900/10 bg-navy-900/[0.03] text-navy-700/45";

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${classes} ${className}`}
    >
      <Lock size={11} />
      Coming Soon
    </span>
  );
}
