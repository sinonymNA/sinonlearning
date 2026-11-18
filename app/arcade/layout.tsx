import type { Metadata } from "next";
import "./fonts.css";
import "./arcade.css";
import AppShell from "@/components/arcade/AppShell";

export const metadata: Metadata = {
  title: "Classroom Arcade | Sinon Learning",
  description: "Daily puzzles, six multiplayer class games and Mastery Peak.",
};

export default function ArcadeLayout({ children }: { children: React.ReactNode }) {
  return <div className="arcade-root"><AppShell>{children}</AppShell></div>;
}
