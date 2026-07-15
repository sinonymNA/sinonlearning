"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CapsuleLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/capsule/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Login failed."); return; }
    router.push("/capsule");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/capsule" className="mb-8 text-2xl font-black tracking-tight text-orange-400" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.08em" }}>
        CAPSULE
      </Link>
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="mb-1 text-xl font-black text-white">Sign in</h1>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-400/60" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-400/60" />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="rounded-xl bg-orange-500 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-400 disabled:opacity-40">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-xs text-white/30">
          No account? <Link href="/capsule/signup" className="text-orange-400 hover:text-orange-300">Create one</Link>
        </p>
      </form>
    </div>
  );
}
