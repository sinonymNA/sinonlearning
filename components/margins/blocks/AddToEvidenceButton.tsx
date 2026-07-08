import { Check, FolderPlus } from "lucide-react";

interface Props {
  saved: boolean;
  onToggle: () => void;
}

// Sits absolutely positioned in the top-right corner of a "collectible"
// evidence block (a wrapping container the call site already marks
// `relative`) — deliberately high-contrast so it reads as clickable at a
// glance, not a subtle icon a student would miss.
export default function AddToEvidenceButton({ saved, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      title={saved ? "Remove from Evidence Folder" : "Add to Evidence Folder"}
      aria-label={saved ? "Remove from Evidence Folder" : "Add to Evidence Folder"}
      className={`absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-transform hover:scale-110 ${
        saved
          ? "border-teal-500 bg-teal-500 text-white"
          : "border-stone-200 bg-white text-stone-500 hover:border-teal-300 hover:text-teal-600"
      }`}
    >
      {saved ? <Check size={14} /> : <FolderPlus size={14} />}
    </button>
  );
}
