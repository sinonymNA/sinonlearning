"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
        <MarginsLogo className="text-lg" />
        <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-widest text-stone-300">
          {role}
        </span>
      </Link>
      <div className="flex items-center gap-4">
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
