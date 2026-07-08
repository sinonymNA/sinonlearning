import { Sparkles } from "lucide-react";

interface Props {
  text: string;
  label?: string;
}

export default function CalloutCard({ text, label = "Scout's take" }: Props) {
  return (
    <div className="rounded-xl border-l-4 border-teal-400 bg-teal-50/60 py-3 pl-4 pr-4">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-teal-600">
        <Sparkles size={12} />
        {label}
      </p>
      <p className="text-[14px] italic leading-relaxed text-stone-700">{text}</p>
    </div>
  );
}
