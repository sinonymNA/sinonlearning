import FadeIn from "./FadeIn";

export default function RoadmapCard({
  steps,
  variant = "pills",
  theme = "light",
}: {
  steps: string[];
  variant?: "pills" | "numbered";
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";

  if (variant === "numbered") {
    return (
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {steps.map((step, i) => (
          <FadeIn key={step} delay={i * 0.05}>
            <li
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                isDark
                  ? "border-white/10 bg-white/[0.03] text-white/80"
                  : "border-navy-900/10 bg-white text-navy-800"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isDark ? "bg-teal-400/15 text-teal-300" : "bg-teal-50 text-teal-700"
                }`}
              >
                {i + 1}
              </span>
              {step}
            </li>
          </FadeIn>
        ))}
      </ol>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-3">
          <span
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${
              isDark
                ? "border-white/10 bg-white/5 text-white/80"
                : "border-navy-900/10 bg-white text-navy-800"
            }`}
          >
            {step}
          </span>
          {i < steps.length - 1 && (
            <span className={isDark ? "text-white/20" : "text-navy-900/20"}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}
