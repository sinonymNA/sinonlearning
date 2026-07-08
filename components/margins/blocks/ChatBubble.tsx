import type { CharacterId } from "@/lib/marginsPracticeCourses";
import CharacterBadge from "./CharacterBadge";

interface Props {
  characterId: CharacterId;
  text: string;
  timestamp?: string;
  align?: "left" | "right";
}

function displayName(characterId: CharacterId): string {
  return characterId.charAt(0).toUpperCase() + characterId.slice(1);
}

// Pale bubble tint per character — a deliberately separate, explicit map
// from CHARACTER_META's badge colors (rather than string-munging the badge
// class) since a solid badge fill and a pale bubble background need
// different shade weights of the same hue.
const BUBBLE_TINT: Record<CharacterId, string> = {
  devon: "bg-teal-50 border-teal-100",
  priya: "bg-violet-50 border-violet-100",
  jonah: "bg-stone-50 border-stone-200",
  marisol: "bg-sky-50 border-sky-100",
  wren: "bg-amber-50 border-amber-100",
};

export default function ChatBubble({ characterId, text, timestamp, align = "left" }: Props) {
  const isRight = align === "right";

  return (
    <div className={`flex items-end gap-2 ${isRight ? "flex-row-reverse" : ""}`}>
      <CharacterBadge characterId={characterId} size="sm" />
      <div className={`flex max-w-[85%] flex-col ${isRight ? "items-end" : "items-start"}`}>
        <span className="mb-0.5 px-1 text-[11px] font-semibold text-stone-500">{displayName(characterId)}</span>
        <div className={`rounded-2xl border px-3.5 py-2.5 text-[14px] leading-relaxed text-stone-800 ${BUBBLE_TINT[characterId]}`}>
          {text}
        </div>
        {timestamp && <span className="mt-0.5 px-1 text-[11px] text-stone-400">{timestamp}</span>}
      </div>
    </div>
  );
}
