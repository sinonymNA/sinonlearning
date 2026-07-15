"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CapIcon from "@/components/capsule/CapIcon";

interface Me {
  id: string; username: string; role: string; equippedCapId: string; coins: number;
}

export default function CapsulePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-[120px]" />
      </div>

      {/* Logo */}
      <div className="relative mb-10 text-center">
        <div className="mb-3 flex justify-center gap-2">
          {["cap-fox", "cap-dragon", "cap-crown"].map(id => (
            <CapIcon key={id} capId={id} size={40} />
          ))}
        </div>
        <h1
          className="text-[clamp(4rem,18vw,9rem)] leading-none tracking-tight text-white"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          CAPSULE
        </h1>
        <p className="mt-2 text-sm text-orange-300/70">Live classroom games · Collect caps · Win gold</p>
      </div>

      {/* Join by code */}
      <form onSubmit={join} className="relative mb-6 flex w-full max-w-xs flex-col gap-3">
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="ENTER CODE"
          maxLength={6}
          className="w-full rounded-2xl border border-orange-400/25 bg-orange-400/8 px-5 py-4 text-center text-xl font-black tracking-[0.3em] text-white placeholder-white/20 outline-none focus:border-orange-400/60"
        />
        <button
          type="submit"
          disabled={code.trim().length !== 6}
          className="rounded-2xl bg-orange-500 py-4 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
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

      {/* Auth / teacher actions */}
      {loading ? null : !me ? (
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/capsule/login"
            className="rounded-2xl border border-white/15 py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-white/5"
          >
            Sign in
          </Link>
          <Link
            href="/capsule/signup"
            className="rounded-2xl border border-orange-400/30 bg-orange-400/10 py-3.5 text-center text-sm font-bold text-orange-200 transition-colors hover:bg-orange-400/20"
          >
            Create account
          </Link>
        </div>
      ) : (
        <div className="flex w-full max-w-xs flex-col gap-3">
          {/* Logged-in user */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
            <CapIcon capId={me.equippedCapId} size={36} />
            <div>
              <div className="text-sm font-bold text-white">{me.username}</div>
              <div className="text-xs text-orange-300/70">{me.coins} coins</div>
            </div>
          </div>

          {me.role === "teacher" && (
            <Link
              href="/capsule/host"
              className="rounded-2xl bg-orange-500 py-3.5 text-center text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-orange-400"
            >
              Host a Game
            </Link>
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
