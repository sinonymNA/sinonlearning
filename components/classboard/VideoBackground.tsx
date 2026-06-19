"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function VideoBackground({ videoId }: { videoId: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const command = muted ? "unMute" : "mute";
    iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: command, args: [] }), "*");
    setMuted((m) => !m);
  };

  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&modestbranding=1&playsinline=1&enablejsapi=1`;

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-navy-950">
      <iframe
        ref={iframeRef}
        key={videoId}
        src={src}
        title="Classboard ambient background video"
        allow="autoplay; encrypted-media"
        width="100%"
        height="100%"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2"
      />
      <div className="absolute inset-0 bg-navy-950/35" />

      <button
        onClick={toggleMute}
        className="absolute bottom-5 left-5 z-10 flex items-center gap-2 rounded-full border border-cream-50/15 bg-navy-950/70 px-3.5 py-2 text-xs font-medium text-cream-50 backdrop-blur-md transition-colors hover:bg-navy-950/90"
      >
        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        {muted ? "Enable sound" : "Mute"}
      </button>
    </div>
  );
}
