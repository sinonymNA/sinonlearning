"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ListChecks, TimerIcon, Shuffle, BarChart3, ClipboardCheck } from "lucide-react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import Toolbar, { type WidgetState } from "./Toolbar";
import Panel from "./Panel";
import AgendaWidget from "./AgendaWidget";
import TimerWidget from "./TimerWidget";
import RandomizerWidget from "./RandomizerWidget";
import PollWidget from "./PollWidget";
import ExitTicketWidget from "./ExitTicketWidget";
import VideoBackground from "./VideoBackground";
import VideoPip from "./VideoPip";

const defaultWidgets: WidgetState = {
  agenda: true,
  timer: true,
  randomizer: false,
  poll: false,
  exitTicket: false,
};

const panelConfig: Record<
  keyof WidgetState,
  { title: string; icon: typeof ListChecks; x: number; y: number; width?: number }
> = {
  agenda: { title: "Agenda", icon: ListChecks, x: 40, y: 90 },
  timer: { title: "Timer", icon: TimerIcon, x: 420, y: 90, width: 280 },
  randomizer: { title: "Randomizer", icon: Shuffle, x: 40, y: 420, width: 280 },
  poll: { title: "Poll", icon: BarChart3, x: 420, y: 420, width: 280 },
  exitTicket: { title: "Exit Ticket", icon: ClipboardCheck, x: 760, y: 90, width: 280 },
};

interface PipVideo {
  id: string;
  videoId: string;
}

export default function Classboard() {
  const [mounted, setMounted] = useState(false);
  const [widgets, setWidgets] = useLocalStorageState<WidgetState>(
    "classboard:widgets",
    defaultWidgets
  );
  const [backgroundVideoId, setBackgroundVideoId] = useLocalStorageState<string | null>(
    "classboard:background",
    null
  );
  const [pipVideos, setPipVideos] = useState<PipVideo[]>([]);
  const [zIndices, setZIndices] = useState<Record<string, number>>({});
  const [topZ, setTopZ] = useState(10);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gate first client paint until after hydration so localStorage-derived state never causes a mismatch
    setMounted(true);
  }, []);

  const bringToFront = (id: string) => {
    const newZ = topZ + 1;
    setTopZ(newZ);
    setZIndices((prev) => ({ ...prev, [id]: newZ }));
  };

  const toggleWidget = (key: keyof WidgetState) => {
    setWidgets((prev) => ({ ...prev, [key]: !prev[key] }));
    bringToFront(key);
  };

  const closeWidget = (key: keyof WidgetState) => {
    setWidgets((prev) => ({ ...prev, [key]: false }));
  };

  const addPip = (videoId: string) => {
    const id = `pip-${Date.now()}`;
    setPipVideos((prev) => [...prev, { id, videoId }]);
    bringToFront(id);
  };

  const closePip = (id: string) => {
    setPipVideos((prev) => prev.filter((p) => p.id !== id));
  };

  if (!mounted) {
    return <div className="fixed inset-0 bg-navy-950" />;
  }

  const widgetContent: Record<keyof WidgetState, React.ReactNode> = {
    agenda: <AgendaWidget />,
    timer: <TimerWidget />,
    randomizer: <RandomizerWidget />,
    poll: <PollWidget />,
    exitTicket: <ExitTicketWidget />,
  };

  return (
    <div className="relative z-0 h-screen w-screen overflow-hidden bg-navy-950 text-cream-50">
      {backgroundVideoId && <VideoBackground videoId={backgroundVideoId} />}
      {!backgroundVideoId && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-teal-400/10 blur-[140px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-400/10 blur-[120px]" />
        </div>
      )}

      <Toolbar
        widgets={widgets}
        onToggleWidget={toggleWidget}
        hasBackground={!!backgroundVideoId}
        onSetBackground={(id) => setBackgroundVideoId(id)}
        onSetPip={addPip}
        onClearBackground={() => setBackgroundVideoId(null)}
      />

      <div className="relative h-[calc(100%-3rem)] w-full">
        <AnimatePresence>
          {(Object.keys(widgets) as (keyof WidgetState)[])
            .filter((key) => widgets[key])
            .map((key) => {
              const config = panelConfig[key];
              return (
                <Panel
                  key={key}
                  title={config.title}
                  icon={config.icon}
                  initialX={config.x}
                  initialY={config.y}
                  width={config.width}
                  zIndex={zIndices[key] ?? 10}
                  onFocus={() => bringToFront(key)}
                  onClose={() => closeWidget(key)}
                >
                  {widgetContent[key]}
                </Panel>
              );
            })}

          {pipVideos.map((pip) => (
            <VideoPip
              key={pip.id}
              videoId={pip.videoId}
              zIndex={zIndices[pip.id] ?? 10}
              onFocus={() => bringToFront(pip.id)}
              onClose={() => closePip(pip.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
