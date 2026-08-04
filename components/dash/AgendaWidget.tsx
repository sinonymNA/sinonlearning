"use client";

import { useState } from "react";
import { Plus, X, GripVertical, Pencil } from "lucide-react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

interface AgendaItem {
  id: string;
  text: string;
  done: boolean;
}

const defaultAgenda: AgendaItem[] = [
  { id: "1", text: "Warm-up question", done: false },
  { id: "2", text: "Mini-lesson: Supply & Demand", done: false },
  { id: "3", text: "Partner practice", done: false },
  { id: "4", text: "Exit ticket", done: false },
];

export default function AgendaWidget({ storageKey = "classboard:agenda" }: { storageKey?: string }) {
  const [items, setItems] = useLocalStorageState<AgendaItem[]>(
    storageKey,
    defaultAgenda
  );
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const addItem = () => {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
    setDraft("");
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const startEditing = (item: AgendaItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const saveEdit = (id: string) => {
    const text = editingText.trim();
    if (text) {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
    }
    setEditingId(null);
    setEditingText("");
  };

  return (
    <div className="w-72">
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-navy-900/5"
          >
            <GripVertical size={12} className="shrink-0 text-navy-700/20" />
            <button
              onClick={() => toggleItem(item.id)}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                item.done
                  ? "border-green-500 bg-green-500"
                  : "border-navy-900/25 hover:border-green-500"
              }`}
              aria-label={item.done ? "Mark incomplete" : "Mark complete"}
            />
            {editingId === item.id ? (
              <input
                autoFocus
                value={editingText}
                onChange={(event) => setEditingText(event.target.value)}
                onBlur={() => saveEdit(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveEdit(item.id);
                  if (event.key === "Escape") setEditingId(null);
                }}
                aria-label="Edit agenda item"
                className="min-w-0 flex-1 rounded-md border border-green-500/40 bg-white px-2 py-1 text-sm text-navy-900 outline-none ring-2 ring-green-500/10"
              />
            ) : (
              <button
                type="button"
                onClick={() => startEditing(item)}
                title="Edit agenda item"
                className={`min-w-0 flex-1 text-left text-sm ${
                  item.done ? "text-navy-700/35 line-through" : "text-navy-900/90"
                }`}
              >
                {item.text}
              </button>
            )}
            <button
              type="button"
              onClick={() => startEditing(item)}
              aria-label={`Edit ${item.text}`}
              className="shrink-0 rounded p-0.5 text-navy-700/0 transition-colors group-hover:text-green-700/60 hover:!text-green-700"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={() => removeItem(item.id)}
              aria-label="Remove item"
              className="shrink-0 rounded p-0.5 text-navy-700/0 transition-colors group-hover:text-navy-700/40 hover:text-navy-900"
            >
              <X size={12} />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-1.5 py-2 text-sm text-navy-700/40">No items yet.</li>
        )}
      </ul>

      <div className="mt-3 flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add agenda item..."
          className="min-w-0 flex-1 rounded-lg border border-navy-900/12 bg-cream-50 px-2.5 py-1.5 text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-green-500/50 focus:outline-none"
        />
        <button
          onClick={addItem}
          aria-label="Add item"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-500 text-navy-950 transition-colors hover:bg-green-400"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
