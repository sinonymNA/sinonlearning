"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PotatoSvg from "./PotatoSvg";
import { api } from "./useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
const TABS = [
  { href: "/arcade", icon: "🏠", label: "Home", exact: true },
  { href: "/arcade/join", icon: "🎮", label: "Play" },
  { href: "/arcade/solo", icon: "🕹️", label: "Solo" },
  { href: "/arcade/peak", icon: "⛰️", label: "Peak" },
  { href: "/arcade/shop", icon: "🛍️", label: "Shop" },
  { href: "/arcade/account", icon: "👤", label: "Me" },
];

function Boot({ onDone }: { onDone: () => void }) {
  const [out, setOut] = useState(false);
  const [pct, setPct] = useState(0);
  const tips = ["Warming up the potato…", "Sharpening the crayons…", "Counting the coins…", "Waking the leaderboard…"];
  useEffect(() => {
    const start = performance.now(); const dur = 1700;
    let raf = 0;
    const step = (t: number) => { const f = Math.min(1, (t - start) / dur); setPct(Math.round(f * 100)); if (f < 1) raf = requestAnimationFrame(step); else { setOut(true); setTimeout(onDone, 450); } };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);
  const skip = () => { setOut(true); setTimeout(onDone, 300); };
  return (
    <div className={`boot ${out ? "out" : ""}`} onClick={skip} role="presentation">
      <div className="boot-rays" />
      <div className="boot-potato"><PotatoSvg heat={1} size={150} /></div>
      <h1 className="boot-title" aria-label="Classroom Arcade">{"ARCADE".split("").map((c, i) => <span key={i} style={{ animationDelay: `${300 + i * 90}ms` }}>{c}</span>)}</h1>
      <p className="boot-sub">Classroom Arcade</p>
      <div className="boot-bar" aria-hidden><i style={{ width: `${pct}%` }} /></div>
      <p className="boot-tip">{tips[Math.min(tips.length - 1, Math.floor(pct / 26))]}</p>
      <p className="boot-skip">tap to skip</p>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "/arcade";
  const inRoom = path.startsWith("/arcade/room");
  const [me, setMe] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [boot, setBoot] = useState(false);

  const refresh = useCallback(() => {
    api("/api/arcade/economy", { type: "me" }).then(setMe).catch(() => setMe({ signedIn: false }));
    api("/api/arcade/daily", { type: "get" }).then((d) => setStreak(d.state?.streak ?? 0)).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (inRoom) return;
    refresh();
    window.addEventListener("arcade:refresh", refresh);
    return () => window.removeEventListener("arcade:refresh", refresh);
  }, [inRoom, refresh]);
  useEffect(() => {
    if (path !== "/arcade") return;
    try {
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!calm && !sessionStorage.getItem("arcade:booted")) { sessionStorage.setItem("arcade:booted", "1"); setBoot(true); }
    } catch { /* storage blocked: skip the intro */ }
  }, [path]);

  if (inRoom) return <>{children}</>;
  const tabs = me?.role === "teacher" ? [TABS[0], { href: "/arcade/host", icon: "📺", label: "Host" }, ...TABS.slice(1)] : TABS;
  const active = (t: any) => (t.exact ? path === t.href : path.startsWith(t.href));
  return (
    <div className="app-shell">
      {boot && <Boot onDone={() => setBoot(false)} />}
      <header className="app-top">
        <Link href="/arcade" className="app-logo" aria-label="Arcade home"><span className="app-logo-mark">🥔</span><span>ARCADE</span></Link>
        <div className="app-top-right">
          {streak > 0 && <Link href="/arcade" className="app-chip flame" title="Daily puzzle streak">🔥 {streak}</Link>}
          <Link href="/arcade/shop" className="app-chip" title="Coins">🪙 {me?.signedIn ? me.coins : 0}</Link>
          <Link href="/arcade/account" className="app-chip me" aria-label="Account">{me?.signedIn ? (me.name ?? "Me").slice(0, 10) : "Sign in"}</Link>
        </div>
      </header>
      <div className="app-body" key={path}>{children}</div>
      <nav className="app-bottom" aria-label="Arcade menu">
        {tabs.map((t, i) => <Link key={t.href} href={t.href} className={`app-tab ${active(t) ? "on" : ""}`} aria-current={active(t) ? "page" : undefined} style={{ animationDelay: `${i * 60}ms` }}><span className="app-tab-icon">{t.icon}</span><span className="app-tab-label">{t.label}</span></Link>)}
      </nav>
    </div>
  );
}
