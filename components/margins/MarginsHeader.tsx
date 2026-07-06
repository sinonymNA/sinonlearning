"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import MarginsLogo from "@/components/MarginsLogo";

interface Props {
  name: string;
  role: "teacher" | "student";
  homeHref: string;
}

export default function MarginsHeader({ name, role, homeHref }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/margins/auth/logout", { method: "POST" });
    router.push("/margins");
    router.refresh();
  }

  return (
    <header className="px-6 h-16 flex items-center justify-between border-b border-stone-100 bg-white">
      <Link href={homeHref} className="flex items-center gap-3">
        <MarginsLogo width={100} />
        <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-widest text-stone-300">
          {role}
        </span>
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
        <span className="text-sm text-stone-500">{name}</span>
        <button
          onClick={handleLogout}
          className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
