"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Film, X } from "lucide-react";
import { extractYouTubeId } from "@/lib/youtube";

const suggestions = [
  { label: "Forest cafe lo-fi", query: "forest cafe lofi study music" },
  { label: "Rain on window", query: "rain ambience study" },
  { label: "Cozy fireplace", query: "cozy fireplace ambience" },
];

export default function VideoMenu({
  onSetBackground,
  onSetPip,
  onClose,
}: {
  onSetBackground: (id: string) => void;
  onSetPip: (id: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (mode: "background" | "pip") => {
    const id = extractYouTubeId(url);
    if (!id) {
      setError("Paste a valid YouTube URL or video ID.");
      return;
    }
    setError("");
    if (mode === "background") onSetBackground(id);
    else onSetPip(id);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-navy-900/10 bg-cream-50/98 p-4 shadow-[0_20px_45px_-15px_rgba(13,27,46,0.2)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-navy-900">
          <Film size={15} className="text-teal-600" />
          Add a YouTube video
        </div>
        <button onClick={onClose} className="text-navy-700/40 hover:text-navy-900" aria-label="Close">
          <X size={15} />
        </button>
      </div>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste a YouTube link..."
        className="mt-3 w-full rounded-lg border border-navy-900/12 bg-white px-2.5 py-2 text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-teal-500/50 focus:outline-none"
      />
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => handleSubmit("background")}
          className="flex-1 rounded-lg bg-teal-500 py-2 text-xs font-medium text-navy-950 transition-colors hover:bg-teal-400"
        >
          Set as background
        </button>
        <button
          onClick={() => handleSubmit("pip")}
          className="flex-1 rounded-lg border border-navy-900/12 py-2 text-xs font-medium text-navy-800 transition-colors hover:border-teal-500/40"
        >
          Open as PIP
        </button>
      </div>

      <p className="mt-3 text-xs text-navy-700/40">Try searching for on YouTube:</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <span
            key={s.label}
            className="rounded-full border border-navy-900/10 px-2.5 py-1 text-xs text-navy-700/55"
          >
            {s.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
