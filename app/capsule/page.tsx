"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CapIcon from "@/components/capsule/CapIcon";

interface Me {
  id: string; email: string; username: string; role: string; equippedCapId: string; coins: number;
}

export default function CapsulePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState<"student" | "teacher" | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    fetch("/api/capsule/auth/me")
      .then(r => r.json())
      .then(d => { setMe(d.user); setLoading(false); });
  }, []);

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length === 6) router.push(`/capsule/play/${c}`);
  };

  async function loginAsDemo(role: "student" | "teacher") {
    setDemoLoading(role);
    const res = await fetch("/api/capsule/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json() as { user?: Me };
    setDemoLoading(null);
    if (data.user) {
      setMe(data.user);
      if (role === "teacher") router.push("/capsule/host");
    }
  }

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/capsule/auth/logout", { method: "POST" });
    setMe(null);
    setSigningOut(false);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/8 blur-[120px]" />
      </div>

      {/* Logo */}
      <div className="relative mb-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/capsule/logo.png" alt="Capsule" className="mx-auto mb-3" style={{ height: "clamp(80px,20vw,130px)", objectFit: "contain" }} />
        <p className="mt-2 text-sm text-white/40">Live classroom games · Collect caps · Win gold</p>
      </div>

      {/* Join by code */}
      <form onSubmit={join} className="relative mb-6 flex w-full max-w-xs flex-col gap-3">
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="ENTER CODE"
          maxLength={6}
          className="w-full rounded-2xl border border-white/12 bg-white/5 px-5 py-4 text-center text-xl font-black tracking-[0.3em] text-white placeholder-white/20 outline-none focus:border-white/30"
        />
        <button
          type="submit"
          disabled={code.trim().length !== 6}
          className="rounded-2xl bg-[#19CDD2] py-4 text-sm font-black uppercase tracking-widest text-[#06163E] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Join Game
        </button>
      </form>

      {/* Divider */}
      <div className="relative mb-6 flex w-full max-w-xs items-center gap-3">
        <div className="h-px flex-1 bg-white/8" />
        <span className="text-xs text-white/25">or</span>
        <div className="h-px flex-1 bg-white/8" />
      </div>

      {loading ? null : !me ? (
        <div className="flex w-full max-w-xs flex-col gap-3">
          {/* Real auth */}
          <Link
            href="/capsule/login"
            className="rounded-2xl border border-white/15 py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-white/5"
          >
            Sign in
          </Link>
          <Link
            href="/capsule/signup"
            className="rounded-2xl border border-white/20 bg-white/5 py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-white/8"
          >
            Create account
          </Link>

          {/* Demo divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Demo</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {/* Demo buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => loginAsDemo("student")}
              disabled={demoLoading !== null}
              className="rounded-xl border border-[#19CDD2]/30 bg-[#19CDD2]/10 py-3 text-xs font-black uppercase tracking-wider text-[#19CDD2] transition-colors hover:bg-[#19CDD2]/20 disabled:opacity-50"
            >
              {demoLoading === "student" ? "…" : "Demo Student"}
            </button>
            <button
              onClick={() => loginAsDemo("teacher")}
              disabled={demoLoading !== null}
              className="rounded-xl border border-[#FF5965]/30 bg-[#FF5965]/10 py-3 text-xs font-black uppercase tracking-wider text-[#FF5965] transition-colors hover:bg-[#FF5965]/20 disabled:opacity-50"
            >
              {demoLoading === "teacher" ? "…" : "Demo Teacher"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-xs flex-col gap-3">
          {/* Logged-in user */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
            <CapIcon capId={me.equippedCapId} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{me.username}</div>
              <div className="text-xs text-white/40 capitalize">{me.role}</div>
            </div>
            <button
              onClick={signOut}
              disabled={signingOut}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-white/40 transition-colors hover:bg-white/8 hover:text-white/70 disabled:opacity-40"
            >
              {signingOut ? "…" : "Sign out"}
            </button>
          </div>

          {me.role === "teacher" && (
            <Link
              href="/capsule/host"
              className="rounded-2xl bg-[#FF5965] py-3.5 text-center text-sm font-black uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            >
              Host a Game
            </Link>
          )}

          <Link
            href="/capsule/open"
            className="rounded-2xl bg-[#19CDD2] py-3.5 text-center text-sm font-black uppercase tracking-widest text-[#06163E] transition-opacity hover:opacity-90"
          >
            Open Capsule
          </Link>

          <Link
            href="/capsule/collection"
            className="rounded-2xl border border-white/12 py-3.5 text-center text-sm font-bold text-white/70 transition-colors hover:bg-white/5"
          >
            My Collection
          </Link>

          {/* Switch demo role */}
          {me.email?.endsWith("@capsule.demo") && (
            <button
              onClick={() => loginAsDemo(me.role === "teacher" ? "student" : "teacher")}
              disabled={demoLoading !== null}
              className="rounded-xl border border-white/10 py-3 text-xs font-bold text-white/40 transition-colors hover:bg-white/5 hover:text-white/60 disabled:opacity-40"
            >
              {demoLoading ? "…" : `Switch to Demo ${me.role === "teacher" ? "Student" : "Teacher"}`}
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <p className="absolute bottom-4 text-[10px] text-white/15">
        A <Link href="/" className="underline decoration-white/10">Sinon Learning</Link> product
      </p>
    </div>
  );
}
