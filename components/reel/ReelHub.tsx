"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Sparkles, Clapperboard, Clock, LayoutGrid } from "lucide-react";
import ReelLogo from "@/components/ReelLogo";
import HowReelWorks from "./HowReelWorks";
import type { ReelProjectRow } from "@/lib/reelDb";

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ReelHub({ name, projects, role = "teacher" }: { name: string; projects: ReelProjectRow[]; role?: "teacher" | "student" }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function createBlank() {
    setCreating(true);
    try {
      const res = await fetch("/api/reel/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) router.push(`/reel/${data.projectId}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="relative flex h-16 items-center justify-between bg-white px-6">
        <Link href="/reel">
          <ReelLogo width={110} />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={role === "teacher" ? "/teachers" : "/students"}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            <LayoutGrid size={13} />
            <span className="hidden sm:inline">All apps</span>
          </Link>
          <span className="hidden text-slate-200 sm:inline">|</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
            {name.charAt(0).toUpperCase()}
          </span>
          <button
            onClick={async () => {
              await fetch("/api/margins/auth/logout", { method: "POST" });
              window.location.href = "/margins/login";
            }}
            className="text-xs text-slate-400 transition-colors hover:text-slate-700"
          >
            Log out
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-sky-400 via-sky-600 to-sky-400" />
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Your videos</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Draft a script with KORA, drop in images, and record your voice-over.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/reel/build"
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-50"
            >
              <Sparkles size={15} className="text-sky-500" /> Script with KORA
            </Link>
            <button
              type="button"
              onClick={createBlank}
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition-all hover:shadow-md disabled:opacity-60"
            >
              <Plus size={15} /> Blank video
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-sm shadow-sky-200">
              <Clapperboard size={22} />
            </span>
            <p className="text-sm font-semibold text-slate-700">No videos yet</p>
            <p className="max-w-xs text-[13px] text-slate-400">
              Start from a short chat with KORA — it drafts the beats and narration, then you record.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/reel/${p.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100"
              >
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-slate-900">
                  <Clapperboard size={26} className="text-sky-400 transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <p className="truncate text-sm font-semibold text-slate-800">{p.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>
                      {p.beats.length} beat{p.beats.length === 1 ? "" : "s"}
                    </span>
                    <span className="text-slate-200">·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {timeAgo(p.updated_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-4">
          <HowReelWorks />
        </div>
      </main>
    </div>
  );
}
