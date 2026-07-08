import { CHARACTER_META, type CharacterId } from "@/lib/marginsPracticeCourses";

interface Props {
  characterId: CharacterId;
  statusTag?: string;
  size?: "sm" | "md";
}

export default function CharacterBadge({ characterId, statusTag, size = "md" }: Props) {
  const meta = CHARACTER_META[characterId];
  const dims = size === "sm" ? "h-6 w-6 text-[11px]" : "h-8 w-8 text-[13px]";

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`flex ${dims} shrink-0 items-center justify-center rounded-full font-bold ${meta.colorClass}`}
      >
        {meta.initials}
      </span>
      {statusTag && (
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
          {statusTag}
        </span>
      )}
    </span>
  );
}
