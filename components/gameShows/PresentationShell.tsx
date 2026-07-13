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
    <div className="relative min-h-screen bg-white">
      {/* Top chrome bar */}
      <div
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur-md shadow-sm transition-opacity duration-500 ${
          chromeVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Link
          href={exitHref}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-800"
        >
          <ArrowLeft size={13} />
          Exit
        </Link>

        {/* Wordmark */}
        <span className="font-display text-sm font-black">
          <span className="text-[#0d1e4a]">GAME</span>{" "}
          <span className="text-[#1a52f5]">SHOWS</span>
          <span className="ml-2 font-sans text-xs font-medium text-slate-400">— {title}</span>
        </span>

        <div className="flex items-center gap-2">
          {now && (
            <span className="hidden text-xs tabular-nums text-slate-400 md:inline">
              {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:text-slate-700"
          >
            {fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>

      <div className="relative px-4 pb-28 pt-16 sm:px-8">{children}</div>
    </div>
  );
}
