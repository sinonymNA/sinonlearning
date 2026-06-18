export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const alignClasses = align === "center" ? "text-center mx-auto" : "text-left";
  const accentClasses = align === "center" ? "mx-auto" : "";

  return (
    <div className={`max-w-2xl ${alignClasses}`}>
      <div className={`mb-4 h-1 w-10 rounded-full bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400 ${accentClasses}`} />
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl sm:text-4xl font-medium text-navy-900 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-navy-700/80 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
