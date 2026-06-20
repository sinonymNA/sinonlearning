"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Lock, LogOut, PenSquare } from "lucide-react";

export default function TextbookAdminBar() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => setIsAdmin(!!data.isAdmin))
      .finally(() => setChecking(false));
  }, []);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword("");
    } else {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error ?? "Incorrect password");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAdmin(false);
  };

  if (checking) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {isAdmin ? (
        <>
          <Link
            href="/textbooks/new"
            className="flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-400"
          >
            <PenSquare size={14} />
            New textbook
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-navy-700/60 transition-colors hover:text-navy-900"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </>
      ) : showLogin ? (
        <form onSubmit={login} className="flex items-center gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
            className="rounded-lg border border-navy-900/12 bg-white px-3 py-1.5 text-sm text-navy-900 focus:border-teal-500/50 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-teal-500 px-3 py-1.5 text-xs font-medium text-navy-950 transition-colors hover:bg-teal-400"
          >
            Sign in
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowLogin(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-navy-700/40 transition-colors hover:text-navy-900"
        >
          <Lock size={12} />
          Admin
        </button>
      )}
      {loginError && <p className="text-sm text-rose-600">{loginError}</p>}
    </div>
  );
}
