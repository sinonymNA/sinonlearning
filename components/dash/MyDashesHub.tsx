"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, LayoutDashboard, Clock, Trash2 } from "lucide-react";
import DashLogo from "@/components/DashLogo";

export interface SavedBoard {
  id: string;
  code: string;
  title: string;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function MyDashesHub({ boards }: { boards: SavedBoard[] }) {
  const router = useRouter();
  const [items, setItems] = useState(boards);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/dash/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create dash.");
        return;
      }
      router.push(`/dash?board=${data.boardId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(boardId: string) {
    if (!window.confirm("Delete this dash? Its jamboard and all posts will be gone for good.")) return;
    setError(null);
    setDeletingId(boardId);
    try {
      const res = await fetch(`/api/dash/boards/mine/${boardId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not delete dash.");
        return;
      }
      setItems((prev) => prev.filter((b) => b.id !== boardId));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-grain min-h-screen bg-cream-50 text-navy-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/dash"
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-navy-700/60 transition-colors hover:text-navy-900"
            >
              <ArrowLeft size={13} /> Back to Dash
            </Link>
            <div className="flex items-center gap-3">
              <DashLogo width={72} />
              <h1 className="text-xl font-bold text-navy-900">My Dashes</h1>
            </div>
            <p className="mt-1 text-sm text-navy-700/60">
              Saved jamboards for each of your classes — resume any of them, any time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
          >
            <Plus size={15} /> New dash
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-6 flex flex-wrap items-center gap-2.5 rounded-2xl border border-navy-900/10 bg-white p-4"
          >
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name this dash — e.g. Period 3 World History"
              maxLength={80}
              className="min-w-0 flex-1 rounded-xl border border-navy-900/10 bg-cream-50/60 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/40 focus:border-green-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </form>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-green-600/30 bg-green-500/5 p-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white shadow-sm">
              <LayoutDashboard size={22} />
            </span>
            <p className="text-sm font-semibold text-navy-900">No saved dashes yet</p>
            <p className="max-w-xs text-[13px] text-navy-700/60">
              Create one per class — each keeps its own jamboard and join code so students can pick up where
              they left off.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((board) => (
              <div
                key={board.id}
                className="group relative rounded-2xl border border-navy-900/10 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-green-600/40 hover:shadow-lg hover:shadow-green-500/10"
              >
                <Link href={`/dash?board=${board.id}`} className="block">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15 text-green-700">
                      <LayoutDashboard size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy-900">{board.title}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-navy-700/50">
                        <span>
                          Join code <span className="font-bold tracking-widest text-green-700">{board.code}</span>
                        </span>
                        <span className="text-navy-900/15">·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {formatDate(board.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(board.id)}
                  disabled={deletingId === board.id}
                  aria-label={`Delete ${board.title}`}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-navy-700/30 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
