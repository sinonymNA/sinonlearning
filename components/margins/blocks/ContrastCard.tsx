interface Props {
  weak: string;
  strong: string;
  weakNote?: string;
  strongNote?: string;
}

export default function ContrastCard({ weak, strong, weakNote, strongNote }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[11px] font-bold text-stone-500">
          ✕
        </span>
        <div>
          <p className="text-[13px] leading-relaxed text-stone-600">{weak}</p>
          {weakNote && <p className="mt-1 text-[11px] italic text-stone-400">{weakNote}</p>}
        </div>
      </div>
      <div className="flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50 p-3.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500 text-[11px] font-bold text-white">
          ✓
        </span>
        <div>
          <p className="text-[13px] leading-relaxed text-stone-800">{strong}</p>
          {strongNote && <p className="mt-1 text-[11px] italic text-teal-600">{strongNote}</p>}
        </div>
      </div>
    </div>
  );
}
