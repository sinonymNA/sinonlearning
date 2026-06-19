"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import {
  ListChecks,
  TimerIcon,
  Shuffle,
  BarChart3,
  ClipboardCheck,
  Film,
  Maximize,
  Minimize,
  ArrowLeft,
  ImageOff,
} from "lucide-react";
import VideoMenu from "./VideoMenu";

export interface WidgetState {
  agenda: boolean;
  timer: boolean;
  randomizer: boolean;
  poll: boolean;
  exitTicket: boolean;
}

const widgetButtons: { key: keyof WidgetState; label: string; icon: typeof ListChecks }[] = [
  { key: "agenda", label: "Agenda", icon: ListChecks },
  { key: "timer", label: "Timer", icon: TimerIcon },
  { key: "randomizer", label: "Randomizer", icon: Shuffle },
  { key: "poll", label: "Poll", icon: BarChart3 },
  { key: "exitTicket", label: "Exit Ticket", icon: ClipboardCheck },
];

export default function Toolbar({
  widgets,
  onToggleWidget,
  hasBackground,
  onSetBackground,
  onSetPip,
  onClearBackground,
}: {
  widgets: WidgetState;
  onToggleWidget: (key: keyof WidgetState) => void;
  hasBackground: boolean;
  onSetBackground: (id: string) => void;
  onSetPip: (id: string) => void;
  onClearBackground: () => void;
}) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [videoMenuOpen, setVideoMenuOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
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
    <div className="relative z-40 flex items-center justify-between gap-3 border-b border-navy-900/8 bg-cream-50/90 px-4 py-2.5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Link
          href="/tools"
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-navy-700/60 transition-colors hover:bg-navy-900/5 hover:text-navy-900"
        >
          <ArrowLeft size={13} />
          Exit
        </Link>
        <span className="ml-1 hidden font-display text-sm font-medium text-navy-900 sm:inline">
          Classboard
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center gap-1.5">
        {widgetButtons.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onToggleWidget(key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              widgets[key]
                ? "bg-teal-500/15 text-teal-700"
                : "text-navy-700/60 hover:bg-navy-900/5 hover:text-navy-900"
            }`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setVideoMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full bg-navy-900/5 px-3 py-1.5 text-xs font-medium text-navy-800 transition-colors hover:bg-navy-900/10"
          >
            <Film size={13} />
            <span className="hidden sm:inline">Video</span>
          </button>
          <AnimatePresence>
            {videoMenuOpen && (
              <VideoMenu
                onSetBackground={onSetBackground}
                onSetPip={onSetPip}
                onClose={() => setVideoMenuOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {hasBackground && (
          <button
            onClick={onClearBackground}
            aria-label="Remove background video"
            className="flex h-7 w-7 items-center justify-center rounded-full text-navy-700/60 transition-colors hover:bg-navy-900/5 hover:text-navy-900"
          >
            <ImageOff size={14} />
          </button>
        )}

        <span className="hidden text-xs tabular-nums text-navy-700/50 md:inline">
          {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>

        <button
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
          className="flex h-7 w-7 items-center justify-center rounded-full text-navy-700/60 transition-colors hover:bg-navy-900/5 hover:text-navy-900"
        >
          {fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>
      </div>
    </div>
  );
}
