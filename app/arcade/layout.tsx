import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./arcade.css";

const display = Fredoka({ variable: "--font-arcade", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Classroom Arcade | Sinon Learning",
  description: "Five original multiplayer party games for the whole class: Hot Potato, Quick Draw, Last One Standing, Telephone and Imposter.",
};

export default function ArcadeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`arcade-root ${display.variable}`}>{children}</div>;
}
