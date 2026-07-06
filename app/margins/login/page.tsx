"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { animate } from "animejs";
import MarginsLogo from "@/components/MarginsLogo";
import { useMountReveal } from "@/lib/marginsMotion";

// Only relative, single-segment-leading-slash paths are honored (never "//host"
// or "https://...") so this can't be turned into an open redirect.
function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export default function MarginsLoginPage() {
  return (
    <Suspense fallback={null}>
      <MarginsLoginForm />
    </Suspense>
  );
}

function MarginsLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formRef.current) {
      animate(formRef.current, { opacity: [0, 1], scale: [0.97, 1], duration: 380, easing: "outQuart" });
    }
  }, []);
  useMountReveal(formRef, ".form-field", { stagger: 70, translateY: 14, delay: 120, duration: 380 });

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
      router.push(next ?? (data.user.role === "teacher" ? "/margins/teacher" : "/margins/student"));
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
        <MarginsLogo width={110} />
        <Link href="/margins" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          Back
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          style={{ opacity: 0 }}
          className="w-full max-w-sm rounded-2xl border border-stone-100 bg-white p-7 shadow-xl flex flex-col gap-5"
        >
          <div className="form-field" style={{ opacity: 0 }}>
            <h1 className="text-lg font-bold text-stone-900">Log in</h1>
            <p className="text-[13px] text-stone-400 mt-1">Welcome back.</p>
          </div>

          <label className="form-field flex flex-col gap-1.5" style={{ opacity: 0 }}>
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all"
            />
          </label>

          <label className="form-field flex flex-col gap-1.5" style={{ opacity: 0 }}>
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all"
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
            className="form-field rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:shadow-md transition-all disabled:opacity-60"
            style={{ opacity: 0 }}
          >
            {loading ? "Logging in…" : "Log in"}
          </button>

          <p className="form-field text-center text-[13px] text-stone-400" style={{ opacity: 0 }}>
            Need an account?{" "}
            <Link
              href={next ? `/margins/signup?next=${encodeURIComponent(next)}` : "/margins/signup"}
              className="text-violet-600 font-medium hover:text-violet-700"
            >
              Sign up
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
