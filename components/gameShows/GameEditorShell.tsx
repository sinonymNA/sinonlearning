"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wand2, Save, Play, Loader2, AlertTriangle } from "lucide-react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { getGameShowTypeInfo } from "@/data/gameShows";
import { defaultDataForType } from "@/lib/gameShowDefaults";
import type { GameShowData, GameShowType } from "@/lib/gameShowTypes";
import GridEditor from "./GridEditor";
import WheelEditor from "./WheelEditor";
import FeudEditor from "./FeudEditor";
import RaceEditor from "./RaceEditor";
import MemoryEditor from "./MemoryEditor";

export default function GameEditorShell({
  type,
  mode,
  gameShowId,
  initialTitle,
  initialData,
}: {
  type: GameShowType;
  mode: "create" | "edit";
  gameShowId?: string;
  initialTitle?: string;
  initialData?: GameShowData;
}) {
  const router = useRouter();
  const info = getGameShowTypeInfo(type);

  const [title, setTitle] = useState(initialTitle ?? "");
  const [data, setData] = useState<GameShowData>(initialData ?? defaultDataForType(type));
  const [rawContent, setRawContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | undefined>(gameShowId);
  const [, setMyIds] = useLocalStorageState<string[]>("gameShows:myIds", []);

  const generate = async () => {
    if (!rawContent.trim()) {
      setError("Paste in some content first.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/game-shows/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, rawContent }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "AI generation failed. You can fill in the content manually below.");
        return;
      }
      setData(json.data);
    } catch {
      setError("AI generation failed. You can fill in the content manually below.");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!title.trim()) {
      setError("Give your game a title first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const isEdit = mode === "edit" && savedId;
      const res = await fetch(isEdit ? `/api/game-shows/${savedId}` : "/api/game-shows", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, data }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't save the game. Please check your content and try again.");
        return;
      }
      const id = json.gameShow.id as string;
      setSavedId(id);
      if (!isEdit) {
        setMyIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
        router.push(`/game-shows/${id}/edit?saved=1`);
      }
    } catch {
      setError("Couldn't save the game. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const Editor =
    type === "grid"
      ? GridEditor
      : type === "wheel"
        ? WheelEditor
        : type === "feud"
          ? FeudEditor
          : type === "race"
            ? RaceEditor
            : MemoryEditor;

  return (
    <div className="space-y-8">
      {/* Title field */}
      <div>
        <label className="text-sm font-semibold text-slate-700">Game title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`e.g. "Unit 3 Vocabulary ${info?.label ?? "Game"}"`}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* AI generation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Wand2 size={16} className="text-[#1a52f5]" />
          <p className="text-sm font-semibold text-slate-800">Generate with AI (optional)</p>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Paste in vocab, standards, or notes you already have, and we&rsquo;ll turn them into game
          content you can review and edit below.
        </p>
        <textarea
          value={rawContent}
          onChange={(e) => setRawContent(e.target.value)}
          rows={4}
          placeholder="Paste your content here..."
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          onClick={generate}
          disabled={generating}
          className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:text-[#1a52f5] disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          {generating ? "Generating..." : "Generate with AI"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Game content editor */}
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-700">Game content</p>
        <Editor data={data as never} onChange={setData as never} />
      </div>

      {/* Save / play row */}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-[#1a52f5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving..." : "Save game"}
        </button>

        {savedId && (
          <Link
            href={`/play/game-shows/${savedId}`}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:text-[#1a52f5]"
          >
            <Play size={14} />
            Play this game
          </Link>
        )}
      </div>
    </div>
  );
}
