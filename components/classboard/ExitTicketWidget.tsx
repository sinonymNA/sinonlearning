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
          className="w-full resize-none rounded-lg border border-navy-900/12 bg-white px-2.5 py-2 text-sm text-navy-900 focus:border-teal-500/50 focus:outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full rounded-xl border border-dashed border-navy-900/15 bg-white px-4 py-6 text-center font-display text-lg leading-snug text-navy-900 transition-colors hover:border-teal-500/40"
        >
          {prompt}
        </button>
      )}
      <p className="mt-2 text-center text-xs text-navy-700/40">Click to edit the prompt</p>
    </div>
  );
}
