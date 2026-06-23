import { Quote } from "lucide-react";

export default function PromiseCard({
  quote,
  attribution,
}: {
  quote: string;
  attribution?: string;
}) {
  return (
    <div className="group relative h-full overflow-hidden rounded-3xl border border-navy-900/8 bg-white p-7 shadow-[0_1px_2px_rgba(13,27,46,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(13,27,46,0.1)]">
      <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400 transition-transform duration-300 group-hover:scale-x-100" />
      <Quote size={20} className="text-teal-600/40" strokeWidth={1.5} />
      <p className="mt-4 font-display text-lg leading-snug text-navy-900">&ldquo;{quote}&rdquo;</p>
      {attribution && <p className="mt-4 text-sm text-navy-700/60">{attribution}</p>}
    </div>
  );
}
