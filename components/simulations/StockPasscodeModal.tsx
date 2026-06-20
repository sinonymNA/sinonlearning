"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

export default function StockPasscodeModal({
  mode,
  busy,
  error,
  onSubmit,
  onClose,
}: {
  mode: "save" | "load";
  busy: boolean;
  error: string | null;
  onSubmit: (passcode: string) => void;
  onClose: () => void;
}) {
  const [passcode, setPasscode] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(passcode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-900 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-medium text-white">
            {mode === "save" ? "Save your game" : "Load a saved game"}
          </h3>
          <button onClick={onClose} className="text-white/40 transition-colors hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-sm text-white/60">
          {mode === "save"
            ? "Choose a passcode. You'll use it to load this game later — no account needed."
            : "Enter the passcode you used to save your game."}
        </p>
        <form onSubmit={submit} className="mt-4">
          <input
            type="text"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoFocus
            placeholder="Passcode"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-teal-300/50 focus:outline-none"
          />
          {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={busy || passcode.trim().length < 4}
            className="mt-4 w-full rounded-full bg-teal-300 px-4 py-2 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200 disabled:opacity-40"
          >
            {busy ? "Working..." : mode === "save" ? "Save game" : "Load game"}
          </button>
        </form>
      </div>
    </div>
  );
}
