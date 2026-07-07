"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function KoraLabLoginGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function login(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Incorrect password");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-6">
      <form onSubmit={login} className="flex w-full max-w-xs flex-col gap-3 rounded-2xl border border-navy-900/8 bg-white p-6 text-center">
        <Lock size={20} className="mx-auto text-navy-700/40" />
        <p className="text-sm font-semibold text-navy-900">KORA Lab is an internal tool</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="rounded-lg border border-navy-900/12 bg-cream-50 px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-teal-400 disabled:opacity-60"
        >
          Sign in
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>
    </div>
  );
}
