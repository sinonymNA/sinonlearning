import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capsule — Live Classroom Games",
  description: "Host a Cap Raid, collect caps, and compete in real time.",
};

export default function CapsuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0600] text-white" style={{ fontFamily: "var(--font-inter)" }}>
      {children}
    </div>
  );
}
