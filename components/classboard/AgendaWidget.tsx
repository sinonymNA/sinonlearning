"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
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

export default function AgendaWidget() {
  const [items, setItems] = useLocalStorageState<AgendaItem[]>(
    "classboard:agenda",
    defaultAgenda
  );
  const [draft, setDraft] = useState("");

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

  return (
    <div className="w-72">
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-cream-50/5"
          >
            <GripVertical size={12} className="shrink-0 text-cream-50/20" />
            <button
              onClick={() => toggleItem(item.id)}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                item.done
                  ? "border-teal-400 bg-teal-400"
                  : "border-cream-50/30 hover:border-teal-300"
              }`}
              aria-label={item.done ? "Mark incomplete" : "Mark complete"}
            />
            <span
              className={`flex-1 text-sm ${
                item.done ? "text-cream-50/35 line-through" : "text-cream-50/90"
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              aria-label="Remove item"
              className="shrink-0 rounded p-0.5 text-cream-50/0 transition-colors group-hover:text-cream-50/40 hover:text-cream-50"
            >
              <X size={12} />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-1.5 py-2 text-sm text-cream-50/40">No items yet.</li>
        )}
      </ul>

      <div className="mt-3 flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add agenda item..."
          className="min-w-0 flex-1 rounded-lg border border-cream-50/15 bg-cream-50/5 px-2.5 py-1.5 text-sm text-cream-50 placeholder:text-cream-50/30 focus:border-teal-400/50 focus:outline-none"
        />
        <button
          onClick={addItem}
          aria-label="Add item"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-navy-950 transition-colors hover:bg-teal-400"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
