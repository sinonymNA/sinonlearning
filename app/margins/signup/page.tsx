"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import MarginsLogo from "@/components/MarginsLogo";
import { useMountReveal } from "@/lib/marginsMotion";

type Role = "teacher" | "student";

export default function MarginsSignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("teacher");
  const [name, setName] = useState("");
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
      const res = await fetch("/api/margins/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Signup failed.");
        return;
      }
      router.push(role === "teacher" ? "/margins/teacher" : "/margins/student");
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
            <h1 className="text-lg font-bold text-stone-900">Create your account</h1>
            <p className="text-[13px] text-stone-400 mt-1">Free for teachers and students.</p>
          </div>

          <div className="form-field grid grid-cols-2 gap-2" style={{ opacity: 0 }}>
            {(["teacher", "student"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={[
                  "rounded-xl border py-2.5 text-sm font-semibold capitalize transition-all",
                  role === r
                    ? "border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-200"
                    : "border-stone-200 bg-white text-stone-500 hover:border-violet-300 hover:text-violet-600",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>

          <label className="form-field flex flex-col gap-1.5" style={{ opacity: 0 }}>
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all"
            />
          </label>

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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all"
            />
            <span className="text-[11px] text-stone-400">At least 8 characters.</span>
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
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="form-field text-center text-[13px] text-stone-400" style={{ opacity: 0 }}>
            Already have an account?{" "}
            <Link href="/margins/login" className="text-violet-600 font-medium hover:text-violet-700">
              Log in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
