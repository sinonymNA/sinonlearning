import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capsule — Live Classroom Games",
  description: "Host a Cap Raid, collect caps, and compete in real time.",
};

export default function CapsuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-white" style={{ background: "#06163E", fontFamily: "var(--font-inter)" }}>
      {children}
    </div>
  );
}
