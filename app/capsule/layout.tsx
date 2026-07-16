import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capsule — Live Classroom Games",
  description: "Host a Cap Raid, collect caps, and compete in real time.",
};

export default function CapsuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-white" style={{ background: "#06163E", fontFamily: "var(--font-inter)" }}>
      <style>{`
        @keyframes cap-pulse {
          0%,100% { opacity:0.55; transform:scale(1); }
          50%      { opacity:1;    transform:scale(1.22); }
        }
        @keyframes cap-ring-rotate {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        @keyframes cap-shimmer {
          0%,100% { left:-65%; }
          40%,60% { left:130%; }
        }
        @keyframes cap-orbit {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
      `}</style>
      {children}
    </div>
  );
}
