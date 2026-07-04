"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarginsLogo from "@/components/MarginsLogo";

export default function MarginsLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/margins/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      router.push(data.user.role === "teacher" ? "/margins/teacher" : "/margins/student");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between">
        <MarginsLogo className="text-xl" />
        <Link href="/margins" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          Back
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-2xl border border-stone-100 bg-white p-7 shadow-xl flex flex-col gap-5"
        >
          <div>
            <h1 className="text-lg font-bold text-stone-900">Log in</h1>
            <p className="text-[13px] text-stone-400 mt-1">Welcome back.</p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 focus:bg-white transition-all"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 focus:bg-white transition-all"
            />
          </label>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-[13px] text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-200 hover:shadow-md transition-all disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>

          <p className="text-center text-[13px] text-stone-400">
            Need an account?{" "}
            <Link href="/margins/signup" className="text-rose-600 font-medium hover:text-rose-700">
              Sign up
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
