"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Maximize, Minimize } from "lucide-react";

export default function PresentationShell({
  title,
  exitHref = "/game-shows",
  children,
}: {
  title: string;
  exitHref?: string;
  children: React.ReactNode;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clock can't be known until after hydration
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const resetIdle = () => {
      setChromeVisible(true);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setChromeVisible(false), 4000);
    };
    resetIdle();
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("touchstart", resetIdle);
    return () => {
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  return (
    <div className="bg-circuit relative min-h-screen overflow-hidden bg-navy-950">
      <div className="pointer-events-none absolute left-1/3 top-0 -z-10 h-[28rem] w-[28rem] -translate-y-1/3 rounded-full bg-teal-400/20 blur-[130px]" />
      <div className="pointer-events-none absolute -right-20 top-40 -z-10 h-80 w-80 rounded-full bg-purple-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -left-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-[110px]" />

      <div
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 px-5 py-3 transition-opacity duration-500 ${
          chromeVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Link
          href={exitHref}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={13} />
          Exit
        </Link>

        <span className="font-display text-sm font-medium text-white/80">{title}</span>

        <div className="flex items-center gap-2">
          {now && (
            <span className="hidden text-xs tabular-nums text-white/40 md:inline">
              {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
          >
            {fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>

      <div className="relative px-4 pb-28 pt-16 sm:px-8">{children}</div>
    </div>
  );
}
