"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import ApwhMark from "./ApwhMark";

export default function ApwhHeader({ name, role }: { name?: string; role?: "teacher" | "student" }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/margins/auth/logout", { method: "POST" });
    router.push("/apwh");
    router.refresh();
  }

  return (
    <header className="apwh-header">
      <ApwhMark />
      <nav className="apwh-header-actions" aria-label="Account navigation">
        <Link href="/apwh/privacy" className="apwh-header-link">
          <ShieldCheck size={15} /> Privacy
        </Link>
        {name && (
          <>
            <span className="apwh-user-chip">
              <i>{name.slice(0, 1).toUpperCase()}</i>
              <span><strong>{name}</strong><small>{role}</small></span>
            </span>
            <button type="button" onClick={logout} className="apwh-icon-button" aria-label="Log out">
              <LogOut size={17} />
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
