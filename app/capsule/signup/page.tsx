"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CapsuleSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/capsule/auth/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password, role }),
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Signup failed."); return; }
    router.push("/capsule");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/capsule" className="mb-8 text-2xl font-black text-orange-400" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.08em" }}>
        CAPSULE
      </Link>
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="mb-1 text-xl font-black text-white">Create account</h1>

        {/* Role toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          {(["student", "teacher"] as const).map(r => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`rounded-lg py-2 text-xs font-black uppercase tracking-widest transition-colors ${role === r ? "bg-orange-500 text-white" : "text-white/40 hover:text-white/70"}`}
            >
              {r}
            </button>
          ))}
        </div>

        <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username (3–20 chars)" required
          className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-400/60" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required
          className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-400/60" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (8+ chars)" required
          className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-400/60" />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button type="submit" disabled={loading} className="rounded-xl bg-orange-500 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-400 disabled:opacity-40">
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-xs text-white/30">
          Have an account? <Link href="/capsule/login" className="text-orange-400 hover:text-orange-300">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
