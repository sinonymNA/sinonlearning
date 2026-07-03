"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

interface Props {
  visible: boolean;
  mode: "student" | "teacher_key";
}

export default function PrintAnimation({ visible, mode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !containerRef.current) return;

    const pages = containerRef.current.querySelectorAll<HTMLElement>(".anim-page");

    const anim = animate(pages, {
      keyframes: [
        { translateY: 0, opacity: 0, duration: 100 },
        { translateY: -28, opacity: 1, duration: 300 },
        { translateY: -72, opacity: 1, duration: 700 },
        { translateY: -96, opacity: 0, duration: 300 },
      ],
      delay: stagger(380),
      easing: "easeOutSine",
      loop: true,
    });

    return () => { anim.pause(); };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm">
      {/* Printer + flying pages */}
      <div ref={containerRef} style={{ position: "relative", width: 168, height: 196 }}>

        {/* Three pages that fly out of the slot */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="anim-page"
            style={{
              position: "absolute",
              bottom: 80,
              left: "50%",
              transform: "translateX(-50%)",
              width: 72,
              height: 88,
              background: "white",
              borderRadius: 2,
              boxShadow: "0 3px 12px rgba(0,0,0,0.3)",
              opacity: 0,
            }}
          >
            {/* Simulated text lines on the page */}
            <div style={{ padding: "10px 9px", display: "flex", flexDirection: "column", gap: 5 }}>
              {[100, 70, 90, 55, 80].map((w, j) => (
                <div
                  key={j}
                  style={{
                    height: 2,
                    width: `${w}%`,
                    background: j === 0 ? "#9ca3af" : "#e5e7eb",
                    borderRadius: 1,
                  }}
                />
              ))}
              <div style={{ height: 8 }} />
              {[100, 60, 85].map((w, j) => (
                <div
                  key={j + 5}
                  style={{
                    height: 2,
                    width: `${w}%`,
                    background: "#e5e7eb",
                    borderRadius: 1,
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Paper slot (narrow dark strip at the top of the printer) */}
        <div
          style={{
            position: "absolute",
            bottom: 86,
            left: "50%",
            transform: "translateX(-50%)",
            width: 108,
            height: 5,
            background: "#0f172a",
            borderRadius: 1,
          }}
        />

        {/* Printer body */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 168,
            height: 88,
            background: "#334155",
            borderRadius: 12,
          }}
        >
          {/* Indicator light — violet pulse */}
          <div
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#a78bfa",
              boxShadow: "0 0 10px #a78bfa88",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          {/* Second dim dot */}
          <div
            style={{
              position: "absolute",
              top: 18,
              right: 32,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#475569",
            }}
          />
          {/* Output tray at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 136,
              height: 18,
              background: "#475569",
              borderRadius: "0 0 10px 10px",
            }}
          />
        </div>
      </div>

      {/* Status text */}
      <p className="mt-9 text-sm text-white/70 tracking-wide">
        {mode === "teacher_key" ? "Generating teacher key…" : "Generating your notesheet…"}
      </p>
      <p className="mt-1.5 text-xs text-white/35">This may take a few seconds</p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
