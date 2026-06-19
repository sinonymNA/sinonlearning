import { TrendingUp, Minus, AlertTriangle } from "lucide-react";
import type { StackedEvent, EventCategory } from "@/lib/stackedTypes";

const CATEGORY_STYLE: Record<EventCategory, { icon: typeof TrendingUp; border: string; bg: string; text: string }> = {
  positive: { icon: TrendingUp, border: "border-teal-300/30", bg: "bg-teal-400/10", text: "text-teal-200" },
  neutral: { icon: Minus, border: "border-white/15", bg: "bg-white/5", text: "text-white/70" },
  negative: { icon: AlertTriangle, border: "border-rose-300/30", bg: "bg-rose-400/10", text: "text-rose-200" },
};

export default function StackedEventCard({
  event,
  narrative,
  onChoose,
  onContinue,
}: {
  event: StackedEvent | null;
  narrative: string | null;
  onChoose: (choiceId: string) => void;
  onContinue: () => void;
}) {
  if (narrative) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <p className="text-sm leading-relaxed text-white/75">{narrative}</p>
        <button
          onClick={onContinue}
          className="mt-6 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
        >
          Continue
        </button>
      </div>
    );
  }

  if (!event) return null;
  const style = CATEGORY_STYLE[event.category];
  const Icon = style.icon;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <div className={`flex items-start gap-3 rounded-2xl border ${style.border} ${style.bg} p-4`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${style.border} ${style.bg} ${style.text}`}>
          <Icon size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{event.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/65">{event.prompt}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {event.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => onChoose(choice.id)}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}
