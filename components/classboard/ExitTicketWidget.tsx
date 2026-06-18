"use client";

import { useState } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

export default function ExitTicketWidget() {
  const [prompt, setPrompt] = useLocalStorageState(
    "classboard:exit-ticket",
    "What's one thing you learned today?"
  );
  const [editing, setEditing] = useState(false);

  return (
    <div className="w-64">
      {editing ? (
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={() => setEditing(false)}
          autoFocus
          rows={3}
          className="w-full resize-none rounded-lg border border-cream-50/15 bg-cream-50/5 px-2.5 py-2 text-sm text-cream-50 focus:border-teal-400/50 focus:outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full rounded-xl border border-dashed border-cream-50/15 bg-cream-50/5 px-4 py-6 text-center font-display text-lg leading-snug text-cream-50 transition-colors hover:border-teal-400/40"
        >
          {prompt}
        </button>
      )}
      <p className="mt-2 text-center text-xs text-cream-50/40">Click to edit the prompt</p>
    </div>
  );
}
