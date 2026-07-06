"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import SliderLogo from "@/components/SliderLogo";

export default function SliderHeader({ name }: { name: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/margins/auth/logout", { method: "POST" });
    router.push("/slider");
    router.refresh();
  }

  return (
    <header className="px-6 h-16 flex items-center justify-between border-b border-stone-100 bg-white">
      <Link href="/slider" className="flex items-center gap-3">
        <SliderLogo width={110} />
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-stone-500">{name}</span>
        <button onClick={handleLogout} className="text-xs text-stone-400 hover:text-stone-700 transition-colors">
          Log out
        </button>
      </div>
    </header>
  );
}
