"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import SliderLogo from "@/components/SliderLogo";

export default function SliderHeader({ name, role = "teacher" }: { name: string; role?: "teacher" | "student" }) {
  async function handleLogout() {
    await fetch("/api/margins/auth/logout", { method: "POST" });
    // Hard navigation: the header can be mounted on /slider itself, where a
    // client-side push to the same URL is a no-op and leaves stale UI up.
    window.location.href = "/margins/login";
  }

  return (
    <header className="relative px-6 h-16 flex items-center justify-between bg-white">
      <Link href="/slider" className="flex items-center gap-3">
        <SliderLogo width={110} />
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href={role === "teacher" ? "/teachers" : "/students"}
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors"
        >
          <LayoutGrid size={13} />
          <span className="hidden sm:inline">All apps</span>
        </Link>
        <span className="hidden text-stone-200 sm:inline">|</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slider-100 text-[11px] font-bold text-slider-700">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:inline text-sm text-stone-500">{name}</span>
        <button onClick={handleLogout} className="text-xs text-stone-400 hover:text-stone-700 transition-colors">
          Log out
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-slider-400 via-slider-600 to-slider-400" />
    </header>
  );
}
